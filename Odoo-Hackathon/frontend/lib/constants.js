// Role constants
export const ROLES = {
  ADMIN: 'admin',
  PROCUREMENT_OFFICER: 'procurement_officer',
  MANAGER: 'manager',
  VENDOR: 'vendor',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  procurement_officer: 'Procurement Officer',
  manager: 'Manager / Approver',
  vendor: 'Vendor',
};

export const ROLE_COLORS = {
  admin: 'badge-red',
  procurement_officer: 'badge-blue',
  manager: 'badge-purple',
  vendor: 'badge-green',
};

// Status maps
export const RFQ_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

export const RFQ_STATUS_COLORS = {
  draft: 'badge-gray',
  open: 'badge-green',
  closed: 'badge-blue',
  cancelled: 'badge-red',
};

export const QUOTATION_STATUS_COLORS = {
  submitted: 'badge-blue',
  under_review: 'badge-orange',
  accepted: 'badge-green',
  rejected: 'badge-red',
};

export const APPROVAL_STATUS_COLORS = {
  pending: 'badge-orange',
  approved: 'badge-green',
  rejected: 'badge-red',
};

export const PO_STATUS_COLORS = {
  generated: 'badge-blue',
  sent: 'badge-orange',
  acknowledged: 'badge-purple',
  fulfilled: 'badge-green',
};

export const INVOICE_STATUS_COLORS = {
  generated: 'badge-blue',
  sent: 'badge-orange',
  paid: 'badge-green',
  overdue: 'badge-red',
};

export const VENDOR_STATUS_COLORS = {
  active: 'badge-green',
  inactive: 'badge-gray',
  blacklisted: 'badge-red',
};

export const PRIORITY_COLORS = {
  high: 'badge-red',
  medium: 'badge-orange',
  low: 'badge-gray',
};

// Categories
export const VENDOR_CATEGORIES = [
  'IT Services',
  'Office Supplies',
  'Manufacturing',
  'Logistics',
  'Security',
  'Consulting',
  'Raw Materials',
  'Marketing',
  'Facilities',
];

export const UNITS = [
  'units', 'pieces', 'sets', 'kg', 'liters',
  'boxes', 'reams', 'packs', 'meters', 'tons',
];

// Pagination
export const DEFAULT_PAGE_SIZE = 15;

// Entity Icons (for activity logs)
export const ENTITY_ICONS = {
  rfq: '📋',
  quotation: '💰',
  approval: '✅',
  purchase_order: '📦',
  invoice: '🧾',
  vendor: '🏢',
  user: '👤',
};
