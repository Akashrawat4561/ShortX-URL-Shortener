import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Share2, MousePointer, Calendar, Clock, Sparkles } from 'lucide-react';

export const UrlResultCard = ({ data }) => {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shortened Link',
          text: 'Check out this short link:',
          url: data.shortUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  // Expiration calculation text
  const getExpirationText = () => {
    if (!data.expiresAt) return null;
    const exp = new Date(data.expiresAt);
    const now = new Date();
    const diffHours = Math.round((exp - now) / (1000 * 60 * 60));
    if (diffHours <= 0) return 'Expired';
    if (diffHours < 24) return `${diffHours}h left`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days left`;
  };

  const expirationDisplay = getExpirationText();

  return (
    <div className="result-card-hero">
      <div className="accent-top-bar" />
      
      <div className="card-content">
        <div className="card-header">
          <div className="header-label-wrap">
            <span className="ready-badge">
              <Sparkles size={13} />
              Link Ready
            </span>
            <span className="section-title">Your shortened link</span>
          </div>
        </div>

        <div className="short-url-row">
          <span className="short-url-text">{data.shortUrl}</span>
        </div>

        <div className="actions-row">
          <button
            className={`btn-action btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <a
            href={data.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-action btn-visit"
          >
            <ExternalLink size={15} />
            <span>Visit</span>
          </a>

          <button className="btn-action btn-share" onClick={handleShare}>
            <Share2 size={15} />
            <span>Share</span>
          </button>
        </div>

        <div className="meta-footer-row">
          <div className="meta-pill">
            <MousePointer size={13} className="meta-icon" />
            <span><strong>{data.clicks || 0}</strong> clicks</span>
          </div>
          <div className="meta-pill">
            <Calendar size={13} className="meta-icon" />
            <span>{new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          {expirationDisplay && (
            <div className="meta-pill expire">
              <Clock size={13} className="meta-icon" />
              <span>{expirationDisplay}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .result-card-hero {
          position: relative;
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
          animation: cardAppear 0.25s ease-out;
        }

        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .accent-top-bar {
          height: 3px;
          background: linear-gradient(90deg, #3B82F6 0%, #14B8A6 100%);
        }

        .card-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-label-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ready-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: #14B8A6;
          background: rgba(20, 184, 166, 0.1);
          border: 1px solid rgba(20, 184, 166, 0.2);
          padding: 3px 10px;
          border-radius: 9999px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .short-url-row {
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 14px 18px;
          word-break: break-all;
        }

        .short-url-text {
          font-size: 20px;
          font-weight: 700;
          color: #3B82F6;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: -0.2px;
        }

        .actions-row {
          display: flex;
          gap: 10px;
        }

        .btn-action {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-copy {
          background: #3B82F6;
          color: #ffffff;
        }

        .btn-copy:hover:not(.copied) {
          background: #2563EB;
        }

        .btn-copy.copied {
          background: #10B981;
          border-color: #10B981;
          color: #ffffff;
        }

        .btn-visit {
          background: #0F172A;
          border-color: #334155;
          color: #E2E8F0;
        }

        .btn-visit:hover {
          background: #273549;
          color: #ffffff;
        }

        .btn-share {
          background: rgba(20, 184, 166, 0.1);
          border-color: rgba(20, 184, 166, 0.25);
          color: #14B8A6;
        }

        .btn-share:hover {
          background: rgba(20, 184, 166, 0.2);
        }

        .meta-footer-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 14px;
          border-top: 1px solid #334155;
          flex-wrap: wrap;
        }

        .meta-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #94A3B8;
        }

        .meta-pill strong {
          color: #E2E8F0;
        }

        .meta-icon {
          color: #14B8A6;
        }

        @media (max-width: 520px) {
          .actions-row {
            flex-direction: column;
          }
          .short-url-text {
            font-size: 17px;
          }
        }
      `}</style>
    </div>
  );
};