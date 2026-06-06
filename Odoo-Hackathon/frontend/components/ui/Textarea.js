export default function Textarea({ label, className = '', ...props }) {
  return (
    <label className="form-group">
      {label && <span className="form-label">{label}</span>}
      <textarea className={`form-textarea ${className}`.trim()} {...props} />
    </label>
  );
}
