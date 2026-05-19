import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getVehicles } from '@/lib/actions/vehicles'
import AddExpenseButton from '@/components/AddExpenseButton'
import EditExpenseButton from '@/components/EditExpenseButton'
import ExportCSVButton from '@/components/ExportCSVButton'
import PageHeader from '@/components/PageHeader'
import ExpenseFilterBar from '@/components/ExpenseFilterBar'
import { ExpenseType, Prisma } from '@prisma/client'

export const metadata = {
  title: 'Expenses — Hyva Transport',
  description: 'Log and track operational costs across your fleet',
}

interface ExpensesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const params = await searchParams
  const toArr = (v: string | string[] | undefined) => v ? (Array.isArray(v) ? v : [v]) : []
  const vehicleIds = toArr(params['vehicleId'])
  const projectIds = toArr(params['projectId'])
  const types = toArr(params['type'])
  const from = Array.isArray(params['from']) ? params['from'][0] : params['from']
  const to = Array.isArray(params['to']) ? params['to'][0] : params['to']

  // Build server-side filter (multi-select via IN clause)
  const where: Prisma.ExpenseWhereInput = {
    vehicle: { owner: { transporterId } },
    ...(types.length > 0 ? { type: { in: types as ExpenseType[] } } : {}),
    ...(vehicleIds.length > 0 ? { vehicleId: { in: vehicleIds } } : {}),
    ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
        ...(to   ? { lte: new Date(to   + 'T23:59:59') } : {}),
      }
    } : {}),
  }

  const [expensesData, vehicles, projects, statsAgg] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { vehicle: true, project: true },
      orderBy: { date: 'desc' },
      take: 300,
    }),
    getVehicles(),
    prisma.project.findMany({ where: { transporterId } }),
    // Single groupBy replaces the second full-table findMany
    prisma.expense.groupBy({
      by: ['type'],
      where: { vehicle: { owner: { transporterId } } },
      _sum: { amount: true },
    }),
  ])

  const typeColors: Record<string, string> = {
    FUEL: 'fuel',
    DRIVER_ADVANCE: 'advance',
    OWNER_ADVANCE: 'purple',
    MAINTENANCE: 'maintenance',
    TOLL: 'toll',
    CASH_PAYMENT: 'other',
  }

  const typeIcons: Record<string, string> = {
    FUEL: '⛽',
    DRIVER_ADVANCE: '🧑‍✈️',
    OWNER_ADVANCE: '👤',
    MAINTENANCE: '🔧',
    TOLL: '🛤️',
    CASH_PAYMENT: '💵',
  }

  // Derive stats from the groupBy result — no second round-trip
  const statMap = Object.fromEntries(statsAgg.map(s => [s.type, s._sum.amount || 0]))
  const totalFuel   = statMap['FUEL'] || 0
  const totalDriver = statMap['DRIVER_ADVANCE'] || 0
  const totalOwner  = statMap['OWNER_ADVANCE'] || 0
  const totalAll    = statsAgg.reduce((a, s) => a + (s._sum.amount || 0), 0)

  const simpleVehicles = vehicles.map(v => ({ id: v.id, plateNo: v.plateNo }))
  const simpleProjects = projects.map(p => ({ id: p.id, projectName: p.projectName }))

  const hasFilter = vehicleIds.length > 0 || projectIds.length > 0 || types.length > 0 || from || to

  const csvData = expensesData.map(e => ({
    date: new Date(e.date).toLocaleDateString('en-IN'),
    vehicle: e.vehicle.plateNo,
    type: e.type.replace(/_/g, ' '),
    project: e.project?.projectName || '—',
    amount: e.amount,
    remarks: e.remarks || '',
  }))

  const csvColumns = [
    { key: 'date', label: 'Date' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'type', label: 'Category' },
    { key: 'project', label: 'Project' },
    { key: 'amount', label: 'Amount (₹)' },
    { key: 'remarks', label: 'Remarks' },
  ]

  return (
    <>
      <PageHeader 
        title="Expenses" 
        subtitle="Log and track operational costs"
      >
        <AddExpenseButton vehicles={simpleVehicles} projects={simpleProjects} />
      </PageHeader>

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

        {/* Multi-select Filter Bar */}
        <ExpenseFilterBar vehicles={simpleVehicles} projects={simpleProjects} />

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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Total: <strong style={{ color: 'var(--color-text-primary)' }}>₹{expensesData.reduce((a, e) => a + e.amount, 0).toLocaleString('en-IN')}</strong>
              </span>
              <ExportCSVButton data={csvData} filename="expenses_export" columns={csvColumns} />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="desktop-only-table">
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

          {/* Mobile card view */}
          <div className="mobile-only-cards">
            {expensesData.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 20px' }}>
                No expenses found{hasFilter ? ' for selected filters.' : '.'}
              </div>
            ) : (
              <div className="mobile-card-list">
                {expensesData.map((exp) => (
                  <div key={exp.id} className="mobile-record-card">
                    <div className="mobile-card-header">
                      <div className="mobile-card-title">
                        <span>{typeIcons[exp.type] || '💰'}</span>
                        <span className="vehicle-plate">{exp.vehicle.plateNo}</span>
                      </div>
                      <span className="mobile-card-date">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Category</span>
                        <span className="mobile-card-field-value">
                          <span className={`badge ${typeColors[exp.type] || 'other'}`}>
                            {exp.type.replace(/_/g, ' ')}
                          </span>
                        </span>
                      </div>
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Amount</span>
                        <span className="mobile-card-field-value highlight" style={{ fontSize: '15px' }}>₹{exp.amount.toLocaleString('en-IN')}</span>
                      </div>
                      {exp.project && (
                        <div className="mobile-card-field">
                          <span className="mobile-card-field-label">Project</span>
                          <span className="mobile-card-field-value">{exp.project.projectName}</span>
                        </div>
                      )}
                      {exp.remarks && (
                        <div className="mobile-card-field">
                          <span className="mobile-card-field-label">Remarks</span>
                          <span className="mobile-card-field-value">{exp.remarks}</span>
                        </div>
                      )}
                    </div>
                    <div className="mobile-card-footer">
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
