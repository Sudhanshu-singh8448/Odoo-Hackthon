export default function Table({ columns = [], rows = [], empty = 'No records found', renderActions }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map(column => <th key={column.key}>{column.label}</th>)}
            {renderActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + (renderActions ? 1 : 0)} className="text-center text-muted">{empty}</td></tr>
          ) : rows.map(row => (
            <tr key={row.id}>
              {columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
              {renderActions && <td>{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
