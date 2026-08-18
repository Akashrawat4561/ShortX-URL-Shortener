import QRCode from 'qrcode';
import useragent from 'express-useragent';
import Url from '../models/Url.js';
import { getFallbackState } from '../config/db.js';
import { memoryStore } from '../store/memoryStore.js';
import { generateShortCode, isValidHttpUrl } from '../utils/generateCode.js';

const getBaseUrl = (req) => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  return `${req.protocol}://${req.get('host')}`;
};

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  return `${req.protocol}://${req.get('host')}`;
};

// Parse User-Agent into device, browser, OS
const parseUserAgent = (uaString) => {
  const source = uaString || '';
  const agent = useragent.parse(source);

  let device = 'Desktop';
  if (agent.isMobile) device = 'Mobile';
  else if (agent.isTablet) device = 'Tablet';

  let browser = agent.browser || 'Unknown';
  if (browser === 'UNKNOWN') browser = 'Other';

  let os = agent.os || 'Unknown';
  if (os === 'UNKNOWN') os = 'Other';

  return { device, browser, os };
};

// Clean referrer string to friendly source
const parseReferrer = (ref) => {
  if (!ref || ref === 'Direct') return 'Direct';
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host.includes('google')) return 'Google';
    if (host.includes('github')) return 'GitHub';
    if (host.includes('twitter') || host.includes('x.com')) return 'Twitter / X';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('youtube')) return 'YouTube';
    if (host.includes('reddit')) return 'Reddit';
    return host.replace('www.', '');
  } catch (_) {
    return 'Web Search / Direct';
  }
};

// Check Custom Alias Availability
export const checkAliasAvailability = async (req, res) => {
  try {
    const { alias } = req.params;
    if (!alias || typeof alias !== 'string') {
      return res.status(400).json({ success: false, error: 'Alias parameter is required' });
    }

    const sanitizedAlias = alias.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitizedAlias.length < 3 || sanitizedAlias.length > 30) {
      return res.status(400).json({
        success: false,
        available: false,
        error: 'Alias must be between 3 and 30 alphanumeric characters'
      });
    }

    const existing = getFallbackState()
      ? await memoryStore.findOne({ shortCode: sanitizedAlias })
      : await Url.findOne({ $or: [{ shortCode: sanitizedAlias }, { customAlias: sanitizedAlias }] });

    if (existing) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `Alias '/${sanitizedAlias}' is already taken`
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message: `Alias '/${sanitizedAlias}' is available!`
    });
  } catch (error) {
    console.error('[checkAliasAvailability Error]', error);
    return res.status(500).json({ success: false, error: 'Server error while checking alias' });
  }
};

// Create Short URL
export const createShortUrl = async (req, res) => {
  try {
    let { originalUrl, customAlias, expiresInHours } = req.body;
    const userId = req.user ? req.user.id || req.user._id : null;

    if (!originalUrl || typeof originalUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Original URL is required' });
    }

    originalUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = `https://${originalUrl}`;
    }

    if (!isValidHttpUrl(originalUrl)) {
      return res.status(400).json({ success: false, error: 'Invalid URL format provided' });
    }

    let shortCode;
    let aliasUsed = null;

    if (customAlias && customAlias.trim()) {
      const sanitizedAlias = customAlias.trim().replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedAlias.length < 3 || sanitizedAlias.length > 30) {
        return res.status(400).json({
          success: false,
          error: 'Custom alias must be 3-30 characters (letters, numbers, hyphen, underscore)'
        });
      }

      // Check collision
      const existing = getFallbackState()
        ? await memoryStore.findOne({ shortCode: sanitizedAlias })
        : await Url.findOne({ $or: [{ shortCode: sanitizedAlias }, { customAlias: sanitizedAlias }] });

      if (existing) {
        return res.status(409).json({ success: false, error: `Custom alias '/${sanitizedAlias}' is already taken` });
      }

      shortCode = sanitizedAlias;
      aliasUsed = sanitizedAlias;
    } else {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        shortCode = generateShortCode(6);
        const existing = getFallbackState()
          ? await memoryStore.findOne({ shortCode })
          : await Url.findOne({ shortCode });
        if (!existing) isUnique = true;
        attempts++;
      }
    }

    let expiresAt = null;
    if (expiresInHours && !isNaN(expiresInHours) && Number(expiresInHours) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000);
    }

    const baseUrl = getBaseUrl(req);
    const shortUrl = `${baseUrl}/${shortCode}`;

    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
        margin: 2,
        color: { dark: '#4f46e5', light: '#ffffff' }
      });
    } catch (err) {
      console.error('[QRCode Error]', err);
    }

    let record;
    if (getFallbackState()) {
      record = await memoryStore.create({
        userId,
        originalUrl,
        shortCode,
        customAlias: aliasUsed,
        expiresAt
      });
    } else {
      record = await Url.create({
        userId,
        originalUrl,
        shortCode,
        customAlias: aliasUsed,
        expiresAt
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: record._id,
        userId: record.userId,
        originalUrl: record.originalUrl,
        shortCode: record.shortCode,
        shortUrl,
        customAlias: record.customAlias,
        qrCode: qrCodeDataUrl,
        clicks: record.clicks,
        isActive: record.isActive !== undefined ? record.isActive : true,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt
      }
    });
  } catch (error) {
    console.error('[createShortUrl Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error while shortening URL' });
  }
};

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Redirect to Original URL & Track Analytics
export const redirectToOriginal = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const record = getFallbackState()
      ? await memoryStore.findOne({ shortCode })
      : await Url.findOne({ $or: [{ shortCode }, { customAlias: shortCode }] });

    if (!record) {
      const safeCode = escapeHtml(shortCode);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 - Link Not Found</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #06070a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #0f172a; padding: 2.5rem; border-radius: 16px; text-align: center; max-width: 420px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
              h1 { color: #f43f5e; margin-top: 0; font-size: 24px; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
              a { display: inline-block; margin-top: 16px; padding: 10px 20px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Not Found</h1>
              <p>The short code <strong>${safeCode}</strong> does not exist or has been deleted.</p>
              <a href="${getFrontendUrl(req)}">Return to ShortX</a>
            </div>
          </body>
        </html>
      `);
    }

    if (record.isActive === false) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Disabled</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #06070a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #0f172a; padding: 2.5rem; border-radius: 16px; text-align: center; max-width: 420px; border: 1px solid rgba(255,255,255,0.08); }
              h1 { color: #fbbf24; margin-top: 0; }
              p { color: #94a3b8; font-size: 14px; }
              a { display: inline-block; margin-top: 16px; padding: 10px 20px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Deactivated</h1>
              <p>This link has been temporarily disabled by its owner.</p>
              <a href="${getFrontendUrl(req)}">Return to ShortX</a>
            </div>
          </body>
        </html>
      `);
    }

    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>410 - Link Expired</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #06070a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #0f172a; padding: 2.5rem; border-radius: 16px; text-align: center; max-width: 420px; border: 1px solid rgba(255,255,255,0.08); }
              h1 { color: #fbbf24; margin-top: 0; }
              p { color: #94a3b8; font-size: 14px; }
              a { display: inline-block; margin-top: 16px; padding: 10px 20px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Expired</h1>
              <p>This shortened URL reached its expiration time and is no longer active.</p>
              <a href="${getFrontendUrl(req)}">Return to ShortX</a>
            </div>
          </body>
        </html>
      `);
    }

    // Extract visitor telemetry
    const rawUa = req.headers['user-agent'] || '';
    const { device, browser, os } = parseUserAgent(rawUa);
    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const referrerStr = parseReferrer(req.get('referrer') || req.get('referer'));

    // Quick location estimate (defaulting cleanly for local dev)
    const country = rawIp.includes('127.0.0.1') || rawIp.includes('::1') ? 'Local / Direct' : 'Global Visitor';

    const analyticsEntry = {
      timestamp: new Date(),
      ip: rawIp,
      country,
      device,
      browser,
      os,
      referrer: referrerStr,
      userAgent: rawUa
    };

    if (getFallbackState()) {
      await memoryStore.updateClicksAndAnalytics(record.shortCode, analyticsEntry);
    } else {
      record.clicks += 1;
      record.lastClickedAt = new Date();
      record.analytics.push(analyticsEntry);
      await record.save();
    }

    return res.redirect(302, record.originalUrl);
  } catch (error) {
    console.error('[redirectToOriginal Error]', error);
    return res.status(500).send('Internal server error');
  }
};

// Get user-owned URLs (Logged in user dashboard)
export const getUserUrls = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const baseUrl = getBaseUrl(req);

    const records = getFallbackState()
      ? await memoryStore.find({ userId })
      : await Url.find({ userId }).sort({ createdAt: -1 });

    const data = await Promise.all(
      records.map(async (rec) => {
        const shortUrl = `${baseUrl}/${rec.customAlias || rec.shortCode}`;
        let qrCode = '';
        try {
          qrCode = await QRCode.toDataURL(shortUrl, { margin: 2, color: { dark: '#4f46e5', light: '#ffffff' } });
        } catch (_) {}

        return {
          id: rec._id,
          userId: rec.userId,
          originalUrl: rec.originalUrl,
          shortCode: rec.shortCode,
          shortUrl,
          customAlias: rec.customAlias,
          clicks: rec.clicks || 0,
          isActive: rec.isActive !== undefined ? rec.isActive : true,
          lastClickedAt: rec.lastClickedAt,
          qrCode,
          createdAt: rec.createdAt,
          expiresAt: rec.expiresAt,
          analyticsCount: rec.analytics ? rec.analytics.length : 0
        };
      })
    );

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('[getUserUrls Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user URLs' });
  }
};

// Get all URLs (Public recent links fallback)
export const getAllUrls = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);

    const records = getFallbackState()
      ? await memoryStore.find()
      : await Url.find().sort({ createdAt: -1 }).limit(100);

    const data = await Promise.all(
      records.map(async (rec) => {
        const shortUrl = `${baseUrl}/${rec.customAlias || rec.shortCode}`;
        let qrCode = '';
        try {
          qrCode = await QRCode.toDataURL(shortUrl, { margin: 2, color: { dark: '#4f46e5', light: '#ffffff' } });
        } catch (_) {}

        return {
          id: rec._id,
          originalUrl: rec.originalUrl,
          shortCode: rec.shortCode,
          shortUrl,
          customAlias: rec.customAlias,
          clicks: rec.clicks || 0,
          isActive: rec.isActive !== undefined ? rec.isActive : true,
          lastClickedAt: rec.lastClickedAt,
          qrCode,
          createdAt: rec.createdAt,
          expiresAt: rec.expiresAt,
          analyticsCount: rec.analytics ? rec.analytics.length : 0
        };
      })
    );

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('[getAllUrls Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch URLs' });
  }
};

// Detailed Analytics statistics for a specific URL
export const getUrlStats = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const baseUrl = getBaseUrl(req);

    const record = getFallbackState()
      ? await memoryStore.findOne({ shortCode })
      : await Url.findOne({ $or: [{ shortCode }, { customAlias: shortCode }] });

    if (!record) {
      return res.status(404).json({ success: false, error: 'Short URL not found' });
    }

    const shortUrl = `${baseUrl}/${record.customAlias || record.shortCode}`;
    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(shortUrl, { margin: 2, color: { dark: '#4f46e5', light: '#ffffff' } });
    } catch (_) {}

    const analytics = record.analytics || [];
    const totalClicks = record.clicks || analytics.length;

    // Calculate unique visitors (by IP)
    const uniqueIps = new Set(analytics.map(item => item.ip));
    const uniqueVisitors = uniqueIps.size;

    // Today's clicks
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todaysClicks = analytics.filter(item => new Date(item.timestamp) >= startOfToday).length;

    // Last 7 days' clicks
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysClicks = analytics.filter(item => new Date(item.timestamp) >= sevenDaysAgo).length;

    // Breakdowns
    const devices = {};
    const browsers = {};
    const osBreakdown = {};
    const referrers = {};
    const countries = {};
    const clicksOverTimeMap = {};

    // Pre-fill last 7 dates for chart
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      clicksOverTimeMap[dateStr] = 0;
    }

    analytics.forEach(item => {
      const dev = item.device || 'Desktop';
      devices[dev] = (devices[dev] || 0) + 1;

      const br = item.browser || 'Other';
      browsers[br] = (browsers[br] || 0) + 1;

      const sys = item.os || 'Other';
      osBreakdown[sys] = (osBreakdown[sys] || 0) + 1;

      const ref = item.referrer || 'Direct';
      referrers[ref] = (referrers[ref] || 0) + 1;

      const country = item.country || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;

      // Group date
      const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (clicksOverTimeMap[dateStr] !== undefined) {
        clicksOverTimeMap[dateStr] += 1;
      }
    });

    const clicksOverTime = Object.keys(clicksOverTimeMap).map(date => ({
      date,
      clicks: clicksOverTimeMap[date]
    }));

    return res.status(200).json({
      success: true,
      data: {
        id: record._id,
        originalUrl: record.originalUrl,
        shortCode: record.shortCode,
        shortUrl,
        customAlias: record.customAlias,
        clicks: totalClicks,
        uniqueVisitors,
        todaysClicks,
        last7DaysClicks,
        isActive: record.isActive !== undefined ? record.isActive : true,
        lastClickedAt: record.lastClickedAt,
        qrCode,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        breakdown: {
          devices,
          browsers,
          os: osBreakdown,
          referrers,
          countries,
          clicksOverTime
        },
        recentClicks: analytics.slice(-25).reverse()
      }
    });
  } catch (error) {
    console.error('[getUrlStats Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch URL analytics' });
  }
};

// Update URL options (originalUrl, customAlias, isActive)
export const updateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalUrl, customAlias, isActive } = req.body;
    const userId = req.user ? req.user.id || req.user._id : null;

    let record = getFallbackState()
      ? await memoryStore.findById(id)
      : await Url.findById(id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'URL record not found' });
    }

    if (record.userId && String(record.userId) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this link' });
    }

    const updates = {};
    if (originalUrl) {
      let cleanUrl = originalUrl.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
      if (!isValidHttpUrl(cleanUrl)) {
        return res.status(400).json({ success: false, error: 'Invalid destination URL format' });
      }
      updates.originalUrl = cleanUrl;
    }

    if (customAlias !== undefined) {
      if (customAlias && customAlias.trim()) {
        const sanitized = customAlias.trim().replace(/[^a-zA-Z0-9_-]/g, '');
        if (sanitized !== record.customAlias) {
          const existing = getFallbackState()
            ? await memoryStore.findOne({ shortCode: sanitized })
            : await Url.findOne({ $or: [{ shortCode: sanitized }, { customAlias: sanitized }] });
          if (existing) {
            return res.status(409).json({ success: false, error: 'Custom alias is already taken' });
          }
          updates.customAlias = sanitized;
        }
      } else {
        updates.customAlias = null;
      }
    }

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
    }

    if (getFallbackState()) {
      record = await memoryStore.updateById(id, updates);
    } else {
      Object.assign(record, updates);
      await record.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Link updated successfully',
      data: record
    });
  } catch (error) {
    console.error('[updateUrl Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to update link' });
  }
};

// Delete URL
export const deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id || req.user._id : null;

    let record = getFallbackState()
      ? await memoryStore.findById(id)
      : await Url.findById(id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'URL record not found' });
    }

    if (record.userId && String(record.userId) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this link' });
    }

    if (getFallbackState()) {
      await memoryStore.deleteById(id);
    } else {
      await Url.findByIdAndDelete(id);
    }

    return res.status(200).json({ success: true, message: 'URL successfully deleted' });
  } catch (error) {
    console.error('[deleteUrl Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to delete URL' });
  }
};
