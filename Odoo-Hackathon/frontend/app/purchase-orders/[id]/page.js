'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function PODetailPage() {
  const { id } = useParams();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get(`/purchase-orders/${id}`).then(res => setPo(res.data.data))
      .catch(() => toast.error('PO not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status });
      setPo(p => ({ ...p, status }));
      toast.success(`Status updated to ${status}`);
    } catch (err) { toast.error('Update failed'); }
  };

  const generateInvoice = async () => {
    try {
      await api.post('/invoices', { po_id: id });
      toast.success('Invoice generated!');
      router.push('/invoices');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate invoice'); }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '500px' }} /></div>;
  if (!po) return <div className="page-container"><div className="empty-state"><h3>PO not found</h3></div></div>;

  const statusColor = { generated: 'badge-blue', sent: 'badge-orange', acknowledged: 'badge-purple', fulfilled: 'badge-green' };
  const statusFlow = ['generated', 'sent', 'acknowledged', 'fulfilled'];
  const currentIdx = statusFlow.indexOf(po.status);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 className="page-title">{po.po_number}</h1>
            <span className={`badge ${statusColor[po.status]}`}>{po.status}</span>
          </div>
          <p className="page-subtitle">Purchase Order Details</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {currentIdx < statusFlow.length - 1 && (
            <button className="btn btn-primary" onClick={() => updateStatus(statusFlow[currentIdx + 1])}>
              📤 Mark as {statusFlow[currentIdx + 1]}
            </button>
          )}
          <button className="btn btn-success" onClick={generateInvoice}>🧾 Generate Invoice</button>
          <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      {/* Status Progress */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusFlow.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: i <= currentIdx ? 'var(--primary-600)' : 'var(--gray-200)',
                color: i <= currentIdx ? 'white' : 'var(--gray-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
              }}>{i + 1}</div>
              <div style={{ marginLeft: '8px', flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize', color: i <= currentIdx ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{s}</div>
              </div>
              {i < statusFlow.length - 1 && <div style={{ width: '40px', height: '2px', background: i < currentIdx ? 'var(--primary-500)' : 'var(--gray-200)', margin: '0 4px' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          {/* PO Document Style */}
          <div className="card">
            <div style={{ borderBottom: '3px solid var(--primary-600)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ color: 'var(--primary-600)', marginBottom: '4px' }}>PURCHASE ORDER</h2>
                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{po.po_number}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-sm"><strong>VendorBridge Inc.</strong></div>
                  <div className="text-xs text-muted">Procurement Platform</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>VENDOR</div>
                <div style={{ fontWeight: 600 }}>{po.vendor_name || '—'}</div>
                <div className="text-sm text-muted">{po.vendor_email || ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>DATE</div>
                <div className="text-sm">{new Date(po.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="table" style={{ marginBottom: '16px' }}>
              <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {(po.items || []).map((item, i) => (
                  <tr key={item.id || i}>
                    <td>{i + 1}</td>
                    <td><strong>{item.product_name}</strong></td>
                    <td>{item.quantity}</td>
                    <td>{item.unit || '—'}</td>
                    <td>₹{Number(item.unit_price || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(item.total_price || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '280px' }}>
                {[['Subtotal', po.subtotal], ['Tax', po.tax_amount]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', borderBottom: '1px solid var(--border-light)' }}>
                    <span className="text-muted">{l} {l === 'Tax' && po.tax_rate ? `(${po.tax_rate}%)` : ''}</span>
                    <span>₹{Number(v || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1.2rem', fontWeight: 700, borderTop: '2px solid var(--text-primary)' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary-600)' }}>₹{Number(po.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Details</h3>
            {[['PO Number', po.po_number], ['Created', new Date(po.created_at).toLocaleDateString('en-IN')], ['Status', po.status], ['Vendor', po.vendor_name]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <div className="text-xs text-muted">{l}</div>
                <div className="text-sm" style={{ fontWeight: 500 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
          {po.quotation_id && (
            <div className="card">
              <h3 style={{ marginBottom: '12px' }}>References</h3>
              <Link href={`/quotations/${po.quotation_id}`} className="btn btn-outline btn-sm" style={{ width: '100%' }}>View Linked Quotation</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
