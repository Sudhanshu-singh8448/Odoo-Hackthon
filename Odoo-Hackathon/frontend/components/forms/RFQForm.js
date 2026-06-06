'use client';
import { useState } from 'react';

export default function RFQForm({ onSubmit, submitLabel = 'Save RFQ' }) {
  const [form, setForm] = useState({ title: '', description: '', deadline: '', priority: 'medium' });
  const [items, setItems] = useState([{ product_name: '', specification: '', quantity: 1, unit: 'units' }]);

  const updateItem = (index, key, value) => setItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.({ ...form, items }); }}>
      <label className="form-group"><span className="form-label">Title</span><input className="form-input" required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} /></label>
      <label className="form-group"><span className="form-label">Description</span><textarea className="form-textarea" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} /></label>
      <div className="form-row">
        <label className="form-group"><span className="form-label">Deadline</span><input className="form-input" type="date" required value={form.deadline} onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))} /></label>
        <label className="form-group"><span className="form-label">Priority</span><select className="form-select" value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      </div>
      {items.map((item, index) => (
        <div className="form-row" key={index}>
          <input className="form-input" placeholder="Product" value={item.product_name} onChange={e => updateItem(index, 'product_name', e.target.value)} />
          <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} />
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItems(prev => [...prev, { product_name: '', specification: '', quantity: 1, unit: 'units' }])}>Add Item</button>
      <button className="btn btn-primary" type="submit" style={{ marginLeft: 8 }}>{submitLabel}</button>
    </form>
  );
}
