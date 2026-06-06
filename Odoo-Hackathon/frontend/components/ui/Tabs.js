export default function Tabs({ tabs = [], value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button key={tab.value} className={`tab ${value === tab.value ? 'active' : ''}`} onClick={() => onChange(tab.value)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
