'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/approvals', { params: { status: tab, page, limit: 15 } });
      setApprovals(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load approvals'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab, page]);

  const handleDecide = async (id, status) => {
    const remarks = prompt(`Enter remarks for ${status}:`);
    if (remarks === null) return;
    try {
      await api.patch(`/approvals/${id}/decide`, { status, remarks });
      toast.success(`Approval ${status}!`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const statusColor = { pending: 'badge-orange', approved: 'badge-green', rejected: 'badge-red' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Queue</h1>
          <p className="page-subtitle">Review and manage procurement approvals</p>
        </div>
      </div>

      <div className="tabs">
        {[{v:'pending',l:'⏳ Pending'},{v:'approved',l:'✅ Approved'},{v:'rejected',l:'❌ Rejected'}].map(t => (
          <button key={t.v} className={`tab ${tab === t.v ? 'active' : ''}`} onClick={() => { setTab(t.v); setPage(1); }}>{t.l}</button>
        ))}
      </div>

      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '100px', marginBottom: '12px' }} />)
      ) : approvals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No {tab} approvals</h3>
          <p>{tab === 'pending' ? 'All caught up! No approvals waiting.' : `No ${tab} approvals found.`}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {approvals.map(a => (
            <div key={a.id} className="approval-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong>{a.rfq_title || a.quotation_number || 'Quotation'}</strong>
                    <span className={`badge ${statusColor[a.status]}`}>{a.status}</span>
                  </div>
                  <div className="text-sm text-muted">
                    {a.vendor_name && `Vendor: ${a.vendor_name} · `}
                    Requested by {a.requester_name || 'Officer'} · {new Date(a.requested_at || a.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-600)' }}>₹{Number(a.total_amount || 0).toLocaleString('en-IN')}</div>
                  {a.delivery_days && <div className="text-xs text-muted">{a.delivery_days} days delivery</div>}
                </div>
              </div>
              {a.remarks && <div className="text-sm" style={{ padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>"{a.remarks}"</div>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Link href={`/approvals/${a.id}`} className="btn btn-ghost btn-sm">View Details</Link>
                {tab === 'pending' && user?.role === 'manager' && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => handleDecide(a.id, 'approved')}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDecide(a.id, 'rejected')}>❌ Reject</button>
                  </>
                )}
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
