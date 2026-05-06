'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useLoading } from '@/lib/context/LoadingContext'

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
      { href: '/dashboard/billing', icon: '📋', label: 'Bill Generator' },
    ],
  },
]

import { useSidebar } from '@/lib/context/SidebarContext'

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Transporter Admin',
  FIELD_MANAGER: 'Field Manager',
  OWNER: 'Vehicle Owner',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { setLoading } = useLoading()
  const { isOpen, close } = useSidebar()
  const { data: session } = useSession()

  const user = session?.user as any
  const userName = user?.name || user?.email?.split('@')[0] || 'User'
  const userRole = roleLabels[user?.role] || 'User'
  const transporterName = user?.transporterName || 'Hyva Transport'

  const handleSignOut = () => {
    setLoading(true)
    signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`} id="sidebar">
      {/* Mobile Close */}
      <button className="mobile-menu-btn" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 60 }} onClick={close}>
        ✕
      </button>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">{getInitials(transporterName)}</div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">{transporterName}</span>
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
          <div className="sidebar-user-avatar">{getInitials(userName)}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-role">{userRole}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  )
}
