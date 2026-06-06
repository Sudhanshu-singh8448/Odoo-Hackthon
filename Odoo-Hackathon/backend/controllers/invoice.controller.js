const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { logActivity, createNotification } = require('../services/notification.service');
const { generateInvoicePDF } = require('../services/pdf.service');
const { sendInvoiceEmail } = require('../services/email.service');

const generateInvoiceNumber = async () => {
  const result = await db.query("SELECT nextval('invoice_seq')");
  const seq = result.rows[0].nextval;
  const year = new Date().getFullYear();
  return `INV-${year}-${String(seq).padStart(5, '0')}`;
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    if (req.user.role === 'vendor') {
      const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorRes.rows.length > 0) {
        where.push(`i.vendor_id = $${idx}`); params.push(vendorRes.rows[0].id); idx++;
      }
    }

    if (status) { where.push(`i.status = $${idx}`); params.push(status); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM invoices i ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT i.*, v.company_name as vendor_name, po.po_number
       FROM invoices i
       JOIN vendors v ON i.vendor_id = v.id
       JOIN purchase_orders po ON i.po_id = po.id
       ${whereClause}
       ORDER BY i.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({
      success: true, data: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const invRes = await db.query(
      `SELECT i.*, v.company_name as vendor_name, v.email as vendor_email,
        v.gst_number as vendor_gst, v.address as vendor_address, v.city as vendor_city,
        v.state as vendor_state, v.contact_person as vendor_contact,
        po.po_number, po.created_by
       FROM invoices i
       JOIN vendors v ON i.vendor_id = v.id
       JOIN purchase_orders po ON i.po_id = po.id
       WHERE i.id = $1`, [req.params.id]
    );
    if (invRes.rows.length === 0) throw new AppError('Invoice not found.', 404);

    const items = await db.query('SELECT * FROM po_items WHERE po_id = $1', [invRes.rows[0].po_id]);

    res.json({ success: true, data: { ...invRes.rows[0], items: items.rows } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { po_id, due_date, payment_terms } = req.body;

    const poRes = await db.query('SELECT * FROM purchase_orders WHERE id = $1', [po_id]);
    if (poRes.rows.length === 0) throw new AppError('Purchase order not found.', 404);

    const existing = await db.query('SELECT id FROM invoices WHERE po_id = $1', [po_id]);
    if (existing.rows.length > 0) throw new AppError('Invoice already exists for this PO.', 409);

    const po = poRes.rows[0];
    const invoice_number = await generateInvoiceNumber();
    const dueDate = due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days

    const result = await db.query(
      `INSERT INTO invoices (invoice_number, po_id, vendor_id, subtotal, tax_rate, tax_amount, total_amount, due_date, payment_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [invoice_number, po_id, po.vendor_id, po.subtotal, po.tax_rate, po.tax_amount, po.total_amount, dueDate, payment_terms || 'Net 30']
    );

    await logActivity(req.user.id, 'CREATE', 'invoice', result.rows[0].id, `Invoice created: ${invoice_number}`);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Invoice not found.', 404);

    await logActivity(req.user.id, 'STATUS_CHANGE', 'invoice', req.params.id, `Invoice status: ${status}`);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    // Get invoice data
    const invRes = await db.query(
      `SELECT i.*, v.company_name as vendor_name, v.email as vendor_email,
        v.gst_number as vendor_gst, v.address as vendor_address, v.city as vendor_city,
        v.state as vendor_state, v.contact_person as vendor_contact, v.phone as vendor_phone,
        po.po_number
       FROM invoices i
       JOIN vendors v ON i.vendor_id = v.id
       JOIN purchase_orders po ON i.po_id = po.id
       WHERE i.id = $1`, [req.params.id]
    );
    if (invRes.rows.length === 0) throw new AppError('Invoice not found.', 404);

    const items = await db.query('SELECT * FROM po_items WHERE po_id = $1', [invRes.rows[0].po_id]);

    const invoiceData = { ...invRes.rows[0], items: items.rows };
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoiceData.invoice_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

exports.sendEmail = async (req, res, next) => {
  try {
    const invRes = await db.query(
      `SELECT i.*, v.company_name as vendor_name, v.email as vendor_email,
        v.gst_number as vendor_gst, v.address as vendor_address, v.city as vendor_city,
        v.state as vendor_state, v.contact_person as vendor_contact, v.phone as vendor_phone,
        po.po_number
       FROM invoices i
       JOIN vendors v ON i.vendor_id = v.id
       JOIN purchase_orders po ON i.po_id = po.id
       WHERE i.id = $1`, [req.params.id]
    );
    if (invRes.rows.length === 0) throw new AppError('Invoice not found.', 404);

    const items = await db.query('SELECT * FROM po_items WHERE po_id = $1', [invRes.rows[0].po_id]);
    const invoiceData = { ...invRes.rows[0], items: items.rows };

    const pdfBuffer = await generateInvoicePDF(invoiceData);
    await sendInvoiceEmail(invoiceData, pdfBuffer);

    // Mark as sent
    await db.query("UPDATE invoices SET status = 'sent', email_sent = true, updated_at = NOW() WHERE id = $1", [req.params.id]);

    await logActivity(req.user.id, 'EMAIL_SENT', 'invoice', req.params.id,
      `Invoice emailed to: ${invoiceData.vendor_email}`);

    res.json({ success: true, message: `Invoice sent to ${invoiceData.vendor_email}` });
  } catch (err) { next(err); }
};
