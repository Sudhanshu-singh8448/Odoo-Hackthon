export default function Select({ label, options = [], className = '', children, ...props }) {
  return (
    <label className="form-group">
      {label && <span className="form-label">{label}</span>}
      <select className={`form-select ${className}`.trim()} {...props}>
        {children || options.map(option => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
