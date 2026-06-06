'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function VendorDetailPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get(`/vendors/${id}`).then(res => {
      setVendor(res.data.data);
      setForm(res.data.data);
    }).catch(() => toast.error('Vendor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    try {
      const { data } = await api.put(`/vendors/${id}`, form);
      setVendor(data.data);
      setEditing(false);
      toast.success('Vendor updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleStatusChange = async (status) => {
    try {
      const { data } = await api.patch(`/vendors/${id}/status`, { status });
      setVendor(data.data);
      toast.success(`Vendor ${status}`);
    } catch (err) { toast.error('Status update failed'); }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '300px' }} /></div>;
  if (!vendor) return <div className="page-container"><div className="empty-state"><h3>Vendor not found</h3></div></div>;

  const statusColor = { active: 'badge-green', inactive: 'badge-gray', blacklisted: 'badge-red' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{vendor.company_name}</h1>
          <p className="page-subtitle">Vendor Profile</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : '✏️ Edit'}</button>
          <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      <div className="responsive-grid-1-1">
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Contact Information</h3>
          {editing ? (
            <>
              {[['company_name','Company Name'],['contact_person','Contact Person'],['email','Email'],['phone','Phone'],['gst_number','GST Number'],['address','Address'],['city','City'],['state','State']].map(([k,l]) => (
                <div className="form-group" key={k}>
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={form[k] || ''} onChange={e => setForm(p => ({...p, [k]: e.target.value}))} />
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
            </>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {[['Contact', vendor.contact_person], ['Email', vendor.email], ['Phone', vendor.phone], ['GST', vendor.gst_number], ['Address', `${vendor.address || ''}, ${vendor.city || ''}, ${vendor.state || ''}`]].map(([l,v]) => (
                <div key={l}>
                  <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>{l}</div>
                  <div style={{ fontSize: '0.9rem' }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Status & Rating</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className={`badge ${statusColor[vendor.status]}`}>{vendor.status}</span>
              <span className="badge badge-blue">{vendor.category || 'Uncategorized'}</span>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className="text-xs text-muted">Rating</div>
              <div style={{ fontSize: '1.5rem' }}>{'⭐'.repeat(Math.round(vendor.rating || 0))} <span className="text-sm text-muted">{Number(vendor.rating || 0).toFixed(1)}/5</span></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {vendor.status !== 'active' && <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('active')}>Activate</button>}
              {vendor.status !== 'inactive' && <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('inactive')}>Deactivate</button>}
              {vendor.status !== 'blacklisted' && <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange('blacklisted')}>Blacklist</button>}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '8px' }}>Quick Stats</h3>
            <div className="text-sm text-muted">Registered on {new Date(vendor.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
