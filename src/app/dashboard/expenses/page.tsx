import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getVehicles } from '@/lib/actions/vehicles'
import AddExpenseButton from '@/components/AddExpenseButton'

export default async function ExpensesPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const [expensesData, vehicles, projects] = await Promise.all([
    prisma.expense.findMany({
      where: { vehicle: { owner: { transporterId } } },
      include: {
        vehicle: true,
        project: true
      },
      orderBy: { date: 'desc' }
    }),
    getVehicles(),
    prisma.project.findMany({ where: { transporterId } })
  ])

  const expenses = expensesData.map(e => ({
    id: e.id,
    date: new Date(e.date).toLocaleDateString(),
    vehicle: e.vehicle.plateNo,
    project: e.project?.projectName || '—',
    type: e.type,
    amount: e.amount,
    description: e.remarks || e.type,
  }))

  const typeColors: Record<string, string> = {
    FUEL: 'fuel',
    DRIVER_ADVANCE: 'advance',
    OWNER_ADVANCE: 'purple',
    MAINTENANCE: 'maintenance',
    TOLL: 'toll',
    CASH_PAYMENT: 'other',
  }

  const totalExpense = expenses.reduce((a, e) => a + e.amount, 0)

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Expenses</h1>
            <p className="page-subtitle">Log and track operational costs</p>
          </div>
        </div>
        <div className="page-header-right">
          <AddExpenseButton vehicles={vehicles} projects={projects} />
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card fuel">
            <div className="stat-card-header">
              <div className="stat-card-icon fuel">⛽</div>
            </div>
            <div className="stat-card-value">
              ₹{expenses.filter(e => e.type === 'FUEL').reduce((a, e) => a + e.amount, 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-card-label">Total Fuel</div>
          </div>
          <div className="stat-card advance">
            <div className="stat-card-header">
              <div className="stat-card-icon advance">🧑‍✈️</div>
            </div>
            <div className="stat-card-value">
              ₹{expenses.filter(e => e.type === 'DRIVER_ADVANCE').reduce((a, e) => a + e.amount, 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-card-label">Driver Advance</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">👤</div>
            </div>
            <div className="stat-card-value">
              ₹{expenses.filter(e => e.type === 'OWNER_ADVANCE').reduce((a, e) => a + e.amount, 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-card-label">Owner Advance</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">📊</div>
            </div>
            <div className="stat-card-value">₹{totalExpense.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">All Expenses</div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Expense Log</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm">Filter</button>
              <button className="btn btn-secondary btn-sm">📥 Export</button>
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle No.</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                      No expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{exp.date}</td>
                      <td><strong>{exp.vehicle}</strong></td>
                      <td>{exp.project}</td>
                      <td>
                        <span className={`badge ${typeColors[exp.type] || 'other'}`}>
                          {exp.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{exp.description}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
