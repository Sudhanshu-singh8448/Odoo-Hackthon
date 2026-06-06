const { AppError } = require('../middleware/errorHandler');

const generatePoNumber = async (query) => {
  const result = await query("SELECT nextval('po_seq')");
  const seq = result.rows[0].nextval;
  const year = new Date().getFullYear();
  return `PO-${year}-${String(seq).padStart(5, '0')}`;
};

const createPurchaseOrderFromQuotation = async ({
  quotationId,
  userId,
  taxRate = 18,
  query,
}) => {
  const qRes = await query(
    `SELECT q.*, v.company_name, r.title as rfq_title
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     JOIN rfqs r ON q.rfq_id = r.id
     WHERE q.id = $1 AND q.status = 'accepted'`,
    [quotationId]
  );

  if (qRes.rows.length === 0) {
    throw new AppError('Approved quotation not found.', 404);
  }

  const existing = await query(
    'SELECT * FROM purchase_orders WHERE quotation_id = $1',
    [quotationId]
  );

  if (existing.rows.length > 0) {
    return { po: existing.rows[0], quotation: qRes.rows[0], created: false };
  }

  const quotation = qRes.rows[0];
  const poNumber = await generatePoNumber(query);
  const subtotal = parseFloat(quotation.total_amount);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const poRes = await query(
    `INSERT INTO purchase_orders
      (po_number, quotation_id, vendor_id, created_by, subtotal, tax_rate, tax_amount, total_amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [poNumber, quotationId, quotation.vendor_id, userId, subtotal, taxRate, taxAmount, totalAmount]
  );
  const po = poRes.rows[0];

  const qItems = await query(
    `SELECT qi.*, ri.product_name, ri.unit
     FROM quotation_items qi
     JOIN rfq_items ri ON qi.rfq_item_id = ri.id
     WHERE qi.quotation_id = $1`,
    [quotationId]
  );

  for (const item of qItems.rows) {
    await query(
      `INSERT INTO po_items (po_id, product_name, quantity, unit, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [po.id, item.product_name, item.quantity, item.unit, item.unit_price, item.total_price]
    );
  }

  return { po, quotation, created: true };
};

module.exports = { createPurchaseOrderFromQuotation };
