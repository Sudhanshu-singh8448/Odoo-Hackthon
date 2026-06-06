'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'procurement_officer', phone: '' });
  const [search, setSearch] = useState('');
  const toast = useToast();

  const load = () => {
    setLoading(true);
    const params = { limit: 50 };
    if (search) params.search = search;
    api.get('/users', { params })
      .then(res => setUsers(res.data.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'procurement_officer', phone: '' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const updates = { name: form.name, email: form.email, role: form.role, phone: form.phone };
        await api.put(`/users/${editUser.id}`, updates);
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed'); }
  };

  const roleColor = { admin: 'badge-red', procurement_officer: 'badge-blue', manager: 'badge-purple', vendor: 'badge-green' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and roles</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <button className="btn btn-secondary" onClick={load}>Search</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [1,2,3].map(i => <tr key={i}><td colSpan={6}><div className="skeleton skeleton-text" /></td></tr>) :
             users.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👥</div><h3>No users found</h3></div></td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="sidebar-avatar" style={{ width: '32px', height: '32px', fontSize: '0.7rem' }}>{u.name?.charAt(0).toUpperCase()}</div>
                    <strong>{u.name}</strong>
                  </div>
                </td>
                <td className="text-sm">{u.email}</td>
                <td><span className={`badge ${roleColor[u.role] || 'badge-gray'}`}>{u.role?.replace('_',' ')}</span></td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="text-sm text-muted">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>{u.is_active ? '🔒' : '🔓'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="john@company.com" />
                </div>
                {!editUser && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" required value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="Min 6 chars" minLength={6} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}>
                    <option value="admin">Admin</option>
                    <option value="procurement_officer">Procurement Officer</option>
                    <option value="manager">Manager</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+91 9876543210" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editUser ? 'Update' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
