'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function NewVendorPage() {
  const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', gst_number: '', address: '', city: '', state: '', category: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/vendors', form);
      toast.success('Vendor registered successfully');
      router.push('/vendors');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register New Vendor</h1>
          <p className="page-subtitle">Add a vendor to your directory</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '720px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-input" required value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input className="form-input" required value={form.contact_person} onChange={e => update('contact_person', e.target.value)} placeholder="John Doe" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="vendor@company.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 9876543210" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input className="form-input" value={form.gst_number} onChange={e => update('gst_number', e.target.value)} placeholder="29ABCDE1234F1Z5" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => update('category', e.target.value)}>
                <option value="">Select category</option>
                {['IT Services','Office Supplies','Manufacturing','Logistics','Security','Consulting','Raw Materials'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Business Park" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Bangalore" />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-input" value={form.state} onChange={e => update('state', e.target.value)} placeholder="Karnataka" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Register Vendor'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
