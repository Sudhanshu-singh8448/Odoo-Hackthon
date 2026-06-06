'use client';
import { useState } from 'react';

const initialVendor = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  gst_number: '',
  category: '',
  address: '',
  city: '',
  state: '',
};

export default function VendorForm({ initialValues = {}, onSubmit, submitLabel = 'Save Vendor' }) {
  const [form, setForm] = useState({ ...initialVendor, ...initialValues });
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.(form); }}>
      <div className="form-row">
        <label className="form-group"><span className="form-label">Company Name</span><input className="form-input" required value={form.company_name} onChange={e => update('company_name', e.target.value)} /></label>
        <label className="form-group"><span className="form-label">Contact Person</span><input className="form-input" required value={form.contact_person} onChange={e => update('contact_person', e.target.value)} /></label>
      </div>
      <div className="form-row">
        <label className="form-group"><span className="form-label">Email</span><input className="form-input" type="email" required value={form.email} onChange={e => update('email', e.target.value)} /></label>
        <label className="form-group"><span className="form-label">Phone</span><input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} /></label>
      </div>
      <div className="form-row">
        <label className="form-group"><span className="form-label">GST Number</span><input className="form-input" value={form.gst_number} onChange={e => update('gst_number', e.target.value)} /></label>
        <label className="form-group"><span className="form-label">Category</span><input className="form-input" value={form.category} onChange={e => update('category', e.target.value)} /></label>
      </div>
      <label className="form-group"><span className="form-label">Address</span><input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} /></label>
      <div className="form-row">
        <label className="form-group"><span className="form-label">City</span><input className="form-input" value={form.city} onChange={e => update('city', e.target.value)} /></label>
        <label className="form-group"><span className="form-label">State</span><input className="form-input" value={form.state} onChange={e => update('state', e.target.value)} /></label>
      </div>
      <button className="btn btn-primary" type="submit">{submitLabel}</button>
    </form>
  );
}
