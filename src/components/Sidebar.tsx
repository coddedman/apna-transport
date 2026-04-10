'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    section: 'Overview',
    items: [
      { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { href: '/dashboard/owners', icon: '👤', label: 'Vehicle Owners' },
      { href: '/dashboard/vehicles', icon: '🚛', label: 'Vehicles' },
      { href: '/dashboard/projects', icon: '📁', label: 'Projects' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { href: '/dashboard/trips', icon: '🛣️', label: 'Trip Logger' },
      { href: '/dashboard/expenses', icon: '💰', label: 'Expenses' },
    ],
  },
  {
    section: 'Billing',
    items: [
      { href: '/dashboard/settlements', icon: '🧾', label: 'Settlements' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">HT</div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Hyva Transport</span>
          <span className="sidebar-brand-tag">Fleet Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link${pathname === item.href ? ' active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">RS</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Raja Singh</span>
            <span className="sidebar-user-role">Transporter Admin</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
