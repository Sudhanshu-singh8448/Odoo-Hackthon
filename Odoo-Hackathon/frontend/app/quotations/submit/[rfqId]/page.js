'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function SubmitQuotationPage() {
  const { rfqId } = useParams();
  const [rfq, setRfq] = useState(null);
  const [prices, setPrices] = useState({});
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get(`/rfqs/${rfqId}`).then(res => {
      setRfq(res.data.data);
      const initial = {};
      (res.data.data.items || []).forEach(item => { initial[item.id] = { unit_price: 0, quantity: item.quantity }; });
      setPrices(initial);
    }).catch(() => toast.error('RFQ not found'))
      .finally(() => setLoading(false));
  }, [rfqId]);

  const updatePrice = (itemId, price) => {
    setPrices(p => ({ ...p, [itemId]: { ...p[itemId], unit_price: parseFloat(price) || 0 } }));
  };

  const total = Object.entries(prices).reduce((sum, [_, p]) => sum + (p.unit_price * p.quantity), 0);

  const handleSubmit = async () => {
    const itemsList = Object.entries(prices).map(([rfq_item_id, p]) => ({
      rfq_item_id, unit_price: p.unit_price, quantity: p.quantity, total_price: p.unit_price * p.quantity
    }));
    if (itemsList.some(i => i.unit_price <= 0)) { toast.error('Enter prices for all items'); return; }
    setSubmitting(true);
    try {
      await api.post('/quotations', { rfq_id: rfqId, delivery_days: deliveryDays, notes, items: itemsList, total_amount: total });
      toast.success('Quotation submitted!');
      router.push('/quotations');
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '400px' }} /></div>;
  if (!rfq) return <div className="page-container"><div className="empty-state"><h3>RFQ not found</h3></div></div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Quotation</h1>
          <p className="page-subtitle">For {rfq.rfq_number} — {rfq.title}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
      </div>

      <div className="responsive-grid-2-1">
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Price Your Items</h3>
          {(rfq.items || []).map((item, i) => (
            <div key={item.id} style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>{item.product_name}</strong>
                  {item.specification && <div className="text-xs text-muted">{item.specification}</div>}
                </div>
                <span className="badge badge-gray">{item.quantity} {item.unit}</span>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit Price (₹)</label>
                  <input className="form-input" type="number" min={0} step="0.01" value={prices[item.id]?.unit_price || ''} onChange={e => updatePrice(item.id, e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Line Total</label>
                  <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontWeight: 700, color: 'var(--primary-600)' }}>
                    ₹{((prices[item.id]?.unit_price || 0) * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="form-row" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Delivery Timeline (days)</label>
              <input className="form-input" type="number" min={1} value={deliveryDays} onChange={e => setDeliveryDays(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes / Comments</label>
            <textarea className="form-textarea" placeholder="Any terms, conditions, or notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: '88px' }}>
            <h3 style={{ marginBottom: '20px' }}>Summary</h3>
            {(rfq.items || []).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)' }}>
                <span>{item.product_name} × {item.quantity}</span>
                <span>₹{((prices[item.id]?.unit_price || 0) * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1.1rem', fontWeight: 700, borderTop: '2px solid var(--text-primary)', marginTop: '8px' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--primary-600)' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              Delivery: {deliveryDays} day{deliveryDays > 1 ? 's' : ''}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : '📤 Submit Quotation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
