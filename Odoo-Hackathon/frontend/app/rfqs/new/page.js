'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function NewRFQPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', priority: 'medium' });
  const [items, setItems] = useState([{ product_name: '', specification: '', quantity: 1, unit: 'units' }]);
  const [vendors, setVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    api.get('/vendors', { params: { limit: 100, status: 'active' } }).then(res => setAllVendors(res.data.data || [])).catch(() => {});
  }, []);

  const addItem = () => setItems(p => [...p, { product_name: '', specification: '', quantity: 1, unit: 'units' }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const toggleVendor = (id) => {
    setSelectedVendors(p => p.includes(id) ? p.filter(v => v !== id) : [...p, id]);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.deadline) { toast.error('Title and deadline required'); return; }
    if (items.some(i => !i.product_name)) { toast.error('All items need a product name'); return; }
    setLoading(true);
    try {
      await api.post('/rfqs', { ...form, items, vendor_ids: selectedVendors });
      toast.success('RFQ created successfully!');
      router.push('/rfqs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create RFQ');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New RFQ</h1>
          <p className="page-subtitle">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
        {[1,2,3,4].map(s => (
          <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? 'var(--primary-500)' : 'var(--gray-200)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Basic Information</h3>
            <div className="form-group">
              <label className="form-label">RFQ Title *</label>
              <input className="form-input" placeholder="e.g., Office IT Equipment Q3" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Describe what you need..." value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Deadline *</label>
                <input className="form-input" type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Line Items</h3>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '12px', position: 'relative' }}>
                {items.length > 1 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => removeItem(i)} style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--error-500)' }}>✕</button>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" placeholder="e.g., Laptop" value={item.product_name} onChange={e => updateItem(i, 'product_name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specification</label>
                    <input className="form-input" placeholder="e.g., 14-inch, i7, 16GB" value={item.specification} onChange={e => updateItem(i, 'specification', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                      {['units','pieces','sets','kg','liters','boxes','reams','packs','meters'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Select Vendors */}
        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Invite Vendors ({selectedVendors.length} selected)</h3>
            {allVendors.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <p>No active vendors. Add vendors first.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {allVendors.map(v => (
                  <div
                    key={v.id}
                    onClick={() => toggleVendor(v.id)}
                    style={{
                      padding: '14px', border: `2px solid ${selectedVendors.includes(v.id) ? 'var(--primary-500)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedVendors.includes(v.id) ? 'var(--primary-50)' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{v.company_name}</strong>
                      {selectedVendors.includes(v.id) && <span style={{ color: 'var(--primary-600)', fontWeight: 700 }}>✓</span>}
                    </div>
                    <div className="text-xs text-muted">{v.category || 'General'} · {v.city || ''}</div>
                    <div className="text-xs" style={{ marginTop: '4px' }}>{'⭐'.repeat(Math.round(v.rating || 0))} {Number(v.rating || 0).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Review & Submit</h3>
            <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div className="text-xs text-muted">TITLE</div>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>{form.title}</div>
              <div className="text-xs text-muted">DESCRIPTION</div>
              <div className="text-sm" style={{ marginBottom: '8px' }}>{form.description || '—'}</div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div><span className="text-xs text-muted">Deadline: </span>{form.deadline}</div>
                <div><span className="text-xs text-muted">Priority: </span><span className={`badge ${form.priority === 'high' ? 'badge-red' : form.priority === 'medium' ? 'badge-orange' : 'badge-gray'}`}>{form.priority}</span></div>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className="text-xs text-muted" style={{ marginBottom: '8px' }}>ITEMS ({items.length})</div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                  <span>{item.product_name}</span>
                  <span className="text-muted">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: '8px' }}>VENDORS ({selectedVendors.length})</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedVendors.map(vid => {
                  const v = allVendors.find(x => x.id === vid);
                  return v ? <span key={vid} className="badge badge-blue">{v.company_name}</span> : null;
                })}
                {selectedVendors.length === 0 && <span className="text-sm text-muted">No vendors selected (can be added later)</span>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
          <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}>
            {step === 1 ? '← Cancel' : '← Back'}
          </button>
          {step < 4 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : '🚀 Create RFQ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
