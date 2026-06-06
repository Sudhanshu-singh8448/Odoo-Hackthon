'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

function CompareContent() {
  const searchParams = useSearchParams();
  const rfqId = searchParams.get('rfq_id');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price');
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!rfqId) { setLoading(false); return; }
    api.get(`/rfqs/${rfqId}/compare`).then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load comparison'))
      .finally(() => setLoading(false));
  }, [rfqId]);

  const submitForApproval = async (quotationId) => {
    try {
      await api.post('/approvals', { quotation_id: quotationId });
      toast.success('Sent for approval!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '400px' }} /></div>;
  if (!data || !data.quotations?.length) return (
    <div className="page-container"><div className="empty-state"><div className="empty-icon">⚖️</div><h3>No quotations to compare</h3><p>Need at least 2 quotations for comparison</p></div></div>
  );

  let sorted = [...data.quotations];
  if (sortBy === 'price') sorted.sort((a, b) => a.total_amount - b.total_amount);
  else if (sortBy === 'delivery') sorted.sort((a, b) => a.delivery_days - b.delivery_days);
  else if (sortBy === 'rating') sorted.sort((a, b) => (b.vendor_rating || 0) - (a.vendor_rating || 0));

  const lowest = Math.min(...sorted.map(q => q.total_amount));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compare Quotations</h1>
          <p className="page-subtitle">{data.rfq_title || 'RFQ Comparison'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="text-sm text-muted">Sort by:</span>
          {[{v:'price',l:'Price'},{v:'delivery',l:'Delivery'},{v:'rating',l:'Rating'}].map(s => (
            <button key={s.v} className={`btn btn-sm ${sortBy === s.v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSortBy(s.v)}>{s.l}</button>
          ))}
          <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      <div className="comparison-grid">
        {sorted.map(q => (
          <div key={q.id} className={`comparison-card ${q.total_amount === lowest ? 'lowest' : ''}`}>
            {q.total_amount === lowest && <span className="lowest-badge">💎 Best Price</span>}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '4px' }}>{q.vendor_name}</h3>
              <span className="font-mono text-xs text-muted">{q.quotation_number}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: q.total_amount === lowest ? 'var(--success-600)' : 'var(--primary-600)' }}>
                  ₹{Number(q.total_amount).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-muted">Total Amount</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{q.delivery_days}</div>
                <div className="text-xs text-muted">Delivery Days</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>Vendor Rating</div>
              <div>{'⭐'.repeat(Math.round(q.vendor_rating || 0))} <span className="text-sm text-muted">{Number(q.vendor_rating || 0).toFixed(1)}</span></div>
            </div>

            {q.items && q.items.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '8px' }}>Item Pricing</div>
                {q.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8rem', borderBottom: '1px solid var(--border-light)' }}>
                    <span>{item.product_name || 'Item'}</span>
                    <span style={{ fontWeight: 600 }}>₹{Number(item.unit_price || 0).toLocaleString('en-IN')}/unit</span>
                  </div>
                ))}
              </div>
            )}

            {q.notes && <p className="text-xs text-muted" style={{ marginBottom: '16px', fontStyle: 'italic' }}>"{q.notes}"</p>}

            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => submitForApproval(q.id)}>
              ✅ Select & Send for Approval
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return <Suspense fallback={<div className="page-container"><div className="skeleton skeleton-card" style={{ height: '400px' }} /></div>}><CompareContent /></Suspense>;
}
