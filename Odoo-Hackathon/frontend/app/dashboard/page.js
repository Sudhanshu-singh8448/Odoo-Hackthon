'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
      api.get('/dashboard/recent-activity').catch(() => ({ data: { data: [] } })),
      api.get('/dashboard/spending-trend').catch(() => ({ data: { data: [] } })),
    ]).then(([s, a, t]) => {
      setStats(s.data.data);
      setActivity(a.data.data || []);
      setTrend(t.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (v) => {
    const n = Number(v) || 0;
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  if (loading) return (
    <div className="page-container">
      <div className="stat-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}
      </div>
    </div>
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
        <div className="quick-actions">
          {['admin','procurement_officer'].includes(user?.role) && (
            <>
              <Link href="/rfqs/new" className="btn btn-primary">+ New RFQ</Link>
              <Link href="/vendors/new" className="btn btn-secondary">+ Add Vendor</Link>
            </>
          )}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div>
            <div className="stat-value">{stats?.active_rfqs || 0}</div>
            <div className="stat-label">Active RFQs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div>
            <div className="stat-value">{stats?.pending_approvals || 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📦</div>
          <div>
            <div className="stat-value">{stats?.recent_pos || 0}</div>
            <div className="stat-label">Recent POs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🏢</div>
          <div>
            <div className="stat-value">{stats?.active_vendors || 0}</div>
            <div className="stat-label">Active Vendors</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3>Spending Trend</h3>
            <span className="badge badge-blue">Last 12 months</span>
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={fmt} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Amount']} />
                <Area type="monotone" dataKey="total_amount" stroke="#6366f1" strokeWidth={2} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>No spending data yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <Link href="/activity" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}><p>No activity yet</p></div>
          ) : (
            <div className="timeline">
              {activity.slice(0, 8).map(a => (
                <div key={a.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{a.action}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{a.details}</div>
                    <div className="timeline-time">{a.user_name} · {timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
