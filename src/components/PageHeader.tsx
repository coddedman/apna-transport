'use client'

import { useSidebar } from '@/lib/context/SidebarContext'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  const { toggle } = useSidebar()

  return (
    <header className="page-header">
      <div className="page-header-left">
        <button className="mobile-menu-btn" onClick={toggle} style={{ marginRight: '12px' }}>
          ☰
        </button>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="page-header-right">
        {children}
      </div>
    </header>
  )
}
