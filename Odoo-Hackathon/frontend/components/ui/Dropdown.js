export default function Dropdown({ trigger, children, open }) {
  return (
    <div style={{ position: 'relative' }}>
      {trigger}
      {open && <div className="notif-dropdown">{children}</div>}
    </div>
  );
}
