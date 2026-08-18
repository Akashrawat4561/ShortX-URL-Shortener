import React, { useMemo } from "react";
import { UrlList } from "./UrlList";
import {
  Link2,
  MousePointer,
  BarChart3,
  TrendingUp,
  Download,
  Plus,
  Sparkles,
  Crown,
  Layers,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export const DashboardView = ({
  user,
  urls = [],
  onDelete,
  onUpdate,
  onShortenClick,
  onOpenAuth,
}) => {
  // Computed Dashboard Analytics
  const analytics = useMemo(() => {
    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);
    const activeLinks = urls.filter((u) => {
      const isExpired = u.expiresAt && new Date() > new Date(u.expiresAt);
      return u.isActive !== false && !isExpired;
    }).length;
    const expiredLinks = totalLinks - activeLinks;
    const avgClicks =
      totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : "0";

    // Find top performer
    let topLink = null;
    if (totalLinks > 0) {
      topLink = [...urls].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
    }

    // Top 5 links for click distribution chart
    const chartData = [...urls]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5)
      .map((item) => ({
        label: item.customAlias ? `/${item.customAlias}` : item.shortCode,
        clicks: item.clicks || 0,
        fullUrl: item.shortUrl,
      }));

    const maxChartClicks = Math.max(...chartData.map((d) => d.clicks), 1);

    return {
      totalLinks,
      totalClicks,
      activeLinks,
      expiredLinks,
      avgClicks,
      topLink,
      chartData,
      maxChartClicks,
    };
  }, [urls]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!urls || urls.length === 0) return;

    const headers = [
      "Short Code",
      "Short URL",
      "Original URL",
      "Custom Alias",
      "Clicks",
      "Created At",
      "Expires At",
      "Status",
    ];
    const rows = urls.map((u) => {
      const isExpired = u.expiresAt && new Date() > new Date(u.expiresAt);
      const status =
        u.isActive === false ? "Inactive" : isExpired ? "Expired" : "Active";
      return [
        `"${u.shortCode}"`,
        `"${u.shortUrl}"`,
        `"${u.originalUrl.replace(/"/g, '""')}"`,
        `"${u.customAlias || ""}"`,
        u.clicks || 0,
        `"${new Date(u.createdAt).toISOString()}"`,
        `"${u.expiresAt ? new Date(u.expiresAt).toISOString() : "Never"}"`,
        `"${status}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `shortx_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container">
      {/* User Welcome / Status Banner */}
      <div className="dashboard-header-card">
        <div className="welcome-info">
          <div className="avatar-badge">
            {user ? user.name.charAt(0).toUpperCase() : "G"}
          </div>
          <div>
            <div className="user-title-row">
              <h1 className="welcome-name">
                {user ? `Welcome back, ${user.name}` : "Personal Workspace"}
              </h1>
              <span className={`plan-pill ${user ? "pro" : "guest"}`}>
                {user ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                {user ? "Verified User" : "Guest Mode"}
              </span>
            </div>
            <p className="welcome-sub">
              {user
                ? `Manage your active short links, custom aliases, and live traffic analytics.`
                : `Sign in to unlock unlimited link history, custom aliases, and cloud sync.`}
            </p>
          </div>
        </div>

        <div className="header-actions">
          {urls.length > 0 && (
            <button className="btn-dash-secondary" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          <button className="btn-dash-primary" onClick={onShortenClick}>
            <Plus size={15} />
            <span>Shorten New Link</span>
          </button>
        </div>
      </div>

      {/* Guest Warning Banner if not logged in */}
      {!user && (
        <div className="guest-promo-banner">
          <div className="promo-text">
            <Sparkles size={16} className="promo-icon" />
            <div>
              <strong>Saving to Local Storage:</strong> You are viewing guest
              links. Create a free account to back up links to the cloud and
              track permanent click counts.
            </div>
          </div>
          <button
            className="btn-promo-action"
            onClick={() => onOpenAuth("register")}
          >
            Create Free Account
          </button>
        </div>
      )}

      {/* 4 Analytics Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap blue">
            <Link2 size={18} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Links</span>
            <div className="metric-value">{analytics.totalLinks}</div>
            <div className="metric-sub">
              <span className="sub-green">{analytics.activeLinks} Active</span>
              <span className="sub-divider">•</span>
              <span className="sub-muted">
                {analytics.expiredLinks} Expired
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap teal">
            <MousePointer size={18} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Clicks</span>
            <div className="metric-value">{analytics.totalClicks}</div>
            <div className="metric-sub">
              <TrendingUp size={12} className="trend-icon" />
              <span>Cumulative views</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple">
            <BarChart3 size={18} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Avg. Clicks / Link</span>
            <div className="metric-value">{analytics.avgClicks}</div>
            <div className="metric-sub">
              <span>Per short code</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap gold">
            <Crown size={18} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Top Performer</span>
            {analytics.topLink ? (
              <>
                <div className="metric-value highlight">
                  {analytics.topLink.customAlias
                    ? `/${analytics.topLink.customAlias}`
                    : analytics.topLink.shortCode}
                </div>
                <div className="metric-sub">
                  <span className="sub-green">
                    {analytics.topLink.clicks || 0} clicks
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="metric-value muted">—</div>
                <div className="metric-sub">No data yet</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Click Activity Visualization (Pure SVG/React Bar Chart) */}
      {analytics.chartData.length > 0 && analytics.totalClicks > 0 && (
        <div className="analytics-widget-card">
          <div className="widget-head">
            <div className="widget-title">
              <BarChart3 size={16} className="title-icon" />
              <span>Top Link Traffic Distribution</span>
            </div>
            <span className="widget-badge">Live Performance</span>
          </div>

          <div className="chart-bars">
            {analytics.chartData.map((item, idx) => {
              const heightPct = Math.max(
                12,
                Math.round((item.clicks / analytics.maxChartClicks) * 100),
              );
              return (
                <div key={idx} className="chart-bar-item">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ height: `${heightPct}%` }}
                      title={`${item.label}: ${item.clicks} clicks`}
                    >
                      <span className="bar-val">{item.clicks}</span>
                    </div>
                  </div>
                  <span className="bar-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link Workspace Table Section */}
      <div className="workspace-card">
        <div className="workspace-header">
          <div className="workspace-title-box">
            <Layers size={18} className="ws-icon" />
            <div>
              <h2 className="ws-title">Link History Workspace</h2>
              <p className="ws-sub">
                Search, filter, edit destination URLs, or check analytics.
              </p>
            </div>
          </div>
        </div>

        <UrlList urls={urls} onDelete={onDelete} onUpdate={onUpdate} />
      </div>

      <style jsx>{`
        .dashboard-container {
          --dash-bg: #0b1120;
          --dash-surface: #1b1e25ff;
          --dash-surface-2: #18191aff;
          --dash-surface-hover: #1b263a;
          --dash-border: #253247;
          --dash-border-hover: #34445c;

          --dash-primary: #2b2c25ff;
          --dash-primary-hover: #4f5964ff;
          --dash-primary-soft: rgba(81, 108, 160, 1);

          --dash-accent: #2dd4bf;
          --dash-accent-soft: rgba(45, 212, 191, 0.1);

          --dash-success: #34d399;
          --dash-warning: #fbbf24;
          --dash-danger: #f87171;

          --dash-text: #f1f5f9;
          --dash-text-secondary: #cbd5e1;
          --dash-text-muted: #8492a6;
          --dash-text-faint: #64748b;

          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 40px;
          color: var(--dash-text);
        }

        /* =========================
     WELCOME HEADER
     ========================= */

        .dashboard-header-card {
          background: var(--dash-surface);
          border: 1px solid var(--dash-border);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          transition: border-color 0.2s ease;
        }

        .dashboard-header-card:hover {
          border-color: var(--dash-border-hover);
        }

        .welcome-info {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .avatar-badge {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--dash-primary), #6366f1);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          font-weight: 800;
          box-shadow: 0 6px 18px rgba(79, 140, 255, 0.18);
        }

        .user-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .welcome-name {
          font-size: 20px;
          font-weight: 750;
          color: var(--dash-text);
          margin: 0;
          letter-spacing: -0.35px;
        }

        .plan-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 650;
          padding: 3px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .plan-pill.pro {
          background: var(--dash-accent-soft);
          color: var(--dash-accent);
          border: 1px solid rgba(45, 212, 191, 0.18);
        }

        .plan-pill.guest {
          background: rgba(132, 146, 166, 0.08);
          color: var(--dash-text-muted);
          border: 1px solid rgba(132, 146, 166, 0.15);
        }

        .welcome-sub {
          font-size: 12px;
          color: var(--dash-text-muted);
          margin: 5px 0 0;
          line-height: 1.5;
        }

        /* =========================
     HEADER ACTIONS
     ========================= */

        .header-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .btn-dash-primary,
        .btn-dash-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 36px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .btn-dash-primary {
          padding: 8px 15px;
          background: var(--dash-primary);
          color: #ffffff;
          border: 1px solid var(--dash-primary);
          box-shadow: 0 4px 12px rgba(79, 140, 255, 0.14);
        }

        .btn-dash-primary:hover {
          background: var(--dash-primary-hover);
          border-color: var(--dash-primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(79, 140, 255, 0.2);
        }

        .btn-dash-secondary {
          padding: 8px 13px;
          background: transparent;
          color: var(--dash-text-secondary);
          border: 1px solid var(--dash-border);
        }

        .btn-dash-secondary:hover {
          background: var(--dash-surface-2);
          border-color: var(--dash-border-hover);
          color: var(--dash-text);
        }

        /* =========================
     GUEST PROMO
     ========================= */

        .guest-promo-banner {
          background: linear-gradient(
            90deg,
            rgba(79, 140, 255, 0.08),
            rgba(45, 212, 191, 0.045)
          );
          border: 1px solid rgba(79, 140, 255, 0.18);
          border-radius: 12px;
          padding: 13px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .promo-text {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--dash-text-secondary);
          line-height: 1.5;
        }

        .promo-icon {
          color: var(--dash-primary);
          flex-shrink: 0;
        }

        .btn-promo-action {
          padding: 7px 13px;
          background: var(--dash-primary);
          color: #ffffff;
          border: 1px solid var(--dash-primary);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition:
            background 0.18s ease,
            transform 0.18s ease;
          white-space: nowrap;
        }

        .btn-promo-action:hover {
          background: var(--dash-primary-hover);
          transform: translateY(-1px);
        }

        /* =========================
     METRICS
     ========================= */

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .metric-card {
          background: var(--dash-surface);
          border: 1px solid var(--dash-border);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 13px;
          min-width: 0;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .metric-card:hover {
          background: var(--dash-surface-2);
          border-color: var(--dash-border-hover);
          transform: translateY(-1px);
        }

        .metric-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Use one professional visual language instead
     of four unrelated colors. */

        .metric-icon-wrap.blue {
          background: var(--dash-primary-soft);
          color: var(--dash-primary);
        }

        .metric-icon-wrap.teal {
          background: var(--dash-accent-soft);
          color: var(--dash-accent);
        }

        .metric-icon-wrap.purple {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
        }

        .metric-icon-wrap.gold {
          background: rgba(251, 191, 36, 0.09);
          color: var(--dash-warning);
        }

        .metric-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .metric-label {
          font-size: 10px;
          color: var(--dash-text-muted);
          font-weight: 650;
          text-transform: uppercase;
          letter-spacing: 0.045em;
        }

        .metric-value {
          font-size: 21px;
          line-height: 1.25;
          font-weight: 800;
          color: var(--dash-text);
          margin: 3px 0 2px;
          font-family: "JetBrains Mono", monospace;
          letter-spacing: -0.5px;
        }

        .metric-value.highlight {
          color: var(--dash-accent);
          font-size: 15px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .metric-value.muted {
          color: var(--dash-text-faint);
        }

        .metric-sub {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: var(--dash-text-muted);
          white-space: nowrap;
        }

        .sub-green {
          color: var(--dash-success);
          font-weight: 650;
        }

        .sub-divider {
          color: var(--dash-text-faint);
        }

        .trend-icon {
          color: var(--dash-accent);
        }

        /* =========================
     ANALYTICS CHART
     ========================= */

        .analytics-widget-card {
          background: var(--dash-surface);
          border: 1px solid var(--dash-border);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .widget-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .widget-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--dash-text);
        }

        .title-icon {
          color: var(--dash-primary);
        }

        .widget-badge {
          font-size: 10px;
          color: var(--dash-accent);
          background: var(--dash-accent-soft);
          border: 1px solid rgba(45, 212, 191, 0.12);
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 650;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 18px;
          height: 120px;
          padding: 8px 4px 0;
        }

        .chart-bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          min-width: 0;
        }

        .bar-track {
          width: 100%;
          max-width: 46px;
          height: 88px;
          background: #0b1220;
          border: 1px solid rgba(37, 50, 71, 0.75);
          border-radius: 7px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .bar-fill {
          width: 100%;
          background: linear-gradient(
            180deg,
            #4f8cff 0%,
            #3b82f6 55%,
            #2dd4bf 100%
          );
          border-radius: 6px 6px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 3px;
          transition: height 0.35s ease;
          box-shadow: 0 -3px 14px rgba(79, 140, 255, 0.12);
        }

        .bar-val {
          font-size: 9px;
          font-weight: 750;
          color: #ffffff;
        }

        .bar-label {
          font-size: 10px;
          color: var(--dash-text-muted);
          margin-top: 7px;
          font-family: "JetBrains Mono", monospace;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 78px;
        }

        /* =========================
     WORKSPACE
     ========================= */

        .workspace-card {
          background: var(--dash-surface);
          border: 1px solid var(--dash-border);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .workspace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--dash-border);
          padding-bottom: 14px;
        }

        .workspace-title-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ws-icon {
          width: 34px;
          height: 34px;
          padding: 8px;
          border-radius: 9px;
          background: var(--dash-accent-soft);
          color: var(--dash-accent);
        }

        .ws-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--dash-text);
          margin: 0;
          letter-spacing: -0.15px;
        }

        .ws-sub {
          font-size: 11px;
          color: var(--dash-text-muted);
          margin: 3px 0 0;
        }

        /* =========================
     FOCUS / ACCESSIBILITY
     ========================= */

        .btn-dash-primary:focus-visible,
        .btn-dash-secondary:focus-visible,
        .btn-promo-action:focus-visible {
          outline: 2px solid var(--dash-primary);
          outline-offset: 2px;
        }

        /* =========================
     RESPONSIVE
     ========================= */

        @media (max-width: 1000px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .dashboard-header-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
          }

          .btn-dash-primary,
          .btn-dash-secondary {
            flex: 1;
          }

          .workspace-card {
            padding: 18px;
          }
        }

        @media (max-width: 600px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .guest-promo-banner {
            align-items: flex-start;
          }

          .promo-text {
            align-items: flex-start;
          }

          .btn-promo-action {
            width: 100%;
          }

          .chart-bars {
            gap: 10px;
          }

          .bar-label {
            max-width: 55px;
          }
        }

        @media (max-width: 450px) {
          .dashboard-header-card {
            padding: 18px;
          }

          .welcome-name {
            font-size: 17px;
          }

          .header-actions {
            flex-direction: column;
          }

          .btn-dash-primary,
          .btn-dash-secondary {
            width: 100%;
          }

          .workspace-card {
            padding: 16px;
          }

          .widget-badge {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
