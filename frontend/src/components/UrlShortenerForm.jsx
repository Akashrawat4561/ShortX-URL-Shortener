import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Lock, 
  Check, 
  AlertCircle, 
  Loader2, 
  Globe,
  Sliders
} from 'lucide-react';
import { API_BASE } from '../utils/api';

export const UrlShortenerForm = ({ onShortenSuccess, onError, user, onOpenAuth }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Alias checking state
  const [aliasChecking, setAliasChecking] = useState(false);
  const [aliasAvailable, setAliasAvailable] = useState(null); // null | true | false
  const [aliasMessage, setAliasMessage] = useState('');

  // Live custom alias availability check
  useEffect(() => {
    if (!customAlias || !customAlias.trim()) {
      setAliasAvailable(null);
      setAliasMessage('');
      return;
    }

    const sanitized = customAlias.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized.length < 3) {
      setAliasAvailable(false);
      setAliasMessage('Alias must be at least 3 characters');
      return;
    }

    const timer = setTimeout(async () => {
      setAliasChecking(true);
      try {
        const res = await fetch(`${API_BASE}/api/urls/check-alias/${encodeURIComponent(sanitized)}`);
        const data = await res.json();
        if (data.success) {
          setAliasAvailable(data.available);
          setAliasMessage(data.message);
        } else {
          setAliasAvailable(false);
          setAliasMessage(data.error || 'Alias unavailable');
        }
      } catch (err) {
        console.error('Alias check failed:', err);
        setAliasAvailable(null);
      } finally {
        setAliasChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customAlias]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originalUrl.trim()) return;

    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('shortx_token') || localStorage.getItem('slicelink_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        originalUrl: originalUrl.trim(),
        customAlias: customAlias.trim() || undefined,
        expiresInHours: expiresInHours ? Number(expiresInHours) : undefined
      };

      const res = await fetch(`${API_BASE}/api/urls`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      onShortenSuccess(data.data);
      setOriginalUrl('');
      setCustomAlias('');
      setExpiresInHours('');
      setAliasAvailable(null);
    } catch (err) {
      console.error('[Shorten Submit Error]', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shortener-form">
      {/* Main Long URL Input Bar */}
      <div className="main-input-group">
        <div className="input-icon-left">
          <Globe size={18} />
        </div>
        <input
          type="url"
          className="url-input"
          placeholder="Paste long URL (e.g., https://example.com/products/smartphones)..."
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
        />
        <button 
          type="submit" 
          className="shorten-btn"
          disabled={loading || !originalUrl.trim() || (aliasAvailable === false && Boolean(customAlias))}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="spinning" />
              <span>Shortening...</span>
            </>
          ) : (
            <>
              <span>Shorten URL</span>
            </>
          )}
        </button>
      </div>

      {/* Advanced Options Bar */}
      <div className="form-sub-header">
        <button
          type="button"
          className="toggle-advanced-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Sliders size={14} />
          <span>{showAdvanced ? 'Hide Options' : 'Custom Alias & Expiration'}</span>
        </button>

        {!user && (
          <div className="guest-notice">
            <span>Guest mode</span>
            <button type="button" className="inline-login-btn" onClick={() => onOpenAuth('login')}>
              Sign In
            </button>
          </div>
        )}
      </div>

      {showAdvanced && (
        <div className="advanced-options-card">
          <div className="options-grid">
            {/* Custom Alias Input */}
            <div className="option-field">
              <div className="field-label-wrap">
                <label>Custom Alias</label>
                {!user && (
                  <span className="guest-badge-lock" title="Sign in to save custom short aliases to your account">
                    <Lock size={11} /> Log In Recommended
                  </span>
                )}
              </div>
              <div className="alias-input-wrapper">
                <span className="alias-prefix">/</span>
                <input
                  type="text"
                  placeholder="e.g. my-portfolio"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className={`alias-input ${
                    aliasAvailable === true ? 'valid' : aliasAvailable === false ? 'invalid' : ''
                  }`}
                />
                {aliasChecking && <Loader2 size={14} className="alias-spinner spinning" />}
              </div>

              {aliasMessage && (
                <div className={`alias-feedback ${aliasAvailable ? 'success' : 'error'}`}>
                  {aliasAvailable ? <Check size={12} /> : <AlertCircle size={12} />}
                  <span>{aliasMessage}</span>
                </div>
              )}
            </div>

            {/* Expiration Selector */}
            <div className="option-field">
              <label>Link Expiration</label>
              <div className="expiration-select-wrapper">
                <Clock size={16} className="select-icon" />
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  className="expiration-select"
                >
                  <option value="">Never Expires (Permanent)</option>
                  <option value="1">1 Hour</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="168">7 Days (1 Week)</option>
                  <option value="720">30 Days (1 Month)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .shortener-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .main-input-group {
          position: relative;
          display: flex;
          align-items: center;
          background: #2f2c3aff;
          border: 1px solid #334155ff;
          border-radius: 12px;
          padding: 5px 5px 5px 16px;
          transition: border-color 0.15s ease;
        }

        .main-input-group:focus-within {
          border-color: #524c4cff;
        }

        .input-icon-left {
          color: #14B8A6;
          display: flex;
          align-items: center;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .url-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #E2E8F0;
          font-size: 15px;
          outline: none;
          width: 100%;
        }

        .url-input::placeholder {
          color: #94A3B8;
        }

        .shorten-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 11px 22px;
          background: #323944ff;
          color: #ffffff;
          border: none;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }

        .shorten-btn:hover:not(:disabled) {
          background: #696b70ff;
        }

        .shorten-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-sub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
          font-size: 13px;
        }

        .toggle-advanced-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s;
        }

        .toggle-advanced-btn:hover {
          color: #E2E8F0;
        }

        .guest-notice {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94A3B8;
          font-size: 12px;
        }

        .inline-login-btn {
          background: none;
          border: none;
          color: #14B8A6;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .advanced-options-card {
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .option-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label-wrap {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .option-field label {
          font-size: 11px;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .guest-badge-lock {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #14B8A6;
          background: rgba(20, 184, 166, 0.1);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .alias-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 8px;
          overflow: hidden;
        }

        .alias-prefix {
          padding: 0 10px 0 12px;
          color: #94A3B8;
          font-size: 14px;
          font-family: monospace;
          background: rgba(255, 255, 255, 0.03);
          height: 36px;
          display: flex;
          align-items: center;
        }

        .alias-input {
          flex: 1;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #E2E8F0;
          font-size: 14px;
          outline: none;
        }

        .alias-input.valid {
          border-color: #10B981;
        }

        .alias-input.invalid {
          border-color: #EF4444;
        }

        .alias-spinner {
          position: absolute;
          right: 12px;
          color: #3B82F6;
        }

        .alias-feedback {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          margin-top: 2px;
        }

        .alias-feedback.success { color: #10B981; }
        .alias-feedback.error { color: #EF4444; }

        .expiration-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .select-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .expiration-select {
          width: 100%;
          padding: 8px 12px 8px 36px;
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #E2E8F0;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .main-input-group {
            flex-direction: column;
            padding: 10px;
            gap: 10px;
          }
          .shorten-btn {
            width: 100%;
            justify-content: center;
          }
          .options-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
};