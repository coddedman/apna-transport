import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getVehicles } from '@/lib/actions/vehicles'
import AddExpenseButton from '@/components/AddExpenseButton'
import EditExpenseButton from '@/components/EditExpenseButton'
import { ExpenseType, Prisma } from '@prisma/client'

interface ExpensesPageProps {
  searchParams: Promise<{
    type?: string
    vehicleId?: string
    projectId?: string
    from?: string
    to?: string
  }>
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const params = await searchParams
  const { type, vehicleId, projectId, from, to } = params

  // Build server-side filter
  const where: Prisma.ExpenseWhereInput = {
    vehicle: { owner: { transporterId } },
    ...(type ? { type: type as ExpenseType } : {}),
    ...(vehicleId ? { vehicleId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
        ...(to   ? { lte: new Date(to   + 'T23:59:59') } : {}),
      }
    } : {}),
  }

  const [expensesData, vehicles, projects] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { vehicle: true, project: true },
      orderBy: { date: 'desc' }
    }),
    getVehicles(),
    prisma.project.findMany({ where: { transporterId } })
  ])

  const typeColors: Record<string, string> = {
    FUEL: 'fuel',
    DRIVER_ADVANCE: 'advance',
    OWNER_ADVANCE: 'purple',
    MAINTENANCE: 'maintenance',
    TOLL: 'toll',
    CASH_PAYMENT: 'other',
  }

  // Stats always computed from full unfiltered set for accuracy
  const allExpenses = await prisma.expense.findMany({
    where: { vehicle: { owner: { transporterId } } },
    select: { type: true, amount: true }
  })
  const totalFuel   = allExpenses.filter(e => e.type === 'FUEL').reduce((a, e) => a + e.amount, 0)
  const totalDriver = allExpenses.filter(e => e.type === 'DRIVER_ADVANCE').reduce((a, e) => a + e.amount, 0)
  const totalOwner  = allExpenses.filter(e => e.type === 'OWNER_ADVANCE').reduce((a, e) => a + e.amount, 0)
  const totalAll    = allExpenses.reduce((a, e) => a + e.amount, 0)

  const simpleVehicles = vehicles.map(v => ({ id: v.id, plateNo: v.plateNo }))
  const simpleProjects = projects.map(p => ({ id: p.id, projectName: p.projectName }))

  const hasFilter = type || vehicleId || projectId || from || to

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
          <AddExpenseButton vehicles={simpleVehicles} projects={simpleProjects} />
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card fuel">
            <div className="stat-card-header"><div className="stat-card-icon fuel">⛽</div></div>
            <div className="stat-card-value">₹{totalFuel.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Fuel</div>
          </div>
          <div className="stat-card advance">
            <div className="stat-card-header"><div className="stat-card-icon advance">🧑‍✈️</div></div>
            <div className="stat-card-value">₹{totalDriver.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Driver Advance</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header"><div className="stat-card-icon purple">👤</div></div>
            <div className="stat-card-value">₹{totalOwner.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Owner Advance</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-card-header"><div className="stat-card-icon accent">📊</div></div>
            <div className="stat-card-value">₹{totalAll.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">All Expenses</div>
          </div>
        </div>

        {/* Filter Bar — server-side via GET form */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <form method="GET" action="/dashboard/expenses" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '4px 0' }}>
            <div className="form-group" style={{ minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Category</label>
              <select className="form-select" name="type" style={{ padding: '6px 10px', fontSize: '12px' }} defaultValue={type || ''}>
                <option value="">All Categories</option>
                <option value="FUEL">Fuel</option>
                <option value="DRIVER_ADVANCE">Driver Advance</option>
                <option value="OWNER_ADVANCE">Owner Advance</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TOLL">Toll</option>
                <option value="CASH_PAYMENT">Cash Payment</option>
              </select>
            </div>
            <div className="form-group" style={{ minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Vehicle</label>
              <select className="form-select" name="vehicleId" style={{ padding: '6px 10px', fontSize: '12px' }} defaultValue={vehicleId || ''}>
                <option value="">All Vehicles</option>
                {simpleVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plateNo}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Project</label>
              <select className="form-select" name="projectId" style={{ padding: '6px 10px', fontSize: '12px' }} defaultValue={projectId || ''}>
                <option value="">All Projects</option>
                {simpleProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>From</label>
              <input className="form-input" name="from" type="date" defaultValue={from || ''} style={{ padding: '6px 10px', fontSize: '12px', width: '130px' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>To</label>
              <input className="form-input" name="to" type="date" defaultValue={to || ''} style={{ padding: '6px 10px', fontSize: '12px', width: '130px' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 14px', alignSelf: 'flex-end' }}>
                🔍 Filter
              </button>
              {hasFilter && (
                <a href="/dashboard/expenses" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', alignSelf: 'flex-end', textDecoration: 'none' }}>
                  ✕ Clear
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Expense Log
              {hasFilter && (
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-accent)', marginLeft: '8px' }}>
                  ({expensesData.length} results)
                </span>
              )}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Total: <strong style={{ color: 'var(--color-text-primary)' }}>₹{expensesData.reduce((a, e) => a + e.amount, 0).toLocaleString('en-IN')}</strong>
            </span>
          </div>
          {/* Scrollable table wrapper */}
          <div className="data-table-wrapper" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Date</th>
                  <th>Vehicle No.</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {expensesData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                      No expenses found{hasFilter ? ' for selected filters.' : '.'}
                    </td>
                  </tr>
                ) : (
                  expensesData.map((exp) => (
                    <tr key={exp.id}>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td><strong>{exp.vehicle.plateNo}</strong></td>
                      <td>{exp.project?.projectName || '—'}</td>
                      <td>
                        <span className={`badge ${typeColors[exp.type] || 'other'}`}>
                          {exp.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{exp.remarks || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'center' }}>
                        <EditExpenseButton
                          expense={{
                            id: exp.id,
                            date: new Date(exp.date).toLocaleDateString(),
                            rawDate: new Date(exp.date).toISOString().split('T')[0],
                            vehicleId: exp.vehicleId,
                            vehicle: exp.vehicle.plateNo,
                            projectId: exp.projectId || null,
                            project: exp.project?.projectName || '—',
                            type: exp.type,
                            amount: exp.amount,
                            description: exp.remarks || exp.type,
                          }}
                          vehicles={simpleVehicles}
                          projects={simpleProjects}
                        />
                      </td>
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
