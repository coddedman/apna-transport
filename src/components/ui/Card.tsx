import React from 'react'

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-[2px] hover:border-[var(--color-border-hover)] ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, rightContent, className = '' }: { title: string, subtitle?: string, rightContent?: React.ReactNode, className?: string }) {
  return (
    <div className={`p-[15px_20px] border-b border-[var(--color-border)] flex items-center justify-between gap-[8px] flex-wrap ${className}`}>
      <div className="flex flex-col">
        <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">{title}</span>
        {subtitle && <span className="text-[11.5px] text-[var(--color-text-muted)] mt-[1px]">{subtitle}</span>}
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-[20px] ${className}`}>
      {children}
    </div>
  )
}
