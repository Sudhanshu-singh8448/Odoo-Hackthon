export default function Badge({ tone = 'gray', className = '', children }) {
  return <span className={`badge badge-${tone} ${className}`.trim()}>{children}</span>;
}
