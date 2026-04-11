import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Prisma } from '@prisma/client'

interface DashboardPageProps {
  searchParams: Promise<{
    projectId?: string
    from?: string
    to?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  const user = session?.user as any
  const transporterId = user?.transporterId

  // Security guard for platform owners who strayed here
  if (!transporterId) {
    return (
      <div className="page-body">
        <div className="card">
          <div className="card-body">
            You do not have a Transporter ID assigned. If you are a Super Admin, please go to the <Link href="/platform" style={{color: 'var(--color-accent)'}}>Platform Dashboard</Link>.
          </div>
        </div>
      </div>
    )
  }

  const params = await searchParams
  const { projectId, from, to } = params

  const tripWhere: Prisma.TripWhereInput = {
    project: { transporterId },
    ...(projectId ? { projectId } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
        ...(to   ? { lte: new Date(to   + 'T23:59:59') } : {}),
      }
    } : {}),
  }

  const expenseWhere: Prisma.ExpenseWhereInput = {
    vehicle: { owner: { transporterId } },
    ...(projectId ? { projectId } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
        ...(to   ? { lte: new Date(to   + 'T23:59:59') } : {}),
      }
    } : {}),
  }

  // 1. Fetch High-Level Database Stats & Filters
  const [totalTrips, tripsAggr, activeVehiclesGroup, projects, recentTripsData, expenses, chartTrips] = await Promise.all([
    prisma.trip.count({ where: tripWhere }),
    prisma.trip.aggregate({
      _sum: { weight: true, totalAmount: true },
      where: tripWhere
    }),
    prisma.trip.groupBy({
      by: ['vehicleId'],
      where: tripWhere
    }),
    prisma.project.findMany({ where: { transporterId }, select: { id: true, projectName: true } }),
    prisma.trip.findMany({
      where: tripWhere,
      orderBy: { date: 'desc' },
      take: 5,
      include: { vehicle: true, project: true }
    }),
    prisma.expense.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: expenseWhere
    }),
    // If filter is active, fetch all matches for chart, else fetch last 7 days
    prisma.trip.findMany({
      where: (from || to) ? tripWhere : {
        ...tripWhere,
        date: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { date: true, weight: true },
      orderBy: { date: 'asc' }
    })
  ])

  const weightMoved = tripsAggr._sum.weight || 0
  const revenue = tripsAggr._sum.totalAmount || 0
  const activeVehiclesCount = activeVehiclesGroup.length

  const stats = [
    { label: 'Total Trips', value: totalTrips.toLocaleString(), trend: '-', trendDir: 'none', icon: '🛣️', color: 'accent' },
    { label: 'Active Vehicles', value: activeVehiclesCount.toLocaleString(), trend: '-', trendDir: 'none', icon: '🚛', color: 'success' },
    { label: 'Weight Moved', value: `${weightMoved.toFixed(1)} MT`, trend: '-', trendDir: 'none', icon: '⚖️', color: 'info' },
    { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, trend: '-', trendDir: 'none', icon: '💰', color: 'purple' },
  ]

  // 3. Process Expenses Breakdown
  const totalExpense = expenses.reduce((acc, curr) => acc + (curr._sum.amount || 0), 0)
  const expenseColors: Record<string, string> = {
    FUEL: 'var(--color-accent)',
    DRIVER_ADVANCE: 'var(--color-info)',
    OWNER_ADVANCE: 'var(--color-primary)', // Add a distinct color
    MAINTENANCE: 'var(--color-purple)',
    TOLL: 'var(--color-success)',
    CASH_PAYMENT: 'var(--color-warning)'
  }

  const expenseBreakdown = expenses.map(e => ({
    type: e.type.replace('_', ' '),
    amount: `₹${(e._sum.amount || 0).toLocaleString('en-IN')}`,
    pct: totalExpense > 0 ? Math.round(((e._sum.amount || 0) / totalExpense) * 100) : 0,
    color: expenseColors[e.type] || 'var(--color-accent)'
  })).sort((a, b) => b.pct - a.pct)

  // Compute Net Profit
  const netProfit = revenue - totalExpense
  const profitMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0

  // 4. Fully Dynamic Chart logic from DB
  const chartMap = new Map()
  let maxWeightPerDay = 1 // Prevent divide by zero

  // If no date range filter, prefill map with last 7 days to ensure flat line shows
  if (!from && !to) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000)
      chartMap.set(d.toDateString(), 0)
    }
  }

  chartTrips.forEach(t => {
    const dateStr = new Date(t.date).toDateString()
    const current = chartMap.get(dateStr) || 0
    chartMap.set(dateStr, current + t.weight)
    if (current + t.weight > maxWeightPerDay) {
      maxWeightPerDay = current + t.weight
    }
  })

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const chartData = Array.from(chartMap.entries()).map(([dateStr, weight]) => {
    const dayLabel = days[new Date(dateStr).getDay()]
    const displayLabel = (from || to) ? `${new Date(dateStr).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}` : dayLabel
    const height = Math.max((weight as number / maxWeightPerDay) * 100, 5) // At least 5% so the bar isn't invisible if 0
    return {
      label: displayLabel,
      height: weight === 0 ? 0 : height, 
      color: weight === 0 ? 'rgba(255,255,255,0.05)' : 'var(--color-accent)'
    }
  })

  // Dynamic Recent Activity format mapping latest DB entries
  const activities = recentTripsData.slice(0, 5).map(t => ({
    color: 'accent',
    text: `<strong>${t.vehicle.plateNo}</strong> completed trip from ${t.project.projectName}`,
    time: new Date(t.date).toLocaleDateString()
  }))

  if (activities.length === 0) {
    activities.push({ color: 'success', text: 'System initialized and connected to database.', time: 'Just now' })
  }

  const hasFilter = projectId || from || to

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.email}</p>
          </div>
        </div>
        <div className="page-header-right">
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            📅 {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </header>

      <div className="page-body">
        
        {/* Filter Bar */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <form method="GET" action="/dashboard" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '4px 0' }}>
            <div className="form-group" style={{ minWidth: '160px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Project</label>
              <select className="form-select" name="projectId" style={{ padding: '6px 10px', fontSize: '12px' }} defaultValue={projectId || ''}>
                <option value="">All Projects</option>
                {projects.map(p => (
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
                🔍 Apply Filter
              </button>
              {hasFilter && (
                <a href="/dashboard" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', alignSelf: 'flex-end', textDecoration: 'none' }}>
                  ✕ Clear
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className={`stat-card ${stat.color}`}>
              <div className="stat-card-header">
                <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
                <span className={`stat-card-trend ${stat.trendDir}`}>{stat.trend}</span>
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Financial Overview (Net Profit) & Expense Breakdown */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>
          
           {/* Financial Health / Net Profit Summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Financial Health</span>
              {hasFilter && <span className="badge accent">Filtered Data</span>}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Gross Revenue</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-purple)' }}>₹{revenue.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Expenses</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-danger)' }}>₹{totalExpense.toLocaleString('en-IN')}</div>
                  </div>
               </div>
               <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                     <div>
                       <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Net Operational Profit</div>
                       <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-success)' }}>
                         ₹{netProfit.toLocaleString('en-IN')}
                       </div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <div className="badge success" style={{ fontSize: '14px', padding: '6px 12px' }}>
                          {profitMargin}% Margin
                       </div>
                     </div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                     <div style={{ width: `${profitMargin}%`, height: '100%', background: 'var(--color-success)', transition: 'width 0.6s ease' }} />
                  </div>
               </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Expense Breakdown</span>
              <Link href="/dashboard/expenses" className="btn btn-secondary btn-sm">Manage Expenses</Link>
            </div>
            <div className="card-body">
              {expenseBreakdown.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                  No expenses recorded{hasFilter ? ' for this filter' : ' yet'}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {expenseBreakdown.map((item) => (
                    <div key={item.type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.type}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                           <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>({item.pct}%)</span>
                           <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.amount}</span>
                        </div>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '100px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Charts + Recent Trips */}
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Trip Activity Timeline</span>
            </div>
            <div className="card-body">
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {chartData.map((bar, i) => (
                    <div
                      key={i}
                      className="chart-bar"
                      style={{
                        height: `${bar.height}%`,
                        background: bar.color,
                        width: '100%',
                        maxWidth: '40px'
                      }}
                    />
                  ))}
                </div>
                <div className="chart-labels">
                  {chartData.map((bar, i) => (
                    <span key={i} className="chart-label" style={{ fontSize: chartData.length > 7 ? '9px' : '11px' }}>
                      {bar.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Trips</span>
              <Link href="/dashboard/trips" className="btn btn-secondary btn-sm">View All →</Link>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Project</th>
                    <th>Weight</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTripsData.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
                        No trips found{hasFilter ? ' for this filter' : ''}. Add some trips in the module!
                      </td>
                    </tr>
                  ) : (
                    recentTripsData.map((trip) => (
                      <tr key={trip.id}>
                        <td><strong>{trip.vehicle.plateNo}</strong></td>
                        <td>{trip.project.projectName}</td>
                        <td>{trip.weight} MT</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 600, textAlign: 'right' }}>₹{trip.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
