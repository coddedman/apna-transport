import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPartners, getCompanyExpenses } from '@/lib/actions/partners'
import { getCashFlows } from '@/lib/actions/cashflow'
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

  const [partners, expenses, cashFlows, tripTotals] = await Promise.all([
    getPartners(),
    getCompanyExpenses(100),
    getCashFlows(200),
    // Single aggregate replaces the 25-query fetchAnalytics call
    prisma.trip.aggregate({
      where: { project: { transporterId } },
      _sum: { ownerFreightAmount: true, partyFreightAmount: true },
    }),
  ])

  // ownerFreightAmount = company revenue, partyFreightAmount = owner payout
  const netProfit =
    (tripTotals._sum.ownerFreightAmount || 0) -
    (tripTotals._sum.partyFreightAmount || 0)

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
