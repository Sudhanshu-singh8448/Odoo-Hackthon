const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { logActivity, createNotification } = require('../services/notification.service');
const { createPurchaseOrderFromQuotation } = require('../services/purchaseOrder.service');

exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    if (req.user.role === 'manager') {
      where.push(`(a.status = 'pending' OR a.approved_by = $${idx})`);
      params.push(req.user.id);
      idx++;
    } else if (req.user.role !== 'admin') {
      where.push(`a.requested_by = $${idx}`); params.push(req.user.id); idx++;
    }

    if (status) { where.push(`a.status = $${idx}`); params.push(status); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM approvals a ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT a.*, q.quotation_number, q.total_amount, q.delivery_days,
        v.company_name as vendor_name,
        r.title as rfq_title, r.rfq_number,
        u1.name as requested_by_name, u1.name as requester_name,
        u2.name as approved_by_name, u2.name as approver_name
       FROM approvals a
       JOIN quotations q ON a.quotation_id = q.id
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       JOIN users u1 ON a.requested_by = u1.id
       LEFT JOIN users u2 ON a.approved_by = u2.id
       ${whereClause}
       ORDER BY a.requested_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
    const result = await db.query(
      `SELECT a.*, q.quotation_number, q.total_amount, q.delivery_days, q.notes as quotation_notes,
        v.company_name as vendor_name, v.email as vendor_email, v.rating as vendor_rating,
        r.title as rfq_title, r.rfq_number, r.description as rfq_description,
        u1.name as requested_by_name, u1.name as requester_name,
        u2.name as approved_by_name, u2.name as approver_name
       FROM approvals a
       JOIN quotations q ON a.quotation_id = q.id
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       JOIN users u1 ON a.requested_by = u1.id
       LEFT JOIN users u2 ON a.approved_by = u2.id
       WHERE a.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Approval not found.', 404);
    const approval = result.rows[0];

    if (req.user.role === 'manager' && approval.status !== 'pending' && approval.approved_by !== req.user.id) {
      throw new AppError('Approval not found.', 404);
    }

    if (!['admin', 'manager'].includes(req.user.role) && approval.requested_by !== req.user.id) {
      throw new AppError('Approval not found.', 404);
    }

    // Get quotation items
    const items = await db.query(
      `SELECT qi.*, ri.product_name, ri.specification, ri.unit
       FROM quotation_items qi JOIN rfq_items ri ON qi.rfq_item_id = ri.id
       WHERE qi.quotation_id = $1`, [approval.quotation_id]
    );

    res.json({ success: true, data: { ...approval, items: items.rows } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { quotation_id } = req.body;

    // Verify quotation exists
    const qRes = await db.query(
      `SELECT q.*, r.title as rfq_title FROM quotations q JOIN rfqs r ON q.rfq_id = r.id WHERE q.id = $1`, [quotation_id]
    );
    if (qRes.rows.length === 0) throw new AppError('Quotation not found.', 404);

    // Check if already has pending approval
    const existing = await db.query(
      "SELECT id FROM approvals WHERE quotation_id = $1 AND status = 'pending'", [quotation_id]
    );
    if (existing.rows.length > 0) throw new AppError('Quotation already has a pending approval request.', 409);

    // Mark quotation as under review
    await db.query("UPDATE quotations SET status = 'under_review' WHERE id = $1", [quotation_id]);

    const result = await db.query(
      `INSERT INTO approvals (quotation_id, requested_by)
       VALUES ($1, $2) RETURNING *`,
      [quotation_id, req.user.id]
    );

    // Notify all managers
    const managers = await db.query("SELECT id FROM users WHERE role = 'manager' AND is_active = true");
    for (const m of managers.rows) {
      await createNotification(m.id, 'Approval Required',
        `A quotation for "${qRes.rows[0].rfq_title}" needs your approval.`,
        'approval', `/approvals/${result.rows[0].id}`);
    }

    await logActivity(req.user.id, 'REQUEST_APPROVAL', 'approval', result.rows[0].id,
      `Approval requested for quotation: ${qRes.rows[0].quotation_number}`);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.decide = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Status must be approved or rejected.', 400);
    }

    let poResult = null;
    const approval = await db.withTransaction(async (client) => {
      const query = client.query.bind(client);
      const result = await query(
        `UPDATE approvals SET status=$1, remarks=$2, approved_by=$3, decided_at=NOW()
         WHERE id=$4 AND status='pending' RETURNING *`,
        [status, remarks, req.user.id, req.params.id]
      );
      if (result.rows.length === 0) throw new AppError('Approval not found or already decided.', 404);

      const qStatus = status === 'approved' ? 'accepted' : 'rejected';
      await query('UPDATE quotations SET status = $1 WHERE id = $2', [qStatus, result.rows[0].quotation_id]);

      if (status === 'approved') {
        poResult = await createPurchaseOrderFromQuotation({
          quotationId: result.rows[0].quotation_id,
          userId: req.user.id,
          query,
        });
      }

      return result.rows[0];
    });

    // Notify requester
    await createNotification(approval.requested_by,
      `Quotation ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your quotation approval request has been ${status}.${remarks ? ' Remarks: ' + remarks : ''}`,
      status === 'approved' ? 'success' : 'warning',
      `/approvals/${req.params.id}`);

    if (poResult?.created) {
      const vendor = await db.query('SELECT user_id FROM vendors WHERE id = $1', [poResult.quotation.vendor_id]);
      if (vendor.rows[0]?.user_id) {
        await createNotification(vendor.rows[0].user_id, 'Purchase Order Generated',
          `A purchase order ${poResult.po.po_number} has been created for your approved quotation.`,
          'po', `/purchase-orders/${poResult.po.id}`);
      }
      await logActivity(req.user.id, 'CREATE', 'purchase_order', poResult.po.id, `PO created: ${poResult.po.po_number}`);
    }

    await logActivity(req.user.id, status.toUpperCase(), 'approval', req.params.id,
      `Approval ${status}: ${remarks || 'No remarks'}`);

    res.json({ success: true, data: approval, purchase_order: poResult?.po || null });
  } catch (err) { next(err); }
};
