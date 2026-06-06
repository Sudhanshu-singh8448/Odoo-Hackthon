'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (filter) params.entity_type = filter;
    api.get('/activity-logs', { params })
      .then(res => { setLogs(res.data.data || []); setPagination(res.data.pagination || {}); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [page, filter]);

  const entityIcon = { rfq: '📋', quotation: '💰', approval: '✅', purchase_order: '📦', invoice: '🧾', vendor: '🏢', user: '👤' };
  const actionColor = { CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red', PUBLISH: 'badge-purple', APPROVE: 'badge-green', REJECT: 'badge-red' };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">Track all system activities</p>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {['rfq','quotation','approval','purchase_order','invoice','vendor','user'].map(t => (
            <option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {loading ? (
        [1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-text" style={{ height: '60px', marginBottom: '8px' }} />)
      ) : logs.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📝</div><h3>No activity</h3><p>System activities will appear here</p></div>
      ) : (
        <div className="timeline">
          {logs.map(log => (
            <div key={log.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span>{entityIcon[log.entity_type] || '📝'}</span>
                    <span className={`badge ${actionColor[log.action] || 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>{log.action}</span>
                    <strong style={{ fontSize: '0.85rem' }}>{log.entity_type?.replace('_',' ')}</strong>
                  </div>
                  <div className="text-sm text-muted">{log.details || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="text-xs" style={{ fontWeight: 500 }}>{log.user_name || 'System'}</div>
                  <div className="text-xs text-muted">{timeAgo(log.created_at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination" style={{ marginTop: '16px' }}>
          <div className="pagination-info">Page {page} of {pagination.pages}</div>
          <div className="pagination-buttons">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="pagination-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
