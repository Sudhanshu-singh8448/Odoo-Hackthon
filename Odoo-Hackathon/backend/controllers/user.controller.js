const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

exports.getAll = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    if (role) { where.push(`role = $${idx}`); params.push(role); idx++; }
    if (search) { where.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT id, name, email, role, is_active, phone, created_at FROM users ${whereClause}
       ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ success: true, data: result.rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, is_active, phone, created_at`,
      [name, email, password_hash, role, phone]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, email, role, phone, is_active } = req.body;
    const result = await db.query(
      `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), role=COALESCE($3,role),
       phone=COALESCE($4,phone), is_active=COALESCE($5,is_active), updated_at=NOW()
       WHERE id=$6 RETURNING id, name, email, role, is_active, phone, created_at`,
      [name, email, role, phone, is_active, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('User not found.', 404);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
