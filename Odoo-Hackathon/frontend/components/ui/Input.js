export default function Input({ label, className = '', ...props }) {
  return (
    <label className="form-group">
      {label && <span className="form-label">{label}</span>}
      <input className={`form-input ${className}`.trim()} {...props} />
    </label>
  );
}
