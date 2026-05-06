import { auth } from '@/lib/auth'
import { getPartners, getCompanyExpenses } from '@/lib/actions/partners'
import { fetchAnalytics } from '@/lib/actions/analytics'
import PageHeader from '@/components/PageHeader'
import PartnersClient from '@/components/partners/PartnersClient'

export const metadata = {
  title: 'Partners & Overhead — Hyva Transport',
  description: 'Manage equity partners, investments and company overhead expenses',
}

export default async function PartnersPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const [partners, expenses, analytics] = await Promise.all([
    getPartners(),
    getCompanyExpenses(100),
    fetchAnalytics({ period: 'all' }),
  ])

  // Net profit from analytics (before partner distributions and overhead)
  const netProfit = analytics.netProfit

  return (
    <div className="page-container">
      <PageHeader
        title="🤝 Partners & Overhead"
        subtitle="Equity partners, profit sharing and company expenses"
      />
      <PartnersClient
        partners={partners as any}
        expenses={expenses as any}
        netProfit={netProfit}
      />
    </div>
  )
}
