/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN')}`;
}

/**
 * Compact currency format (e.g., ₹1.2Cr, ₹5.4L, ₹12K)
 */
export function formatCompactCurrency(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

/**
 * Relative time ago string
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN');
}

/**
 * Format date to Indian locale
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';
  const defaults = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-IN', { ...defaults, ...options });
}

/**
 * Format date as ISO date (YYYY-MM-DD)
 */
export function toISODate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

/**
 * Calculate days until a deadline
 * Returns negative if expired
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str, maxLen = 80) {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen) + '…';
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Generate star rating string
 */
export function starRating(rating) {
  const rounded = Math.round(Number(rating) || 0);
  return '⭐'.repeat(Math.min(rounded, 5));
}

/**
 * Get initials from a name (e.g., "John Doe" → "JD")
 */
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
}

/**
 * Download a blob response as a file
 */
export function downloadBlob(blobData, filename) {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
