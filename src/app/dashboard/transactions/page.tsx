import { auth } from '@/lib/auth'
import { getTransactions, getTransactionSummary, getTransactionFormData } from '@/lib/actions/transactions'
import PageHeader from '@/components/PageHeader'
import TransactionForm from '@/components/transactions/TransactionForm'
import TransactionTable from '@/components/transactions/TransactionTable'

export const metadata = {
  title: 'Transactions — Apna Transport',
  description: 'Track party payments, owner payouts, and financial transactions',
}

export default async function TransactionsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const [transactions, summary, formData] = await Promise.all([
    getTransactions({}, 200),
    getTransactionSummary(),
    getTransactionFormData(),
  ])

  const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`

  // Serialize dates for client
  const serializedTransactions = transactions.map(t => ({
    ...t,
    date: t.date.toISOString(),
    settlement: t.settlement ? {
      ...t.settlement,
      periodStart: t.settlement.periodStart.toISOString(),
      periodEnd: t.settlement.periodEnd.toISOString(),
    } : null,
    createdAt: undefined,
  }))

  const serializedSettlements = formData.settlements.map(s => ({
    ...s,
    periodStart: s.periodStart.toISOString(),
    periodEnd: s.periodEnd.toISOString(),
  }))

  return (
    <>
      <PageHeader
        title="💳 Transactions"
        subtitle="Track payments received and made — party payments, owner payouts, advances"
      >
        <TransactionForm
          owners={formData.owners}
          projects={formData.projects}
          settlements={serializedSettlements}
        />
      </PageHeader>

      <div className="page-body">
        {/* Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">🏢</div>
            </div>
            <div className="stat-card-value">{fmt(summary.partyReceived)}</div>
            <div className="stat-card-label">Party Payments Received</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">💰</div>
            </div>
            <div className="stat-card-value">{fmt(summary.ownerPaid)}</div>
            <div className="stat-card-label">Owner Payments Made</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">🏦</div>
            </div>
            <div className="stat-card-value">{fmt(summary.advancesGiven)}</div>
            <div className="stat-card-label">Advances Given</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">📊</div>
            </div>
            <div className="stat-card-value" style={{ color: summary.netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {summary.netBalance >= 0 ? '+' : '-'}{fmt(summary.netBalance)}
            </div>
            <div className="stat-card-label">Net Balance</div>
          </div>
        </div>

        {/* Pending/Completed Count */}
        <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{summary.pendingCount} Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{summary.completedCount} Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Total: {summary.totalTransactions} transactions</span>
          </div>
        </div>

        {/* Transaction Table */}
        <TransactionTable transactions={serializedTransactions as any} />
      </div>
    </>
  )
}
