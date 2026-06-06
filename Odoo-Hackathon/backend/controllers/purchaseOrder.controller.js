const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { logActivity, createNotification } = require('../services/notification.service');
const { createPurchaseOrderFromQuotation } = require('../services/purchaseOrder.service');
const { ensureVendorEntityAccess } = require('../utils/access');

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
        where.push(`po.vendor_id = $${idx}`); params.push(vendorRes.rows[0].id); idx++;
      } else {
        return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
      }
    }

    if (status) { where.push(`po.status = $${idx}`); params.push(status); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM purchase_orders po ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT po.*, v.company_name as vendor_name, u.name as created_by_name,
        (SELECT COUNT(*) FROM invoices WHERE po_id = po.id) as has_invoice
       FROM purchase_orders po
       JOIN vendors v ON po.vendor_id = v.id
       JOIN users u ON po.created_by = u.id
       ${whereClause}
       ORDER BY po.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
    if (req.user.role === 'vendor') {
      await ensureVendorEntityAccess(req.user.id, 'purchase_orders', req.params.id);
    }

    const poRes = await db.query(
      `SELECT po.*, v.company_name as vendor_name, v.email as vendor_email, v.gst_number as vendor_gst,
        v.address as vendor_address, v.city as vendor_city, v.state as vendor_state,
        u.name as created_by_name, q.quotation_number
       FROM purchase_orders po
       JOIN vendors v ON po.vendor_id = v.id
       JOIN users u ON po.created_by = u.id
       JOIN quotations q ON po.quotation_id = q.id
       WHERE po.id = $1`, [req.params.id]
    );
    if (poRes.rows.length === 0) throw new AppError('Purchase order not found.', 404);

    const items = await db.query('SELECT * FROM po_items WHERE po_id = $1', [req.params.id]);

    const invoiceRes = await db.query('SELECT * FROM invoices WHERE po_id = $1', [req.params.id]);

    res.json({
      success: true,
      data: { ...poRes.rows[0], items: items.rows, invoice: invoiceRes.rows[0] || null },
    });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { quotation_id, tax_rate = 18 } = req.body;

    const result = await db.withTransaction(async (client) => (
      createPurchaseOrderFromQuotation({
        quotationId: quotation_id,
        userId: req.user.id,
        taxRate: tax_rate,
        query: client.query.bind(client),
      })
    ));

    if (!result.created) {
      throw new AppError('PO already exists for this quotation.', 409);
    }

    // Notify vendor
    const vendor = await db.query('SELECT user_id FROM vendors WHERE id = $1', [result.quotation.vendor_id]);
    if (vendor.rows[0]?.user_id) {
      await createNotification(vendor.rows[0].user_id, 'Purchase Order Generated',
        `A purchase order ${result.po.po_number} has been created for your quotation.`,
        'po', `/purchase-orders/${result.po.id}`);
    }

    await logActivity(req.user.id, 'CREATE', 'purchase_order', result.po.id, `PO created: ${result.po.po_number}`);

    res.status(201).json({ success: true, data: result.po });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Purchase order not found.', 404);

    await logActivity(req.user.id, 'STATUS_CHANGE', 'purchase_order', req.params.id, `PO status changed to: ${status}`);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
