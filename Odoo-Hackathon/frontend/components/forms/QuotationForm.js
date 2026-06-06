'use client';
import { useState } from 'react';

export default function QuotationForm({ rfqItems = [], onSubmit, submitLabel = 'Submit Quotation' }) {
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [prices, setPrices] = useState({});

  const items = rfqItems.map(item => ({
    rfq_item_id: item.id,
    quantity: item.quantity,
    unit_price: Number(prices[item.id] || 0),
  }));

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.({ delivery_days: deliveryDays, notes, items }); }}>
      {rfqItems.map(item => (
        <div className="form-row" key={item.id}>
          <div><strong>{item.product_name}</strong><div className="text-xs text-muted">{item.quantity} {item.unit}</div></div>
          <input className="form-input" type="number" min="0.01" step="0.01" placeholder="Unit price" value={prices[item.id] || ''} onChange={e => setPrices(prev => ({ ...prev, [item.id]: e.target.value }))} />
        </div>
      ))}
      <label className="form-group"><span className="form-label">Delivery Days</span><input className="form-input" type="number" min="1" value={deliveryDays} onChange={e => setDeliveryDays(Number(e.target.value))} /></label>
      <label className="form-group"><span className="form-label">Notes</span><textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} /></label>
      <button className="btn btn-primary" type="submit">{submitLabel}</button>
    </form>
  );
}
