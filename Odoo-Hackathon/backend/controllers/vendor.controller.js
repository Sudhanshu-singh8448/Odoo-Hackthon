const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../services/notification.service');

exports.getAll = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    if (search) {
      where.push(`(company_name ILIKE $${idx} OR contact_person ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (category) { where.push(`category = $${idx}`); params.push(category); idx++; }
    if (status) { where.push(`status = $${idx}`); params.push(status); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM vendors ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT * FROM vendors ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
    const result = await db.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw new AppError('Vendor not found.', 404);

    // Get vendor stats
    const statsRes = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM quotations WHERE vendor_id = $1) as total_quotations,
        (SELECT COUNT(*) FROM purchase_orders WHERE vendor_id = $1) as total_pos,
        (SELECT COUNT(*) FROM invoices WHERE vendor_id = $1) as total_invoices,
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE vendor_id = $1) as total_business
    `, [req.params.id]);

    res.json({ success: true, data: { ...result.rows[0], stats: statsRes.rows[0] } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { company_name, contact_person, email, phone, gst_number, address, city, state, pincode, category, notes } = req.body;

    const result = await db.query(
      `INSERT INTO vendors (company_name, contact_person, email, phone, gst_number, address, city, state, pincode, category, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [company_name, contact_person, email, phone, gst_number, address, city, state, pincode, category, notes]
    );

    await logActivity(req.user.id, 'CREATE', 'vendor', result.rows[0].id, `Vendor created: ${company_name}`);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { company_name, contact_person, email, phone, gst_number, address, city, state, pincode, category, notes, rating } = req.body;

    const result = await db.query(
      `UPDATE vendors SET company_name=$1, contact_person=$2, email=$3, phone=$4, gst_number=$5,
       address=$6, city=$7, state=$8, pincode=$9, category=$10, notes=$11, rating=COALESCE($12, rating), updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [company_name, contact_person, email, phone, gst_number, address, city, state, pincode, category, notes, rating, req.params.id]
    );

    if (result.rows.length === 0) throw new AppError('Vendor not found.', 404);

    await logActivity(req.user.id, 'UPDATE', 'vendor', req.params.id, `Vendor updated: ${company_name}`);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE vendors SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Vendor not found.', 404);

    await logActivity(req.user.id, 'STATUS_CHANGE', 'vendor', req.params.id, `Vendor status changed to: ${status}`);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM vendors WHERE id = $1 RETURNING id, company_name', [req.params.id]);
    if (result.rows.length === 0) throw new AppError('Vendor not found.', 404);

    await logActivity(req.user.id, 'DELETE', 'vendor', req.params.id, `Vendor deleted: ${result.rows[0].company_name}`);

    res.json({ success: true, message: 'Vendor deleted.' });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const result = await db.query('SELECT DISTINCT category FROM vendors WHERE category IS NOT NULL ORDER BY category');
    res.json({ success: true, data: result.rows.map(r => r.category) });
  } catch (err) { next(err); }
};
