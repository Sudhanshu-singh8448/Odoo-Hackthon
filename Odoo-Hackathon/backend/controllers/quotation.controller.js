const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { logActivity, createNotification } = require('../services/notification.service');
const { requireVendorForUser, ensureVendorQuotationAccess } = require('../utils/access');

const generateQuotationNumber = async (query = db.query) => {
  const result = await query("SELECT nextval('quotation_seq')");
  const seq = result.rows[0].nextval;
  const year = new Date().getFullYear();
  return `QT-${year}-${String(seq).padStart(5, '0')}`;
};

exports.getAll = async (req, res, next) => {
  try {
    const { rfq_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    // Vendors see only their own quotations
    if (req.user.role === 'vendor') {
      const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorRes.rows.length > 0) {
        where.push(`q.vendor_id = $${idx}`); params.push(vendorRes.rows[0].id); idx++;
      } else {
        return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
      }
    }

    if (rfq_id) { where.push(`q.rfq_id = $${idx}`); params.push(rfq_id); idx++; }
    if (status) { where.push(`q.status = $${idx}`); params.push(status); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM quotations q ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT q.*, v.company_name as vendor_name, r.title as rfq_title, r.rfq_number
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       ${whereClause}
       ORDER BY q.submitted_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
      await ensureVendorQuotationAccess(req.user.id, req.params.id);
    }

    const qRes = await db.query(
      `SELECT q.*, v.company_name as vendor_name, v.email as vendor_email, v.rating as vendor_rating,
        r.title as rfq_title, r.rfq_number, r.deadline as rfq_deadline,
        po.id as purchase_order_id, po.po_number
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       LEFT JOIN purchase_orders po ON po.quotation_id = q.id
       WHERE q.id = $1`, [req.params.id]
    );
    if (qRes.rows.length === 0) throw new AppError('Quotation not found.', 404);

    const items = await db.query(
      `SELECT qi.*, ri.product_name, ri.specification, ri.unit
       FROM quotation_items qi
       JOIN rfq_items ri ON qi.rfq_item_id = ri.id
       WHERE qi.quotation_id = $1`, [req.params.id]
    );

    res.json({ success: true, data: { ...qRes.rows[0], items: items.rows } });
  } catch (err) { next(err); }
};

exports.submit = async (req, res, next) => {
  try {
    const { rfq_id, delivery_days, notes, items } = req.body;
    let rfqRow;

    const quotation = await db.withTransaction(async (client) => {
      const query = client.query.bind(client);
      const vendor = await requireVendorForUser(req.user.id, query);

      const rfq = await query("SELECT * FROM rfqs WHERE id = $1 AND status = 'open'", [rfq_id]);
      if (rfq.rows.length === 0) throw new AppError('RFQ not found or not accepting quotations.', 404);
      rfqRow = rfq.rows[0];

      const assigned = await query(
        'SELECT * FROM rfq_vendors WHERE rfq_id = $1 AND vendor_id = $2',
        [rfq_id, vendor.id]
      );
      if (assigned.rows.length === 0) throw new AppError('Vendor not assigned to this RFQ.', 403);

      const existing = await query(
        'SELECT id FROM quotations WHERE rfq_id = $1 AND vendor_id = $2',
        [rfq_id, vendor.id]
      );
      if (existing.rows.length > 0) throw new AppError('Quotation already submitted for this RFQ.', 409);

      const validItems = Array.isArray(items) ? items : null;
      for (const item of validItems || []) {
        const rfqItem = await query(
          'SELECT id, quantity FROM rfq_items WHERE id = $1 AND rfq_id = $2',
          [item.rfq_item_id, rfq_id]
        );
        if (rfqItem.rows.length === 0) throw new AppError('Quotation contains an invalid RFQ item.', 400);
      }

      const total_amount = validItems.reduce((sum, item) => (
        sum + (Number(item.unit_price || 0) * Number(item.quantity || 0))
      ), 0);
      const quotation_number = await generateQuotationNumber(query);

      const qRes = await query(
        `INSERT INTO quotations (quotation_number, rfq_id, vendor_id, total_amount, delivery_days, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [quotation_number, rfq_id, vendor.id, total_amount, delivery_days, notes]
      );
      const createdQuotation = qRes.rows[0];

      for (const item of validItems) {
        const totalPrice = item.unit_price * item.quantity;
        await query(
          `INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, quantity, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [createdQuotation.id, item.rfq_item_id, item.unit_price, item.quantity, totalPrice]
        );
      }

      return createdQuotation;
    });

    // Notify RFQ creator
    await createNotification(rfqRow.created_by, 'Quotation Received',
      `A quotation has been submitted for RFQ: ${rfqRow.title}`,
      'rfq', `/rfqs/${rfq_id}`);

    await logActivity(req.user.id, 'SUBMIT', 'quotation', quotation.id, `Quotation submitted for RFQ: ${rfqRow.title}`);

    res.status(201).json({ success: true, data: quotation });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { delivery_days, notes, items } = req.body;

    const quotation = await db.withTransaction(async (client) => {
      const query = client.query.bind(client);
      const vendor = await ensureVendorQuotationAccess(req.user.id, req.params.id, query);

      const validItems = items || [];
      for (const item of validItems) {
        const rfqItem = await query(
          `SELECT ri.id
           FROM rfq_items ri
           JOIN quotations q ON q.rfq_id = ri.rfq_id
           WHERE ri.id = $1 AND q.id = $2`,
          [item.rfq_item_id, req.params.id]
        );
        if (rfqItem.rows.length === 0) throw new AppError('Quotation contains an invalid RFQ item.', 400);
      }

      const total_amount = validItems
        ? validItems.reduce((sum, item) => (
        sum + (Number(item.unit_price || 0) * Number(item.quantity || 0))
        ), 0)
        : null;

      const qRes = await query(
        `UPDATE quotations SET delivery_days=$1, notes=$2, total_amount=COALESCE($3, total_amount), updated_at=NOW()
         WHERE id=$4 AND vendor_id=$5 AND status='submitted' RETURNING *`,
        [delivery_days, notes, total_amount, req.params.id, vendor.id]
      );
      if (qRes.rows.length === 0) throw new AppError('Quotation not found or not editable.', 404);

      if (validItems) {
        await query('DELETE FROM quotation_items WHERE quotation_id = $1', [req.params.id]);
        for (const item of validItems) {
          const totalPrice = item.unit_price * item.quantity;
          await query(
            `INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, quantity, total_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.params.id, item.rfq_item_id, item.unit_price, item.quantity, totalPrice]
          );
        }
      }

      return qRes.rows[0];
    });

    res.json({ success: true, data: quotation });
  } catch (err) { next(err); }
};

exports.compare = async (req, res, next) => {
  try {
    const { rfq_id } = req.query;
    if (!rfq_id) throw new AppError('rfq_id is required.', 400);

    const rfq = await db.query('SELECT * FROM rfqs WHERE id = $1', [rfq_id]);
    if (rfq.rows.length === 0) throw new AppError('RFQ not found.', 404);

    const quotations = await db.query(
      `SELECT q.*, v.company_name as vendor_name, v.rating as vendor_rating, v.email as vendor_email
       FROM quotations q JOIN vendors v ON q.vendor_id = v.id
       WHERE q.rfq_id = $1 ORDER BY q.total_amount ASC`, [rfq_id]
    );

    // Get items for each quotation
    const detailed = [];
    for (const q of quotations.rows) {
      const items = await db.query(
        `SELECT qi.*, ri.product_name, ri.specification, ri.unit
         FROM quotation_items qi JOIN rfq_items ri ON qi.rfq_item_id = ri.id
         WHERE qi.quotation_id = $1`, [q.id]
      );
      detailed.push({ ...q, items: items.rows });
    }

    const rfqItems = await db.query('SELECT * FROM rfq_items WHERE rfq_id = $1', [rfq_id]);

    res.json({
      success: true,
      data: {
        rfq: rfq.rows[0],
        rfq_title: rfq.rows[0].title,
        rfq_items: rfqItems.rows,
        quotations: detailed,
      },
    });
  } catch (err) { next(err); }
};
