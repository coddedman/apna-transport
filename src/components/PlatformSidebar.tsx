'use client'

import { useSidebar } from '@/lib/context/SidebarContext'
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

]

export default function PlatformSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()

  return (
    <aside className={`sidebar workspace-sidebar ${isOpen ? 'open' : ''}`} id="platform-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
        }}>SA</div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Apna Platform</span>
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
                onClick={close}
                aria-current={pathname === item.href ? 'page' : undefined}
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
