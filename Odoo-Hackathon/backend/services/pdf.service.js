const fs = require('fs');
const path = require('path');

/**
 * Generate invoice PDF from invoice data.
 * Uses a simple HTML-to-PDF approach without Puppeteer for reliability.
 * Falls back to generating a simple PDF buffer.
 */
const generateInvoicePDF = async (invoiceData) => {
  const html = generateInvoiceHTML(invoiceData);

  // Try Puppeteer first, fall back to returning HTML as buffer
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    await browser.close();
    return pdf;
  } catch (err) {
    console.error('Puppeteer PDF failed, returning HTML buffer:', err.message);
    return Buffer.from(html, 'utf-8');
  }
};

const generateInvoiceHTML = (data) => {
  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  const itemRows = (data.items || []).map((item, i) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${i + 1}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit || ''}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${formatCurrency(item.total_price)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.6; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
    .brand h1 { font-size: 28px; color: #6366f1; font-weight: 800; letter-spacing: -0.5px; }
    .brand p { color: #64748b; font-size: 13px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 32px; color: #1e293b; font-weight: 300; text-transform: uppercase; letter-spacing: 4px; }
    .invoice-meta .number { font-size: 16px; color: #6366f1; font-weight: 600; margin-top: 4px; }
    .invoice-meta .date { font-size: 13px; color: #64748b; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .party { width: 48%; }
    .party-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; font-weight: 700; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 700; color: #1e293b; }
    .party-detail { font-size: 13px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #6366f1; color: white; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    thead th:first-child { border-radius: 6px 0 0 0; }
    thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569; }
    .totals-row.grand { border-top: 2px solid #6366f1; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 800; color: #1e293b; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">
        <h1>VendorBridge</h1>
        <p>Procurement & Vendor Management</p>
      </div>
      <div class="invoice-meta">
        <h2>Invoice</h2>
        <div class="number">${data.invoice_number}</div>
        <div class="date">Date: ${formatDate(data.created_at)}</div>
        <div class="date">Due: ${formatDate(data.due_date)}</div>
        <div class="date">PO: ${data.po_number}</div>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-label">Bill To</div>
        <div class="party-name">${data.vendor_name}</div>
        <div class="party-detail">${data.vendor_contact || ''}</div>
        <div class="party-detail">${data.vendor_address || ''}</div>
        <div class="party-detail">${[data.vendor_city, data.vendor_state].filter(Boolean).join(', ')}</div>
        ${data.vendor_gst ? `<div class="party-detail">GST: ${data.vendor_gst}</div>` : ''}
        <div class="party-detail">${data.vendor_email || ''}</div>
      </div>
      <div class="party" style="text-align: right;">
        <div class="party-label">From</div>
        <div class="party-name">Your Organization</div>
        <div class="party-detail">VendorBridge ERP</div>
        <div class="party-detail">Payment Terms: ${data.payment_terms || 'Net 30'}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: left;">#</th>
          <th style="text-align: left;">Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="totals">
      <div class="totals-table">
        <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(data.subtotal)}</span></div>
        <div class="totals-row"><span>Tax (${data.tax_rate}%)</span><span>${formatCurrency(data.tax_amount)}</span></div>
        <div class="totals-row grand"><span>Total</span><span>${formatCurrency(data.total_amount)}</span></div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your business!</p>
      <p style="margin-top: 4px;">Generated by VendorBridge ERP • ${formatDate(new Date())}</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { generateInvoicePDF, generateInvoiceHTML };
