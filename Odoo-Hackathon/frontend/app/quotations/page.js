'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  useEffect(() => {
    api.get('/quotations', { params: { page, limit: 15 } })
      .then(res => { setQuotations(res.data.data || []); setPagination(res.data.pagination || {}); })
      .catch(() => toast.error('Failed to load quotations'))
      .finally(() => setLoading(false));
  }, [page]);

  const statusColor = { submitted: 'badge-blue', under_review: 'badge-orange', accepted: 'badge-green', rejected: 'badge-red' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">View and manage vendor quotations</p>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Quotation #</th><th>RFQ</th><th>Vendor</th><th>Amount</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [1,2,3].map(i => <tr key={i}><td colSpan={7}><div className="skeleton skeleton-text" /></td></tr>) :
             quotations.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">💰</div><h3>No quotations</h3><p>Quotations from vendors will appear here</p></div></td></tr>
            ) : quotations.map(q => (
              <tr key={q.id}>
                <td><span className="font-mono text-sm" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{q.quotation_number}</span></td>
                <td>{q.rfq_title || q.rfq_number || '—'}</td>
                <td><strong>{q.vendor_name || '—'}</strong></td>
                <td style={{ fontWeight: 700 }}>₹{Number(q.total_amount || 0).toLocaleString('en-IN')}</td>
                <td>{q.delivery_days} days</td>
                <td><span className={`badge ${statusColor[q.status] || 'badge-gray'}`}>{q.status?.replace('_',' ')}</span></td>
                <td><Link href={`/quotations/${q.id}`} className="btn btn-ghost btn-sm">View</Link></td>
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
