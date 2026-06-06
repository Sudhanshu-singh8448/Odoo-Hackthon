'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (status) params.status = status;
    api.get('/purchase-orders', { params })
      .then(res => { setOrders(res.data.data || []); setPagination(res.data.pagination || {}); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [page, status]);

  const statusColor = { generated: 'badge-blue', sent: 'badge-orange', acknowledged: 'badge-purple', fulfilled: 'badge-green' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Track and manage purchase orders</p>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="generated">Generated</option>
          <option value="sent">Sent</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>PO Number</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [1,2,3].map(i => <tr key={i}><td colSpan={6}><div className="skeleton skeleton-text" /></td></tr>) :
             orders.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📦</div><h3>No purchase orders</h3><p>Purchase orders will appear here after quotation approval</p></div></td></tr>
            ) : orders.map(po => (
              <tr key={po.id}>
                <td><span className="font-mono text-sm" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{po.po_number}</span></td>
                <td><strong>{po.vendor_name || '—'}</strong></td>
                <td style={{ fontWeight: 700 }}>₹{Number(po.total_amount || 0).toLocaleString('en-IN')}</td>
                <td><span className={`badge ${statusColor[po.status] || 'badge-gray'}`}>{po.status}</span></td>
                <td className="text-sm text-muted">{new Date(po.created_at).toLocaleDateString('en-IN')}</td>
                <td><Link href={`/purchase-orders/${po.id}`} className="btn btn-ghost btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.pages > 1 && (
          <div className="pagination">
            <div className="pagination-info">Page {page} of {pagination.pages}</div>
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
