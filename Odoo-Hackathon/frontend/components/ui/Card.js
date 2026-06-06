export default function Card({ title, actions, className = '', children, ...props }) {
  return (
    <section className={`card ${className}`.trim()} {...props}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3>{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
