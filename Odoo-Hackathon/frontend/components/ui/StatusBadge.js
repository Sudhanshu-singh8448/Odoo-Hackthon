const toneByStatus = {
  active: 'green',
  inactive: 'gray',
  blacklisted: 'red',
  draft: 'gray',
  open: 'green',
  closed: 'blue',
  cancelled: 'red',
  submitted: 'blue',
  under_review: 'orange',
  accepted: 'green',
  rejected: 'red',
  pending: 'orange',
  approved: 'green',
  generated: 'blue',
  sent: 'orange',
  acknowledged: 'purple',
  fulfilled: 'green',
  paid: 'green',
  overdue: 'red',
};

export default function StatusBadge({ status }) {
  const label = String(status || 'unknown').replace('_', ' ');
  return <span className={`badge badge-${toneByStatus[status] || 'gray'}`}>{label}</span>;
}
