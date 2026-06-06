'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (status) params.status = status;
    api.get('/invoices', { params })
      .then(res => { setInvoices(res.data.data || []); setPagination(res.data.pagination || {}); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [page, status]);

  const statusColor = { generated: 'badge-blue', sent: 'badge-orange', paid: 'badge-green', overdue: 'badge-red' };

  const downloadPdf = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF download failed'); }
  };

  const sendEmail = async (id) => {
    try {
      await api.post(`/invoices/${id}/email`);
      toast.success('Invoice emailed to vendor!');
    } catch { toast.error('Email failed'); }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage and track invoices</p>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="generated">Generated</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Invoice #</th><th>Vendor</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [1,2,3].map(i => <tr key={i}><td colSpan={6}><div className="skeleton skeleton-text" /></td></tr>) :
             invoices.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🧾</div><h3>No invoices</h3><p>Invoices will appear here once generated from purchase orders</p></div></td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id}>
                <td><span className="font-mono text-sm" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{inv.invoice_number}</span></td>
                <td><strong>{inv.vendor_name || '—'}</strong></td>
                <td style={{ fontWeight: 700 }}>₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}</td>
                <td className="text-sm">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                <td><span className={`badge ${statusColor[inv.status] || 'badge-gray'}`}>{inv.status}</span></td>
                <td>
                  <div className="table-actions">
                    <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-sm">View</Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => downloadPdf(inv.id)} title="Download PDF">📥</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => sendEmail(inv.id)} title="Send Email">📧</button>
                  </div>
                </td>
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
