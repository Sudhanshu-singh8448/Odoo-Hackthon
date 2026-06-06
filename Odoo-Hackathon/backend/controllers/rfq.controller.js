const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { logActivity, createNotification } = require('../services/notification.service');
const { ensureVendorRfqAccess } = require('../utils/access');

const generateRfqNumber = async (query = db.query) => {
  const result = await query("SELECT nextval('rfq_seq')");
  const seq = result.rows[0].nextval;
  const year = new Date().getFullYear();
  return `RFQ-${year}-${String(seq).padStart(5, '0')}`;
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    // Vendors only see RFQs they're assigned to
    if (req.user.role === 'vendor') {
      const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorRes.rows.length > 0) {
        where.push(`r.id IN (SELECT rfq_id FROM rfq_vendors WHERE vendor_id = $${idx})`);
        params.push(vendorRes.rows[0].id);
        idx++;
      } else {
        return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
      }
    }

    if (status) { where.push(`r.status = $${idx}`); params.push(status); idx++; }
    if (search) { where.push(`(r.title ILIKE $${idx} OR r.rfq_number ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM rfqs r ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT r.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM rfq_items WHERE rfq_id = r.id) as item_count,
        (SELECT COUNT(*) FROM rfq_vendors WHERE rfq_id = r.id) as vendor_count,
        (SELECT COUNT(*) FROM quotations WHERE rfq_id = r.id) as quotation_count
       FROM rfqs r
       LEFT JOIN users u ON r.created_by = u.id
       ${whereClause}
       ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    let vendor = null;

    const rfqRes = await db.query(
      `SELECT r.*, u.name as created_by_name
       FROM rfqs r LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`, [req.params.id]
    );
    if (rfqRes.rows.length === 0) throw new AppError('RFQ not found.', 404);

    if (req.user.role === 'vendor') {
      vendor = await ensureVendorRfqAccess(req.user.id, req.params.id);
    }

    const items = await db.query('SELECT * FROM rfq_items WHERE rfq_id = $1', [req.params.id]);
    const vendorFilter = vendor ? ' AND rv.vendor_id = $2' : '';
    const vendorParams = vendor ? [req.params.id, vendor.id] : [req.params.id];
    const vendors = await db.query(
      `SELECT rv.*, v.company_name, v.contact_person, v.email, v.rating,
        (SELECT COUNT(*) FROM quotations WHERE rfq_id = rv.rfq_id AND vendor_id = rv.vendor_id) as has_quotation
       FROM rfq_vendors rv
       JOIN vendors v ON rv.vendor_id = v.id
       WHERE rv.rfq_id = $1${vendorFilter}`,
      vendorParams
    );

    const quotationFilter = vendor ? ' AND q.vendor_id = $2' : '';
    const quotationParams = vendor ? [req.params.id, vendor.id] : [req.params.id];
    const quotations = await db.query(
      `SELECT q.*, v.company_name as vendor_name
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       WHERE q.rfq_id = $1${quotationFilter}
       ORDER BY q.total_amount ASC`,
      quotationParams
    );

    res.json({
      success: true,
      data: { ...rfqRes.rows[0], items: items.rows, vendors: vendors.rows, quotations: quotations.rows },
    });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, deadline, priority, items, vendor_ids } = req.body;

    const rfq = await db.withTransaction(async (client) => {
      const query = client.query.bind(client);
      const rfq_number = await generateRfqNumber(query);

      const rfqRes = await query(
        `INSERT INTO rfqs (rfq_number, title, description, created_by, deadline, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING *`,
        [rfq_number, title, description, req.user.id, deadline, priority || 'medium']
      );
      const createdRfq = rfqRes.rows[0];

      for (const item of items || []) {
        await query(
          'INSERT INTO rfq_items (rfq_id, product_name, specification, quantity, unit) VALUES ($1, $2, $3, $4, $5)',
          [createdRfq.id, item.product_name, item.specification, item.quantity, item.unit || 'units']
        );
      }

      for (const vid of vendor_ids || []) {
        await query(
          'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2)',
          [createdRfq.id, vid]
        );
      }

      return createdRfq;
    });

    await logActivity(req.user.id, 'CREATE', 'rfq', rfq.id, `RFQ created: ${title}`);

    res.status(201).json({ success: true, data: rfq });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { title, description, deadline, priority, items, vendor_ids } = req.body;

    const updatedRfq = await db.withTransaction(async (client) => {
      const query = client.query.bind(client);
      const rfqRes = await query(
        `UPDATE rfqs SET title=$1, description=$2, deadline=$3, priority=$4, updated_at=NOW()
         WHERE id=$5 AND status='draft' RETURNING *`,
        [title, description, deadline, priority, req.params.id]
      );
      if (rfqRes.rows.length === 0) throw new AppError('RFQ not found or not editable.', 404);

      if (items) {
        await query('DELETE FROM rfq_items WHERE rfq_id = $1', [req.params.id]);
        for (const item of items) {
          await query(
            'INSERT INTO rfq_items (rfq_id, product_name, specification, quantity, unit) VALUES ($1, $2, $3, $4, $5)',
            [req.params.id, item.product_name, item.specification, item.quantity, item.unit || 'units']
          );
        }
      }

      if (vendor_ids) {
        await query('DELETE FROM rfq_vendors WHERE rfq_id = $1', [req.params.id]);
        for (const vid of vendor_ids) {
          await query('INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2)', [req.params.id, vid]);
        }
      }

      return rfqRes.rows[0];
    });

    await logActivity(req.user.id, 'UPDATE', 'rfq', req.params.id, `RFQ updated: ${title}`);

    res.json({ success: true, data: updatedRfq });
  } catch (err) { next(err); }
};

exports.publish = async (req, res, next) => {
  try {
    const result = await db.query(
      "UPDATE rfqs SET status = 'open', updated_at = NOW() WHERE id = $1 AND status = 'draft' RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('RFQ not found or already published.', 404);

    // Notify assigned vendors
    const vendors = await db.query(
      `SELECT v.user_id FROM rfq_vendors rv JOIN vendors v ON rv.vendor_id = v.id
       WHERE rv.rfq_id = $1 AND v.user_id IS NOT NULL`, [req.params.id]
    );
    for (const v of vendors.rows) {
      await createNotification(v.user_id, 'New RFQ Invitation',
        `You've been invited to submit a quotation for: ${result.rows[0].title}`,
        'rfq', `/rfqs/${req.params.id}`);
    }

    await logActivity(req.user.id, 'PUBLISH', 'rfq', req.params.id, `RFQ published: ${result.rows[0].title}`);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.close = async (req, res, next) => {
  try {
    const result = await db.query(
      "UPDATE rfqs SET status = 'closed', updated_at = NOW() WHERE id = $1 AND status = 'open' RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('RFQ not found or not open.', 404);

    await logActivity(req.user.id, 'CLOSE', 'rfq', req.params.id, `RFQ closed: ${result.rows[0].title}`);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
