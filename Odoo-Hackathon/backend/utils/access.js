const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const getVendorForUser = async (userId, query = db.query) => {
  const result = await query(
    'SELECT id, company_name, user_id FROM vendors WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

const requireVendorForUser = async (userId, query = db.query) => {
  const vendor = await getVendorForUser(userId, query);
  if (!vendor) {
    throw new AppError('No vendor profile is linked to this user.', 403);
  }
  return vendor;
};

const ensureVendorRfqAccess = async (userId, rfqId, query = db.query) => {
  const vendor = await requireVendorForUser(userId, query);
  const assigned = await query(
    'SELECT id FROM rfq_vendors WHERE rfq_id = $1 AND vendor_id = $2',
    [rfqId, vendor.id]
  );

  if (assigned.rows.length === 0) {
    throw new AppError('RFQ not found or not assigned to this vendor.', 403);
  }

  return vendor;
};

const ensureVendorQuotationAccess = async (userId, quotationId, query = db.query) => {
  const vendor = await requireVendorForUser(userId, query);
  const quotation = await query(
    'SELECT id FROM quotations WHERE id = $1 AND vendor_id = $2',
    [quotationId, vendor.id]
  );

  if (quotation.rows.length === 0) {
    throw new AppError('Quotation not found.', 404);
  }

  return vendor;
};

const ensureVendorEntityAccess = async (userId, tableName, entityId, query = db.query) => {
  const allowedTables = new Set(['purchase_orders', 'invoices']);
  if (!allowedTables.has(tableName)) {
    throw new AppError('Invalid access check.', 500);
  }

  const vendor = await requireVendorForUser(userId, query);
  const result = await query(
    `SELECT id FROM ${tableName} WHERE id = $1 AND vendor_id = $2`,
    [entityId, vendor.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Record not found.', 404);
  }

  return vendor;
};

module.exports = {
  getVendorForUser,
  requireVendorForUser,
  ensureVendorRfqAccess,
  ensureVendorQuotationAccess,
  ensureVendorEntityAccess,
};
