export default function Timeline({ items = [] }) {
  return (
    <div className="timeline">
      {items.map(item => (
        <div className="timeline-item" key={item.id || `${item.title}-${item.time}`}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.title}</div>
            {item.description && <div className="text-sm text-muted">{item.description}</div>}
            {item.time && <div className="timeline-time">{item.time}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
