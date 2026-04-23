'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/lib/context/SidebarContext'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Home' },
  { href: '/dashboard/trips', icon: '🛣️', label: 'Trips' },
  { href: '/dashboard/expenses', icon: '💰', label: 'Expenses' },
  { href: '/dashboard/vehicles', icon: '🚛', label: 'Vehicles' },
  { href: '/dashboard/settlements', icon: '🧾', label: 'Billing' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { toggle } = useSidebar()

  return (
    <nav className="mobile-bottom-nav" id="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item${pathname === item.href ? ' active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
