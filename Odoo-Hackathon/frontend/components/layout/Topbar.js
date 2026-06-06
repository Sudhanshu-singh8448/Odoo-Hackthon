'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function Topbar({ onMenuToggle }) {
  const { user } = useAuth();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(res => {
      setNotifs(res.data.data?.slice(0, 8) || []);
      setUnread(res.data.unread_count || 0);
    }).catch(() => {});
  }, [user]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      await api.patch(`/notifications/${notification.id}/read`).catch(() => {});
      setUnread(prev => Math.max(0, prev - 1));
      setNotifs(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
    setShowNotifs(false);
    if (notification.link) router.push(notification.link);
  };

  if (!user) return null;

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Hamburger for mobile */}
        <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className="topbar-search">
          <span style={{ color: 'var(--text-tertiary)' }}>🔍</span>
          <input type="text" placeholder="Search vendors, RFQs, invoices..." />
        </div>
      </div>

      <div className="topbar-actions">
        <div style={{ position: 'relative' }}>
          <button className="notification-btn" onClick={() => setShowNotifs(!showNotifs)}>
            🔔
            {unread > 0 && <span className="notification-badge" />}
          </button>

          {showNotifs && (
            <div className="notif-dropdown">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>}
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No notifications</div>
              ) : notifs.map(n => (
                <button key={n.id} type="button" onClick={() => openNotification(n)} style={{
                  padding: '10px 16px', borderBottom: '1px solid var(--border-light)',
                  background: n.is_read ? 'transparent' : 'var(--primary-50)',
                  cursor: 'pointer', fontSize: '0.85rem', border: 0, width: '100%', textAlign: 'left'
                }}>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>{n.title}</strong>
                  <span style={{ color: 'var(--text-tertiary)' }}>{n.message?.slice(0, 80)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
          {user.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
