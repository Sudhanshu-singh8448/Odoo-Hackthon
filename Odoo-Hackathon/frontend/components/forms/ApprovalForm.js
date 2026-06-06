'use client';
import { useState } from 'react';

export default function ApprovalForm({ onDecide }) {
  const [remarks, setRemarks] = useState('');

  return (
    <div>
      <label className="form-group">
        <span className="form-label">Remarks</span>
        <textarea className="form-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-success" onClick={() => onDecide?.('approved', remarks)}>Approve</button>
        <button className="btn btn-danger" onClick={() => onDecide?.('rejected', remarks)}>Reject</button>
      </div>
    </div>
  );
}
