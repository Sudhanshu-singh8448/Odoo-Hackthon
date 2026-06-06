'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function RFQsPage() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (tab) params.status = tab;
      const { data } = await api.get('/rfqs', { params });
      setRfqs(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load RFQs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, tab]);

  const statusColor = { draft: 'badge-gray', open: 'badge-green', closed: 'badge-blue', cancelled: 'badge-red' };
  const priorityColor = { high: 'badge-red', medium: 'badge-orange', low: 'badge-gray' };

  const daysUntil = (d) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
    if (diff < 0) return <span style={{ color: 'var(--error-500)', fontWeight: 600 }}>Expired</span>;
    if (diff === 0) return <span style={{ color: 'var(--warning-600)', fontWeight: 600 }}>Today</span>;
    return <span>{diff} day{diff > 1 ? 's' : ''}</span>;
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Request for Quotations</h1>
          <p className="page-subtitle">Manage procurement requests</p>
        </div>
        {['admin','procurement_officer'].includes(user?.role) && (
          <Link href="/rfqs/new" className="btn btn-primary">+ Create RFQ</Link>
        )}
      </div>

      <div className="tabs">
        {[{v:'',l:'All'},{v:'draft',l:'Draft'},{v:'open',l:'Open'},{v:'closed',l:'Closed'},{v:'cancelled',l:'Cancelled'}].map(t => (
          <button key={t.v} className={`tab ${tab === t.v ? 'active' : ''}`} onClick={() => { setTab(t.v); setPage(1); }}>{t.l}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>RFQ Number</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4].map(i => <tr key={i}><td colSpan={7}><div className="skeleton skeleton-text" /></td></tr>)
            ) : rfqs.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No RFQs found</h3>
                  <p>Create your first Request for Quotation</p>
                  {['admin','procurement_officer'].includes(user?.role) && <Link href="/rfqs/new" className="btn btn-primary">+ Create RFQ</Link>}
                </div>
              </td></tr>
            ) : rfqs.map(r => (
              <tr key={r.id}>
                <td><span className="font-mono text-sm" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{r.rfq_number}</span></td>
                <td><strong>{r.title}</strong></td>
                <td>{r.priority ? <span className={`badge ${priorityColor[r.priority] || 'badge-gray'}`}>{r.priority}</span> : '—'}</td>
                <td>{r.deadline ? <>{daysUntil(r.deadline)} <span className="text-xs text-muted" style={{ display: 'block' }}>{new Date(r.deadline).toLocaleDateString('en-IN')}</span></> : '—'}</td>
                <td><span className={`badge ${statusColor[r.status]}`}>{r.status}</span></td>
                <td className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                  <div className="table-actions">
                    <Link href={`/rfqs/${r.id}`} className="btn btn-ghost btn-sm">View</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.pages > 1 && (
          <div className="pagination">
            <div className="pagination-info">Page {page} of {pagination.pages}</div>
            <div className="pagination-buttons">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="pagination-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
