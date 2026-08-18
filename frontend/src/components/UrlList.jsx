import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Trash2, 
  ExternalLink, 
  Check, 
  Clock, 
  Globe, 
  Search, 
  Filter, 
  Edit3, 
  AlertCircle,
  X,
  Save,
  Loader2,
  Calendar,
  MousePointer
} from 'lucide-react';
import { API_BASE } from '../utils/api';

export const UrlList = ({ urls = [], onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expired'
  const [copiedId, setCopiedId] = useState(null);
  const [editingUrl, setEditingUrl] = useState(null);

  // Edit Modal State
  const [editOriginalUrl, setEditOriginalUrl] = useState('');
  const [editCustomAlias, setEditCustomAlias] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filtered URLs
  const filteredUrls = useMemo(() => {
    return urls.filter(item => {
      const matchesSearch = 
        item.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.customAlias && item.customAlias.toLowerCase().includes(searchTerm.toLowerCase()));

      const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt);
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.isActive !== false && !isExpired) ||
        (statusFilter === 'expired' && (item.isActive === false || isExpired));

      return matchesSearch && matchesStatus;
    });
  }, [urls, searchTerm, statusFilter]);

  const openEditModal = (item) => {
    setEditingUrl(item);
    setEditOriginalUrl(item.originalUrl);
    setEditCustomAlias(item.customAlias || '');
    setEditIsActive(item.isActive !== false);
    setEditError(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUrl) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('shortx_token') || localStorage.getItem('slicelink_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/urls/${editingUrl.id || editingUrl._id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          originalUrl: editOriginalUrl.trim(),
          customAlias: editCustomAlias.trim() || null,
          isActive: editIsActive
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update link');
      }

      if (onUpdate) onUpdate();
      setEditingUrl(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (!urls || urls.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon-box">
          <Globe size={24} />
        </div>
        <h3 className="empty-title">No short links generated yet</h3>
        <p className="empty-subtitle">Shorten your first link above to start organizing your URLs.</p>
      </div>
    );
  }

  return (
    <div className="url-list-wrapper">
      {/* Search & Filter Controls */}
      <div className="table-controls">
        <div className="search-bar">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search by URL or custom alias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <Filter size={13} className="filter-icon" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired / Inactive</option>
          </select>
        </div>
      </div>

      {/* URL Cards List */}
      <div className="url-grid">
        {filteredUrls.map((item) => {
          const id = item.id || item._id;
          const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt);
          const isActive = item.isActive !== false && !isExpired;
          const isCopied = copiedId === id;

          return (
            <div key={id} className={`url-card ${!isActive ? 'inactive' : ''}`}>
              <div className="url-card-header">
                <div className="short-url-box">
                  <span className="short-url-text">{item.shortUrl}</span>
                  {item.customAlias && (
                    <span className="custom-alias-pill">
                      /{item.customAlias}
                    </span>
                  )}
                </div>

                <div className="card-header-badges">
                  {isActive ? (
                    <span className="status-badge-pill active">
                      <span className="dot pulse" /> Active
                    </span>
                  ) : (
                    <span className="status-badge-pill expired">
                      {isExpired ? 'Expired' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>

              <div className="original-url-row" title={item.originalUrl}>
                <span className="orig-label">Destination:</span>
                <a 
                  href={item.originalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="orig-link"
                >
                  {item.originalUrl}
                  <ExternalLink size={11} className="link-ext" />
                </a>
              </div>

              <div className="card-metrics-row">
                <div className="metric-chip">
                  <MousePointer size={12} className="chip-icon" />
                  <span><strong>{item.clicks || 0}</strong> clicks</span>
                </div>
                <div className="metric-chip">
                  <Calendar size={12} className="chip-icon" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                {item.expiresAt && (
                  <div className="metric-chip expire">
                    <Clock size={12} className="chip-icon" />
                    <span>Exp: {new Date(item.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  className={`action-btn copy ${isCopied ? 'copied' : ''}`}
                  onClick={() => handleCopy(item.shortUrl, id)}
                  title="Copy short link"
                >
                  {isCopied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>

                {onUpdate && (
                  <button
                    className="action-btn edit"
                    onClick={() => openEditModal(item)}
                    title="Edit Link Settings"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                )}

                <button
                  className="action-btn delete"
                  onClick={() => {
                    if (window.confirm(`Delete short link '${item.shortCode}'?`)) {
                      onDelete(id);
                    }
                  }}
                  title="Delete link"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Link Modal */}
      {editingUrl && (
        <div className="modal-overlay" onClick={() => setEditingUrl(null)}>
          <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-head">
              <h4>Edit Link Settings</h4>
              <button onClick={() => setEditingUrl(null)} className="edit-close-btn">
                <X size={16} />
              </button>
            </div>

            {editError && (
              <div className="edit-error-toast">
                <AlertCircle size={14} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="edit-form">
              <div className="form-group">
                <label>Destination URL</label>
                <input
                  type="url"
                  required
                  value={editOriginalUrl}
                  onChange={(e) => setEditOriginalUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Custom Alias</label>
                <input
                  type="text"
                  placeholder="Optional custom alias"
                  value={editCustomAlias}
                  onChange={(e) => setEditCustomAlias(e.target.value)}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  <span>Link Active Status</span>
                </label>
              </div>

              <div className="edit-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingUrl(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={editLoading}>
                  {editLoading ? (
                    <>
                      <Loader2 size={14} className="spinning" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .url-list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .table-controls {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 240px;
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 0 12px;
        }

        .search-icon {
          color: #94A3B8;
          margin-right: 8px;
        }

        .search-bar input {
          width: 100%;
          padding: 8px 0;
          background: transparent;
          border: none;
          color: #E2E8F0;
          font-size: 13px;
          outline: none;
        }

        .clear-search {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 0 12px;
        }

        .filter-icon { color: #3B82F6; }

        .filter-select {
          background: transparent;
          border: none;
          color: #E2E8F0;
          font-size: 12px;
          padding: 8px 0;
          outline: none;
          cursor: pointer;
        }

        .url-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .url-card {
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .url-card.inactive {
          opacity: 0.6;
        }

        .url-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .short-url-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .short-url-text {
          font-size: 15px;
          font-weight: 700;
          color: #3B82F6;
          font-family: 'JetBrains Mono', monospace;
        }

        .custom-alias-pill {
          font-size: 11px;
          font-weight: 600;
          color: #14B8A6;
          background: rgba(20, 184, 166, 0.1);
          border: 1px solid rgba(20, 184, 166, 0.2);
          padding: 2px 7px;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
        }

        .status-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .status-badge-pill.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .status-badge-pill.expired {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10B981;
        }

        .dot.pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .original-url-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .orig-label { color: #94A3B8; }

        .orig-link {
          color: #E2E8F0;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 450px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .orig-link:hover { color: #ffffff; text-decoration: underline; }
        .link-ext { color: #94A3B8; flex-shrink: 0; }

        .card-metrics-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .metric-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #94A3B8;
          background: #1E293B;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .chip-icon { color: #14B8A6; }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #334155;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #E2E8F0;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: #273549;
          color: #ffffff;
        }

        .action-btn.copy {
          background: #3B82F6;
          border-color: #3B82F6;
          color: #ffffff;
        }

        .action-btn.copy:hover:not(.copied) {
          background: #2563EB;
        }

        .action-btn.copy.copied {
          background: #10B981;
          border-color: #10B981;
          color: #ffffff;
        }

        .action-btn.delete {
          color: #EF4444;
          margin-left: auto;
        }

        .action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.12);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 36px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(20, 184, 166, 0.1);
          color: #14B8A6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 15px;
          font-weight: 700;
          color: #E2E8F0;
          margin: 0 0 4px;
        }

        .empty-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
        }

        /* Edit Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 20px;
        }

        .edit-modal-card {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 14px;
          padding: 20px;
          max-width: 440px;
          width: 100%;
        }

        .edit-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .edit-modal-head h4 { font-size: 15px; color: #E2E8F0; margin: 0; }

        .edit-close-btn { background: none; border: none; color: #94A3B8; cursor: pointer; }

        .edit-form { display: flex; flex-direction: column; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-group label { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; }
        .form-group input[type="url"], .form-group input[type="text"] {
          padding: 8px 12px;
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #E2E8F0;
          font-size: 13px;
          outline: none;
        }

        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #E2E8F0; }

        .edit-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
        .btn-cancel { padding: 8px 14px; background: transparent; border: 1px solid #334155; border-radius: 8px; color: #94A3B8; cursor: pointer; }
        .btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3B82F6; border: none; border-radius: 8px; color: #ffffff; font-weight: 600; cursor: pointer; }
        .btn-save:hover { background: #2563EB; }

        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};