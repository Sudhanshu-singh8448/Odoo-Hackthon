'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      const { data } = await api.get('/vendors', { params });
      setVendors(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, category, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const statusColor = { active: 'badge-green', inactive: 'badge-gray', blacklisted: 'badge-red' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">Manage your vendor directory</p>
        </div>
        <Link href="/vendors/new" className="btn btn-primary">+ Add Vendor</Link>
      </div>

      <form className="filter-bar" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {['IT Services','Office Supplies','Manufacturing','Logistics','Security'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: '130px' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Category</th>
              <th>City</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}><td colSpan={7}><div className="skeleton skeleton-text" /></td></tr>
              ))
            ) : vendors.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-icon">🏢</div>
                  <h3>No vendors found</h3>
                  <p>Add your first vendor to get started</p>
                  <Link href="/vendors/new" className="btn btn-primary">+ Add Vendor</Link>
                </div>
              </td></tr>
            ) : vendors.map(v => (
              <tr key={v.id}>
                <td><strong>{v.company_name}</strong></td>
                <td>
                  <div>{v.contact_person}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{v.email}</div>
                </td>
                <td><span className="badge badge-blue">{v.category || '—'}</span></td>
                <td>{v.city || '—'}</td>
                <td>{'⭐'.repeat(Math.round(v.rating || 0))} <span className="text-xs text-muted">{Number(v.rating || 0).toFixed(1)}</span></td>
                <td><span className={`badge ${statusColor[v.status] || 'badge-gray'}`}>{v.status}</span></td>
                <td>
                  <div className="table-actions">
                    <Link href={`/vendors/${v.id}`} className="btn btn-ghost btn-sm">View</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.pages > 1 && (
          <div className="pagination">
            <div className="pagination-info">Showing page {page} of {pagination.pages} ({pagination.total} vendors)</div>
            <div className="pagination-buttons">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="pagination-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
