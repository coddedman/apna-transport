'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useSidebar } from '@/lib/context/SidebarContext'

const navItems = [
  {
    section: 'Overview',
    items: [
      { href: '/dashboard', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" /><path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" /></svg>
      ), label: 'Dashboard', hi: 'डैशबोर्ड' },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { href: '/dashboard/vehicles', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6h12v9H1z" /><path d="M13 9h4l3 3v3h-7z" /><path d="M6 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M20 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
      ), label: 'Vehicles', hi: 'वाहन' },
      { href: '/dashboard/owners', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z" /><path d="M4.5 20a7.5 7.5 0 0115 0" /></svg>
      ), label: 'Vehicle Owners', hi: 'वाहन मालिक' },
      { href: '/dashboard/projects', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
      ), label: 'Projects', hi: 'परियोजनाएँ' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { href: '/dashboard/trips', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v12" /><path d="M6 20a2 2 0 100-.01" /><path d="M18 4a2 2 0 100 .01" /><path d="M18 6v6a4 4 0 01-4 4H8" /></svg>
      ), label: 'Trip Logger', hi: 'यात्रा लॉग' },
      { href: '/dashboard/expenses', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 012-2h13a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M16 12h4" /><path d="M16.5 12a.5 .5 0 100 .01" /></svg>
      ), label: 'Expenses', hi: 'खर्च' },
    ],
  },
  {
    section: 'Team',
    items: [
      { href: '/dashboard/employees', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18v14H3z" /><path d="M8.5 11a2 2 0 100-4 2 2 0 000 4z" /><path d="M5.5 16a3 3 0 016 0" /><path d="M13.5 9h5" /><path d="M13.5 13h4" /></svg>
      ), label: 'Employees', hi: 'कर्मचारी' },
    ],
  },
  {
    section: 'Billing',
    items: [
      { href: '/dashboard/settlements', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6" /><path d="M9 12h6" /></svg>
      ), label: 'Settlements', hi: 'निपटान' },
      { href: '/dashboard/billing', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z" /><path d="M12 10v6" /><path d="M9 13h6" /></svg>
      ), label: 'Bill Generator', hi: 'बिल जनरेटर' },
      { href: '/dashboard/bills', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z" /><path d="M9 10h6" /><path d="M9 14h5" /></svg>
      ), label: 'Bill Tracker', hi: 'बिल ट्रैकर' },
      { href: '/dashboard/reports', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>
      ), label: 'Reports', hi: 'रिपोर्ट' },
      { href: '/dashboard/partners', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11a3 3 0 100-6 3 3 0 000 6z" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 5a3 3 0 010 6" /><path d="M17 14a6 6 0 014 6" /></svg>
      ), label: 'Partners & Overhead', hi: 'साझेदार' },
    ],
  },
]

const allItems = navItems.flatMap(section => section.items)
const workspaceSections = [
  { section: 'Workspace', paths: ['/dashboard', '/dashboard/reports'] },
  { section: 'Operations', paths: ['/dashboard/trips', '/dashboard/expenses'] },
  { section: 'Fleet & Contracts', paths: ['/dashboard/vehicles', '/dashboard/owners', '/dashboard/projects'] },
  { section: 'Finance', paths: ['/dashboard/bills', '/dashboard/settlements', '/dashboard/billing'] },
  { section: 'Organization', paths: ['/dashboard/employees', '/dashboard/partners'] },
].map(section => ({ section: section.section, items: section.paths.map(path => allItems.find(item => item.href === path)!) }))
const labels: Record<string, string> = {
  '/dashboard': 'Overview', '/dashboard/reports': 'Analytics', '/dashboard/vehicles': 'Fleet',
  '/dashboard/bills': 'Client Billing', '/dashboard/settlements': 'Owner Settlements', '/dashboard/billing': 'Owner Statements',
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Transporter Admin',
  FIELD_MANAGER: 'Field Manager',
  OWNER: 'Vehicle Owner',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()
  const { data: session } = useSession()

  const user = session?.user as any
  const userName = user?.name || user?.email?.split('@')[0] || 'User'
  const userRole = roleLabels[user?.role] || 'User'
  const transporterName = user?.transporterName || 'Apna Transport'

  return (
    <aside className={`workspace-sidebar fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-sidebar)] transition-transform duration-300 w-[var(--sidebar-width)] ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      {/* Mobile Close Button */}
      {isOpen && (
        <button className="md:hidden absolute top-3 right-3 text-[var(--color-text-muted)]" onClick={close}>
          ✕
        </button>
      )}

      {/* Brand & Org Switch */}
      <div className="p-[14px_12px] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-[10px] p-[6px]">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-[var(--color-accent)] text-white flex items-center justify-center shrink-0">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6h12v9H1z" /><path d="M13 9h4l3 3v3h-7z" /><path d="M6 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M20 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
          </div>
          <div className="flex flex-col leading-[1.2]">
            <span className="text-[14px] font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">Apna Transport</span>
            <span className="text-[10.5px] text-[var(--color-text-muted)]">Operations OS</span>
          </div>
        </div>

        <div className="flex items-center gap-[9px] mt-[10px] p-[8px_10px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[9px]">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold text-[10px] shrink-0">
            {getInitials(transporterName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-[var(--color-text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">{transporterName}</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">Transporter workspace</div>
          </div>
          <span className="text-[var(--color-text-muted)] flex">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-[8px_12px] overflow-y-auto flex flex-col gap-[1px]">
        {workspaceSections.map((section) => (
          <div key={section.section}>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)] p-[14px_11px_6px]">
              {section.section}
            </div>
            {section.items.map((item) => {
              const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={close}
                  className={`workspace-nav-link flex items-center gap-[11px] p-[8px_11px] rounded-[8px] text-[13.5px] transition-all ${active ? 'font-semibold text-[var(--color-accent)] bg-[var(--color-accent-subtle)]' : 'font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'}`}
                >
                  <span className="flex shrink-0">{item.icon}</span>
                  <span className="flex flex-col leading-[1.15]">
                    <span>{labels[item.href] || item.label}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-normal">{item.hi}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="p-[12px] border-t border-[var(--color-border)]">
        <div className="flex items-center gap-[10px] p-[8px] rounded-[9px] hover:bg-[var(--color-bg-secondary)] transition-colors">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center text-[12px] font-bold shrink-0">
            {getInitials(userName)}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{userName}</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">{userRole}</span>
          </div>
          <span 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors flex shrink-0"
            title="Sign Out"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H5v14h4" /><path d="M15 12H9" /><path d="M12 9l3 3-3 3" /></svg>
          </span>
        </div>
      </div>
    </aside>
  )
}
