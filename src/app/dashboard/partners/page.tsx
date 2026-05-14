import { auth } from '@/lib/auth'
import { getPartners, getCompanyExpenses } from '@/lib/actions/partners'
import { getCashFlows } from '@/lib/actions/cashflow'
import { fetchAnalytics } from '@/lib/actions/analytics'
import PageHeader from '@/components/PageHeader'
import PartnersClient from '@/components/partners/PartnersClient'
import CashFlowSection from '@/components/partners/CashFlowSection'

export const metadata = {
  title: 'Partners & Overhead — Maa Bhavani Transport',
  description: 'Manage equity partners, investments, company overhead and cash flow',
}

export default async function PartnersPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const [partners, expenses, analytics, cashFlows] = await Promise.all([
    getPartners(),
    getCompanyExpenses(100),
    fetchAnalytics({ period: 'all' }),
    getCashFlows(200),
  ])

  const netProfit = analytics.netProfit

  return (
    <div className="page-container">
      <PageHeader
        title="Partners & Overhead"
        subtitle="Equity partners, profit sharing, company expenses and cash flow"
      />
      <PartnersClient
        partners={partners as any}
        expenses={expenses as any}
        netProfit={netProfit}
      />
      <div style={{ marginTop: 20 }}>
        <CashFlowSection flows={JSON.parse(JSON.stringify(cashFlows))} />
      </div>
    </div>
  )
}
