const db = require('../config/db');

exports.vendorPerformance = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT v.id, v.company_name, v.rating, v.category, v.status,
        COUNT(DISTINCT q.id) as total_quotations,
        COUNT(DISTINCT po.id) as total_pos,
        COALESCE(SUM(po.total_amount), 0) as total_business,
        COALESCE(AVG(q.delivery_days), 0) as avg_delivery_days
      FROM vendors v
      LEFT JOIN quotations q ON v.id = q.vendor_id
      LEFT JOIN purchase_orders po ON v.id = po.vendor_id
      GROUP BY v.id, v.company_name, v.rating, v.category, v.status
      ORDER BY total_business DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.procurementStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM rfqs) as total_rfqs,
        (SELECT COUNT(*) FROM quotations) as total_quotations,
        (SELECT COUNT(*) FROM purchase_orders) as total_pos,
        (SELECT COUNT(*) FROM invoices) as total_invoices,
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders) as total_po_value,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') as total_paid,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status IN ('generated', 'sent')) as total_pending,
        (SELECT COUNT(*) FROM vendors WHERE status = 'active') as active_vendors
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.spendingSummary = async (req, res, next) => {
  try {
    const byCategory = await db.query(`
      SELECT v.category, COUNT(po.id) as order_count, COALESCE(SUM(po.total_amount), 0) as total
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.id
      WHERE v.category IS NOT NULL
      GROUP BY v.category ORDER BY total DESC
    `);

    const byVendor = await db.query(`
      SELECT v.company_name, COUNT(po.id) as order_count, COALESCE(SUM(po.total_amount), 0) as total
      FROM purchase_orders po JOIN vendors v ON po.vendor_id = v.id
      GROUP BY v.company_name ORDER BY total DESC LIMIT 10
    `);

    res.json({ success: true, data: { by_category: byCategory.rows, by_vendor: byVendor.rows } });
  } catch (err) { next(err); }
};

exports.monthlyTrends = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        TO_CHAR(created_at, 'Mon YYYY') as month,
        TO_CHAR(created_at, 'YYYY-MM') as sort_key,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM purchase_orders
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY sort_key ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};
