'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [spending, setSpending] = useState({ by_category: [], by_vendor: [] });
  const [trends, setTrends] = useState([]);
  const [exportType, setExportType] = useState('vendor-performance');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/reports/procurement-stats').catch(() => ({ data: { data: {} } })),
      api.get('/reports/vendor-performance').catch(() => ({ data: { data: [] } })),
      api.get('/reports/spending-summary').catch(() => ({ data: { data: { by_category: [], by_vendor: [] } } })),
      api.get('/reports/monthly-trends').catch(() => ({ data: { data: [] } })),
    ]).then(([s, v, sp, t]) => {
      setStats(s.data.data);
      setVendors(v.data.data || []);
      setSpending(sp.data.data || { by_category: [], by_vendor: [] });
      setTrends(t.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (v) => {
    const n = Number(v) || 0;
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  const downloadCsv = async () => {
    try {
      const res = await api.get('/reports/export', { params: { type: exportType }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('CSV export failed');
    }
  };

  if (loading) return (
    <div className="page-container">
      <div className="stat-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      <div className="skeleton skeleton-card" style={{ height: '300px', marginTop: '24px' }} />
    </div>
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Procurement performance insights</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto' }} value={exportType} onChange={e => setExportType(e.target.value)}>
            <option value="vendor-performance">Vendor Performance</option>
            <option value="spending-by-category">Spending by Category</option>
            <option value="spending-by-vendor">Spending by Vendor</option>
            <option value="monthly-trends">Monthly Trends</option>
            <option value="procurement-stats">Procurement Stats</option>
          </select>
          <button className="btn btn-primary" onClick={downloadCsv}>Export CSV</button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid">
        {[
          { label: 'Total RFQs', value: stats?.total_rfqs || 0, icon: '📋', color: 'blue' },
          { label: 'Total POs', value: stats?.total_pos || 0, icon: '📦', color: 'green' },
          { label: 'PO Value', value: fmt(stats?.total_po_value), icon: '💰', color: 'purple' },
          { label: 'Active Vendors', value: stats?.active_vendors || 0, icon: '🏢', color: 'orange' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="responsive-grid-1-1" style={{ marginBottom: '24px' }}>
        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header"><h3>Monthly Procurement Trend</h3></div>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends}>
                <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmt} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Value']} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px' }}><p>No trend data</p></div>}
        </div>

        {/* Spending by Category */}
        <div className="card">
          <div className="card-header"><h3>Spending by Category</h3></div>
          {spending.by_category.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={spending.by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {spending.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px' }}><p>No category data</p></div>}
        </div>
      </div>

      {/* Spending by Vendor */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3>Top Vendors by Spending</h3></div>
        {spending.by_vendor.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spending.by_vendor} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmt} />
              <YAxis type="category" dataKey="company_name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={120} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="empty-state" style={{ padding: '40px' }}><p>No vendor data</p></div>}
      </div>

      {/* Vendor Performance Table */}
      <div className="card">
        <div className="card-header"><h3>Vendor Performance</h3></div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead><tr><th>Vendor</th><th>Category</th><th>Rating</th><th>Quotations</th><th>POs</th><th>Total Business</th><th>Avg Delivery</th></tr></thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted">No vendor data</td></tr>
              ) : vendors.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.company_name}</strong></td>
                  <td><span className="badge badge-blue">{v.category || '—'}</span></td>
                  <td>{'⭐'.repeat(Math.round(v.rating || 0))} <span className="text-xs text-muted">{Number(v.rating || 0).toFixed(1)}</span></td>
                  <td>{v.total_quotations}</td>
                  <td>{v.total_pos}</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(v.total_business || 0).toLocaleString('en-IN')}</td>
                  <td>{Math.round(v.avg_delivery_days || 0)} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
