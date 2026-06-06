export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="empty-state" aria-live="polite">
      <div className="skeleton skeleton-card" style={{ width: '100%', height: 120 }} />
      <p>{label}</p>
    </div>
  );
}
