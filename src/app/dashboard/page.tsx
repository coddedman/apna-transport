import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
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

  // 1. Fetch High-Level Database Stats
  const [totalTrips, activeVehicles, tripsAggr] = await Promise.all([
    prisma.trip.count({
      where: { project: { transporterId } }
    }),
    prisma.vehicle.count({
      where: { owner: { transporterId } }
    }),
    prisma.trip.aggregate({
      _sum: { weight: true, totalAmount: true },
      where: { project: { transporterId } }
    })
  ])

  const weightMoved = tripsAggr._sum.weight || 0
  const revenue = tripsAggr._sum.totalAmount || 0

  const stats = [
    { label: 'Total Trips', value: totalTrips.toLocaleString(), trend: '-', trendDir: 'none', icon: '🛣️', color: 'accent' },
    { label: 'Active Vehicles', value: activeVehicles.toLocaleString(), trend: '-', trendDir: 'none', icon: '🚛', color: 'success' },
    { label: 'Weight Moved', value: `${weightMoved.toFixed(1)} MT`, trend: '-', trendDir: 'none', icon: '⚖️', color: 'info' },
    { label: 'Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, trend: '-', trendDir: 'none', icon: '💰', color: 'purple' },
  ]

  // 2. Fetch Recent Trips dynamically
  const recentTripsData = await prisma.trip.findMany({
    where: { project: { transporterId } },
    orderBy: { date: 'desc' },
    take: 5,
    include: {
      vehicle: true,
      project: true
    }
  })

  // 3. Fetch Expenses Breakdown
  const expenses = await prisma.expense.groupBy({
    by: ['type'],
    _sum: { amount: true },
    where: { vehicle: { owner: { transporterId } } }
  })
  
  const totalExpense = expenses.reduce((acc, curr) => acc + (curr._sum.amount || 0), 0)
  const expenseColors: Record<string, string> = {
    FUEL: 'var(--color-accent)',
    DRIVER_ADVANCE: 'var(--color-info)',
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

  // 4. Fully Dynamic Weekly Chart logic from DB (Trailing 7 days)
  const today = new Date()
  const weeklyTrips = await prisma.trip.findMany({
    where: { 
      project: { transporterId },
      date: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    },
    select: { date: true, weight: true }
  })

  // Build the trailing 7 days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const chartMap = new Map()
  let maxWeightPerDay = 1 // Prevent divide by zero

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    chartMap.set(d.toDateString(), 0)
  }

  weeklyTrips.forEach(t => {
    const dateStr = new Date(t.date).toDateString()
    if (chartMap.has(dateStr)) {
      const current = chartMap.get(dateStr)
      chartMap.set(dateStr, current + t.weight)
      if (current + t.weight > maxWeightPerDay) {
        maxWeightPerDay = current + t.weight
      }
    }
  })

  const chartData = Array.from(chartMap.entries()).map(([dateStr, weight]) => {
    const dayLabel = days[new Date(dateStr).getDay()]
    const height = Math.max((weight / maxWeightPerDay) * 100, 5) // At least 5% so the bar isn't invisible if 0
    return {
      label: dayLabel,
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

        {/* Charts + Expense Breakdown */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Weekly Trip Volume (Demo View)</span>
              <button className="btn btn-secondary btn-sm">This Week</button>
            </div>
            <div className="card-body">
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {chartData.map((bar) => (
                    <div
                      key={bar.label}
                      className="chart-bar"
                      style={{
                        height: `${bar.height}%`,
                        background: bar.color,
                      }}
                    />
                  ))}
                </div>
                <div className="chart-labels">
                  {chartData.map((bar) => (
                    <span key={bar.label} className="chart-label">
                      {bar.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Expense Breakdown</span>
              <button className="btn btn-secondary btn-sm">All Time</button>
            </div>
            <div className="card-body">
              {expenseBreakdown.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                  No expenses recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {expenseBreakdown.map((item) => (
                    <div key={item.type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.type}</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.amount}</span>
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

        {/* Recent Trips + Activity */}
        <div className="grid-2">
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
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTripsData.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
                        No trips found. Add some trips in the module!
                      </td>
                    </tr>
                  ) : (
                    recentTripsData.map((trip) => (
                      <tr key={trip.id}>
                        <td><strong>{trip.vehicle.plateNo}</strong></td>
                        <td>{trip.project.projectName}</td>
                        <td>{trip.weight} MT</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>₹{trip.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Activity</span>
            </div>
            <div className="card-body">
              <div className="activity-list">
                {activities.map((act, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-dot ${act.color}`} />
                    <div>
                      <p className="activity-text" dangerouslySetInnerHTML={{ __html: act.text }} />
                      <p className="activity-time">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
