'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const platformNavItems = [
  {
    section: 'Platform',
    items: [
      { href: '/platform', icon: '🏠', label: 'Overview' },
      { href: '/platform/transporters', icon: '🏢', label: 'Transporters' },
      { href: '/platform/onboard', icon: '➕', label: 'Onboard New' },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { href: '/platform/analytics', icon: '📊', label: 'Platform Stats' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { href: '/platform/settings', icon: '⚙️', label: 'Platform Settings' },
    ],
  },
]

export default function PlatformSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar" id="platform-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
        }}>SA</div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Hyva Platform</span>
          <span className="sidebar-brand-tag">Super Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {platformNavItems.map((section) => (
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
          <div className="sidebar-user-avatar" style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          }}>SA</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Super Admin</span>
            <span className="sidebar-user-role">Platform Owner</span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  )
}
