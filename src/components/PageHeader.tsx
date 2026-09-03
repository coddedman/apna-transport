'use client'

import { useSidebar } from '@/lib/context/SidebarContext'
interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  const { toggle } = useSidebar()
  const currentDate = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())

  return (
    <header className="min-h-[66px] px-[16px] md:px-[28px] flex items-center justify-between gap-[12px] flex-wrap border-b border-[var(--color-border)] bg-[rgba(245,246,248,0.85)] dark:bg-[rgba(11,17,32,0.85)] backdrop-blur-[10px] sticky top-0 z-40">
      <div className="flex items-center gap-[12px]">
        {/* Mobile Sidebar Toggle */}
        <button className="md:hidden w-[38px] h-[38px] flex items-center justify-center rounded-[9px] border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]" onClick={toggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h1>
          {subtitle && <p className="text-[12.5px] text-[var(--color-text-muted)] mt-[1px]">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-[9px] flex-wrap">
        <div className="hidden sm:flex items-center gap-[7px] p-[8px_13px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[9px] text-[12px] font-semibold text-[var(--color-text-secondary)]">
          <span className="w-[6px] h-[6px] rounded-full bg-[var(--color-success)]"></span>
          {currentDate}
        </div>
        
        {/* Theme Toggle Placeholder */}
        <button className="w-[38px] h-[38px] flex items-center justify-center rounded-[9px] border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors" title="Toggle theme" onClick={() => {
          const root = document.documentElement;
          if (root.getAttribute('data-theme') === 'dark') {
            root.removeAttribute('data-theme');
          } else {
            root.setAttribute('data-theme', 'dark');
          }
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4 12H2" /><path d="M22 12h-2" /><path d="M5 5l1.5 1.5" /><path d="M17.5 17.5L19 19" /><path d="M19 5l-1.5 1.5" /><path d="M6.5 17.5L5 19" /></svg>
        </button>
        
        {children}
      </div>
    </header>
  )
}
