'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function ApprovalDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [approval, setApproval] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get(`/approvals/${id}`).then(res => setApproval(res.data.data))
      .catch(() => toast.error('Approval not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecide = async (status) => {
    try {
      await api.patch(`/approvals/${id}/decide`, { status, remarks });
      toast.success(`Approval ${status}!`);
      router.push('/approvals');
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '400px' }} /></div>;
  if (!approval) return <div className="page-container"><div className="empty-state"><h3>Approval not found</h3></div></div>;

  const statusColor = { pending: 'badge-orange', approved: 'badge-green', rejected: 'badge-red' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 className="page-title">Approval Detail</h1>
            <span className={`badge ${statusColor[approval.status]}`}>{approval.status}</span>
          </div>
          <p className="page-subtitle">Review quotation for approval</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          {/* Quotation Summary */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Quotation Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {[['Quotation', approval.quotation_number], ['Vendor', approval.vendor_name], ['RFQ', approval.rfq_title || approval.rfq_number], ['Delivery', `${approval.delivery_days || '—'} days`]].map(([l,v]) => (
                <div key={l}><div className="text-xs text-muted">{l}</div><div className="text-sm" style={{ fontWeight: 600 }}>{v || '—'}</div></div>
              ))}
            </div>
            <div style={{ padding: '16px', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div className="text-xs text-muted">Total Amount</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-600)' }}>₹{Number(approval.total_amount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Line Items */}
          {approval.items && approval.items.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Line Items</h3>
              <table className="table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                <tbody>
                  {approval.items.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.product_name || 'Item'}</strong></td>
                      <td>{item.quantity}</td>
                      <td>₹{Number(item.unit_price || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(item.total_price || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          {/* Timeline */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Timeline</h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot" style={{ background: 'var(--info-500)' }} />
                <div className="timeline-content">
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Requested</div>
                  <div className="timeline-time">{approval.requester_name} · {new Date(approval.requested_at || approval.created_at).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
              {approval.status !== 'pending' && (
                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: approval.status === 'approved' ? 'var(--success-500)' : 'var(--error-500)' }} />
                  <div className="timeline-content">
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{approval.status === 'approved' ? 'Approved' : 'Rejected'}</div>
                    <div className="timeline-time">{approval.approver_name || 'Manager'} · {approval.decided_at ? new Date(approval.decided_at).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decision Panel */}
          {approval.status === 'pending' && user?.role === 'manager' && (
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Your Decision</h3>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-textarea" placeholder="Add your comments..." value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleDecide('approved')}>✅ Approve</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDecide('rejected')}>❌ Reject</button>
              </div>
            </div>
          )}

          {approval.remarks && approval.status !== 'pending' && (
            <div className="card" style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '8px' }}>Remarks</h3>
              <p className="text-sm" style={{ fontStyle: 'italic' }}>"{approval.remarks}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
