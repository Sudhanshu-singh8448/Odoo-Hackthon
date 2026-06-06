'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function RFQDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get(`/rfqs/${id}`).then(res => setRfq(res.data.data))
      .catch(() => toast.error('RFQ not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePublish = async () => {
    try {
      await api.patch(`/rfqs/${id}/publish`);
      setRfq(p => ({ ...p, status: 'open' }));
      toast.success('RFQ published!');
    } catch (err) { toast.error(err.response?.data?.message || 'Publish failed'); }
  };

  const handleClose = async () => {
    try {
      await api.patch(`/rfqs/${id}/close`);
      setRfq(p => ({ ...p, status: 'closed' }));
      toast.success('RFQ closed');
    } catch (err) { toast.error(err.response?.data?.message || 'Close failed'); }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '400px' }} /></div>;
  if (!rfq) return <div className="page-container"><div className="empty-state"><h3>RFQ not found</h3></div></div>;

  const statusColor = { draft: 'badge-gray', open: 'badge-green', closed: 'badge-blue', cancelled: 'badge-red' };
  const daysLeft = rfq.deadline ? Math.ceil((new Date(rfq.deadline) - new Date()) / 86400000) : null;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 className="page-title">{rfq.rfq_number}</h1>
            <span className={`badge ${statusColor[rfq.status]}`}>{rfq.status}</span>
            {rfq.priority && <span className={`badge ${rfq.priority === 'high' ? 'badge-red' : rfq.priority === 'medium' ? 'badge-orange' : 'badge-gray'}`}>{rfq.priority}</span>}
          </div>
          <p className="page-subtitle">{rfq.title}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {rfq.status === 'draft' && ['admin','procurement_officer'].includes(user?.role) && (
            <button className="btn btn-success" onClick={handlePublish}>📤 Publish</button>
          )}
          {rfq.status === 'open' && ['admin','procurement_officer'].includes(user?.role) && (
            <button className="btn btn-secondary" onClick={handleClose}>🔒 Close RFQ</button>
          )}
          {rfq.status === 'open' && (
            <Link href={`/quotations/submit/${id}`} className="btn btn-primary">💰 Submit Quotation</Link>
          )}
          {rfq.quotations?.length >= 1 && (
            <Link href={`/quotations/compare?rfq_id=${id}`} className="btn btn-outline">⚖️ Compare Quotations</Link>
          )}
          <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      <div className="responsive-grid-2-1">
        <div>
          {/* Description */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '12px' }}>Description</h3>
            <p className="text-sm">{rfq.description || 'No description provided.'}</p>
            <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <div><span className="text-xs text-muted">Deadline</span><div className="text-sm" style={{ fontWeight: 600 }}>{rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div></div>
              {daysLeft !== null && <div><span className="text-xs text-muted">Time Left</span><div className="text-sm" style={{ fontWeight: 600, color: daysLeft < 0 ? 'var(--error-500)' : daysLeft <= 3 ? 'var(--warning-600)' : 'var(--success-600)' }}>{daysLeft < 0 ? 'Expired' : `${daysLeft} days`}</div></div>}
              <div><span className="text-xs text-muted">Created</span><div className="text-sm">{new Date(rfq.created_at).toLocaleDateString('en-IN')}</div></div>
            </div>
          </div>

          {/* Items */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Line Items ({rfq.items?.length || 0})</h3>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead><tr><th>#</th><th>Product</th><th>Specification</th><th>Quantity</th><th>Unit</th></tr></thead>
                <tbody>
                  {(rfq.items || []).map((item, i) => (
                    <tr key={item.id}><td>{i + 1}</td><td><strong>{item.product_name}</strong></td><td className="text-sm text-muted">{item.specification || '—'}</td><td>{item.quantity}</td><td>{item.unit}</td></tr>
                  ))}
                  {(!rfq.items || rfq.items.length === 0) && <tr><td colSpan={5} className="text-center text-muted">No items</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quotations */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Received Quotations ({rfq.quotations?.length || 0})</h3>
            </div>
            {(!rfq.quotations || rfq.quotations.length === 0) ? (
              <div className="empty-state" style={{ padding: '32px' }}><p>No quotations received yet</p></div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {rfq.quotations.map(q => (
                  <div key={q.id} style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{q.vendor_name || 'Vendor'}</strong>
                      <div className="text-xs text-muted">{q.quotation_number} · {q.delivery_days} days delivery</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-600)' }}>₹{Number(q.total_amount || 0).toLocaleString('en-IN')}</div>
                        <span className={`badge ${q.status === 'accepted' ? 'badge-green' : q.status === 'rejected' ? 'badge-red' : 'badge-blue'}`}>{q.status}</span>
                      </div>
                      <Link href={`/quotations/${q.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Vendors */}
        <div>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Assigned Vendors ({rfq.vendors?.length || 0})</h3>
            {(!rfq.vendors || rfq.vendors.length === 0) ? (
              <p className="text-sm text-muted">No vendors assigned</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {rfq.vendors.map(v => (
                  <div key={v.id} style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{v.company_name}</strong>
                    <div className="text-xs text-muted">{v.contact_person}</div>
                    <div className="text-xs" style={{ marginTop: '4px' }}>
                      {rfq.quotations?.find(q => q.vendor_id === v.id)
                        ? <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Submitted</span>
                        : <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Pending</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
