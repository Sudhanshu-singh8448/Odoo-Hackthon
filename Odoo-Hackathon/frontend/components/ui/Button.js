export default function Button({ className = '', variant = 'primary', size = '', icon, children, ...props }) {
  const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(' ');
  return (
    <button className={classes} {...props}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
