import React from 'react'

export function Table({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <thead className={`bg-[var(--color-bg-secondary)] ${className}`}>
      {children}
    </thead>
  )
}

export function TableRow({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <tr className={`border-b border-[var(--color-border)] hover:bg-[var(--color-accent-subtle)] transition-colors ${className}`}>
      {children}
    </tr>
  )
}

export function TableHeader({ children, align = 'left', className = '' }: { children: React.ReactNode, align?: 'left' | 'right' | 'center', className?: string }) {
  return (
    <th className={`p-[11px_20px] text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)] whitespace-nowrap border-b border-[var(--color-border)] text-${align} ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, align = 'left', tabularNums = false, className = '' }: { children: React.ReactNode, align?: 'left' | 'right' | 'center', tabularNums?: boolean, className?: string }) {
  return (
    <td className={`p-[13px_20px] text-[13px] text-[var(--color-text-secondary)] whitespace-nowrap border-b border-[var(--color-border)] text-${align} ${tabularNums ? 'tabular-nums' : ''} ${className}`}>
      {children}
    </td>
  )
}

export function TableFoot({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <tfoot className={`bg-[var(--color-bg-secondary)] border-t-2 border-[var(--color-border-hover)] ${className}`}>
      {children}
    </tfoot>
  )
}

export function TableFootCell({ children, align = 'left', tabularNums = false, className = '' }: { children: React.ReactNode, align?: 'left' | 'right' | 'center', tabularNums?: boolean, className?: string }) {
  return (
    <td className={`p-[13px_20px] text-[12.5px] font-bold text-[var(--color-text-secondary)] whitespace-nowrap text-${align} ${tabularNums ? 'tabular-nums' : ''} ${className}`}>
      {children}
    </td>
  )
}
