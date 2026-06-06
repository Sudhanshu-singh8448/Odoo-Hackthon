'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPo, setGeneratingPo] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get(`/quotations/${id}`).then(res => setQuotation(res.data.data))
      .catch(() => toast.error('Quotation not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitForApproval = async () => {
    try {
      await api.post('/approvals', { quotation_id: id });
      toast.success('Sent for approval!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const generatePO = async () => {
    setGeneratingPo(true);
    try {
      const { data } = await api.post('/purchase-orders', { quotation_id: id });
      toast.success('Purchase order generated!');
      router.push(`/purchase-orders/${data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate PO');
    } finally {
      setGeneratingPo(false);
    }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '300px' }} /></div>;
  if (!quotation) return <div className="page-container"><div className="empty-state"><h3>Quotation not found</h3></div></div>;

  const statusColor = { submitted: 'badge-blue', under_review: 'badge-orange', accepted: 'badge-green', rejected: 'badge-red' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 className="page-title">{quotation.quotation_number}</h1>
            <span className={`badge ${statusColor[quotation.status] || 'badge-gray'}`}>{quotation.status?.replace('_',' ')}</span>
          </div>
          <p className="page-subtitle">Quotation from {quotation.vendor_name || 'Vendor'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {quotation.status === 'submitted' && (
            <button className="btn btn-primary" onClick={submitForApproval}>✅ Send for Approval</button>
          )}
          {quotation.purchase_order_id && (
            <Link href={`/purchase-orders/${quotation.purchase_order_id}`} className="btn btn-outline">📦 View PO</Link>
          )}
          {quotation.status === 'accepted' && !quotation.purchase_order_id && ['admin','procurement_officer'].includes(user?.role) && (
            <button className="btn btn-success" onClick={generatePO} disabled={generatingPo}>
              {generatingPo ? 'Generating...' : '📦 Generate PO'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      <div className="responsive-grid-2-1">
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Line Items</h3>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                <tbody>
                  {(quotation.items || []).map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.product_name || item.rfq_item_name || 'Item'}</strong></td>
                      <td>{item.quantity}</td>
                      <td>₹{Number(item.unit_price || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(item.total_price || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', padding: '16px', borderTop: '2px solid var(--border-light)', fontSize: '1.1rem', fontWeight: 700 }}>
              Grand Total: <span style={{ color: 'var(--primary-600)' }}>₹{Number(quotation.total_amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {quotation.notes && (
            <div className="card">
              <h3 style={{ marginBottom: '12px' }}>Vendor Notes</h3>
              <p className="text-sm">{quotation.notes}</p>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Summary</h3>
            {[['Vendor', quotation.vendor_name], ['Delivery', `${quotation.delivery_days} days`], ['Submitted', quotation.submitted_at ? new Date(quotation.submitted_at).toLocaleDateString('en-IN') : new Date(quotation.created_at).toLocaleDateString('en-IN')], ['RFQ', quotation.rfq_number || quotation.rfq_title]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: '12px' }}>
                <div className="text-xs text-muted">{l}</div>
                <div className="text-sm" style={{ fontWeight: 500 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
