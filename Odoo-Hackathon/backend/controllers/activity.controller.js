const db = require('../config/db');

exports.getLogs = async (req, res, next) => {
  try {
    const { entity_type, user_id, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    if (entity_type) { where.push(`al.entity_type = $${idx}`); params.push(entity_type); idx++; }
    if (user_id) { where.push(`al.user_id = $${idx}`); params.push(user_id); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM activity_logs al ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT al.*, u.name as user_name, u.role as user_role
       FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id
       ${whereClause} ORDER BY al.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ success: true, data: result.rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};
