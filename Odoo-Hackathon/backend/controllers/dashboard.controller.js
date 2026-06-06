const db = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM rfqs WHERE status = 'open') as active_rfqs,
        (SELECT COUNT(*) FROM approvals WHERE status = 'pending') as pending_approvals,
        (SELECT COUNT(*) FROM purchase_orders WHERE created_at > NOW() - INTERVAL '30 days') as recent_pos,
        (SELECT COUNT(*) FROM invoices WHERE created_at > NOW() - INTERVAL '30 days') as recent_invoices,
        (SELECT COUNT(*) FROM vendors WHERE status = 'active') as active_vendors,
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders) as total_spending,
        (SELECT COUNT(*) FROM rfqs) as total_rfqs,
        (SELECT COUNT(*) FROM invoices WHERE status = 'paid') as paid_invoices
    `);

    res.json({ success: true, data: stats.rows[0] });
  } catch (err) { next(err); }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT al.*, u.name as user_name
       FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT 15`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.getSpendingTrend = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        TO_CHAR(created_at, 'Mon YYYY') as month,
        TO_CHAR(created_at, 'YYYY-MM') as sort_key,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM purchase_orders
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY sort_key ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};
