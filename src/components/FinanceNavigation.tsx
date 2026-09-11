'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard/bills', label: 'Client Billing', description: 'Invoices & collections' },
  { href: '/dashboard/settlements', label: 'Owner Settlements', description: 'Reconcile & pay' },
  { href: '/dashboard/billing', label: 'Owner Statements', description: 'Prepare statements' },
]

export default function FinanceNavigation() {
  const pathname = usePathname()
  if (!tabs.some(tab => tab.href === pathname)) return null
  return (
    <nav className="finance-navigation" aria-label="Finance">
      <span className="finance-label">Finance</span>
      {tabs.map(tab => <Link key={tab.href} href={tab.href} title={tab.description} aria-current={pathname === tab.href ? 'page' : undefined}>{tab.label}</Link>)}
    </nav>
  )
}
