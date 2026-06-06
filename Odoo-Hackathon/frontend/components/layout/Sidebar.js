'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = {
  main: [
    { href: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin','procurement_officer','manager','vendor'] },
  ],
  procurement: [
    { href: '/vendors', icon: '🏢', label: 'Vendors', roles: ['admin','procurement_officer'] },
    { href: '/rfqs', icon: '📋', label: 'RFQs', roles: ['admin','procurement_officer','vendor'] },
    { href: '/quotations', icon: '💰', label: 'Quotations', roles: ['admin','procurement_officer','vendor','manager'] },
    { href: '/approvals', icon: '✅', label: 'Approvals', roles: ['admin','procurement_officer','manager'] },
  ],
  orders: [
    { href: '/purchase-orders', icon: '📦', label: 'Purchase Orders', roles: ['admin','procurement_officer','vendor'] },
    { href: '/invoices', icon: '🧾', label: 'Invoices', roles: ['admin','procurement_officer','vendor'] },
  ],
  insights: [
    { href: '/activity', icon: '📝', label: 'Activity Logs', roles: ['admin','procurement_officer','manager'] },
    { href: '/reports', icon: '📈', label: 'Reports', roles: ['admin','procurement_officer','manager'] },
  ],
  admin: [
    { href: '/admin/users', icon: '👥', label: 'User Management', roles: ['admin'] },
    { href: '/admin/settings', icon: '⚙️', label: 'Settings', roles: ['admin'] },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const filterByRole = (items) => items.filter(item => item.roles.includes(user.role));

  const sections = [
    { title: 'Main', items: filterByRole(navItems.main) },
    { title: 'Procurement', items: filterByRole(navItems.procurement) },
    { title: 'Orders', items: filterByRole(navItems.orders) },
    { title: 'Insights', items: filterByRole(navItems.insights) },
    { title: 'Administration', items: filterByRole(navItems.admin) },
  ].filter(s => s.items.length > 0);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">VB</div>
        <h2>VendorBridge</h2>
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">✕</button>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
              >
                <span className="link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout}>
          <div className="sidebar-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
