import { auth } from '@/lib/auth'
import PageHeader from '@/components/PageHeader'
import FortnightlyPnL from '@/components/reports/FortnightlyPnL'

export const metadata = {
  title: 'Reports — Apna Transport',
  description: 'Fortnightly profit & loss reports with expense breakdowns',
}

export default async function ReportsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const now = new Date()

  return (
    <div className="page-container">
      <PageHeader
        title="Analytics & Reports"
        subtitle="Fortnightly P&L — compare profit, expenses, and transactions for each 15-day period"
      />
      <div className="page-body">
        <FortnightlyPnL
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth()}
        />
      </div>
    </div>
  )
}
