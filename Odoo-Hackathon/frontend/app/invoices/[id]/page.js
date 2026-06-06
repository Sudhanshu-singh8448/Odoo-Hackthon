'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get(`/invoices/${id}`).then(res => setInvoice(res.data.data))
      .catch(() => toast.error('Invoice not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `${invoice?.invoice_number || 'invoice'}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF download failed'); }
  };

  const sendEmail = async () => {
    try {
      await api.post(`/invoices/${id}/email`);
      toast.success('Invoice emailed to vendor!');
      setInvoice(p => ({ ...p, email_sent: true }));
    } catch { toast.error('Email failed — check SMTP settings'); }
  };

  const updateStatus = async (status) => {
    try {
      await api.patch(`/invoices/${id}/status`, { status });
      setInvoice(p => ({ ...p, status }));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
  };

  if (loading) return <div className="page-container"><div className="skeleton skeleton-card" style={{ height: '600px' }} /></div>;
  if (!invoice) return <div className="page-container"><div className="empty-state"><h3>Invoice not found</h3></div></div>;

  const statusColor = { generated: 'badge-blue', sent: 'badge-orange', paid: 'badge-green', overdue: 'badge-red' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 className="page-title">{invoice.invoice_number}</h1>
            <span className={`badge ${statusColor[invoice.status]}`}>{invoice.status}</span>
            {invoice.email_sent && <span className="badge badge-green">📧 Emailed</span>}
          </div>
          <p className="page-subtitle">Invoice Detail</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={downloadPdf}>📥 Download PDF</button>
          <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Print</button>
          <button className="btn btn-outline" onClick={sendEmail}>📧 Send Email</button>
          {invoice.status !== 'paid' && <button className="btn btn-success" onClick={() => updateStatus('paid')}>💰 Mark Paid</button>}
          <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="invoice-preview">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px', borderBottom: '3px solid var(--primary-600)' }}>
          <div>
            <h2 style={{ color: 'var(--primary-600)', fontSize: '1.75rem', marginBottom: '4px' }}>INVOICE</h2>
            <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{invoice.invoice_number}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>VendorBridge Inc.</div>
            <div className="text-sm text-muted">Procurement & Vendor Management</div>
            <div className="text-xs text-muted" style={{ marginTop: '4px' }}>contact@vendorbridge.com</div>
          </div>
        </div>

        {/* Bill To & Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '8px', letterSpacing: '0.05em' }}>BILL TO</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{invoice.vendor_name || '—'}</div>
            <div className="text-sm text-muted">{invoice.vendor_email || ''}</div>
            {invoice.vendor_gst && <div className="text-sm text-muted">GST: {invoice.vendor_gst}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '8px' }}>
              <div className="text-xs text-muted">INVOICE DATE</div>
              <div className="text-sm" style={{ fontWeight: 500 }}>{new Date(invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div className="text-xs text-muted">DUE DATE</div>
              <div className="text-sm" style={{ fontWeight: 500, color: invoice.status === 'overdue' ? 'var(--error-500)' : undefined }}>
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">PO REFERENCE</div>
              <div className="text-sm font-mono" style={{ fontWeight: 500 }}>{invoice.po_number || '—'}</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="table" style={{ marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: 'var(--gray-900)' }}>
              <th style={{ color: 'white' }}>#</th>
              <th style={{ color: 'white' }}>Description</th>
              <th style={{ color: 'white' }}>Qty</th>
              <th style={{ color: 'white' }}>Unit Price</th>
              <th style={{ color: 'white', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, i) => (
              <tr key={item.id || i}>
                <td>{i + 1}</td>
                <td><strong>{item.product_name}</strong>{item.unit && <span className="text-xs text-muted"> ({item.unit})</span>}</td>
                <td>{item.quantity}</td>
                <td>₹{Number(item.unit_price || 0).toLocaleString('en-IN')}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(item.total_price || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem', borderBottom: '1px solid var(--border-light)' }}>
              <span className="text-muted">Subtotal</span>
              <span>₹{Number(invoice.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem', borderBottom: '1px solid var(--border-light)' }}>
              <span className="text-muted">Tax {invoice.tax_rate ? `(${invoice.tax_rate}%)` : ''}</span>
              <span>₹{Number(invoice.tax_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1.3rem', fontWeight: 700, borderTop: '3px solid var(--primary-600)', marginTop: '4px' }}>
              <span>Total Due</span>
              <span style={{ color: 'var(--primary-600)' }}>₹{Number(invoice.total_amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          <p className="text-xs text-muted">Payment is due within 30 days. Please include the invoice number in your payment reference.</p>
          <p className="text-xs text-muted" style={{ marginTop: '4px' }}>Thank you for your business! — VendorBridge</p>
        </div>
      </div>
    </div>
  );
}
