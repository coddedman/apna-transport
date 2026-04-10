export default function DashboardPage() {
  // Demo data for the dashboard
  const stats = [
    { label: 'Total Trips', value: '1,284', trend: '+12%', trendDir: 'up', icon: '🛣️', color: 'accent' },
    { label: 'Active Vehicles', value: '47', trend: '+3', trendDir: 'up', icon: '🚛', color: 'success' },
    { label: 'Weight Moved', value: '8,420 T', trend: '+8%', trendDir: 'up', icon: '⚖️', color: 'info' },
    { label: 'Revenue', value: '₹24.8L', trend: '+15%', trendDir: 'up', icon: '💰', color: 'purple' },
  ]

  const recentTrips = [
    { id: 1, vehicle: 'HR-55-AB-1234', project: 'Manesar Bypass', weight: '22.5 T', amount: '₹11,250', date: 'Today, 10:30 AM' },
    { id: 2, vehicle: 'HR-55-CD-5678', project: 'Gurugram Metro', weight: '18.0 T', amount: '₹9,000', date: 'Today, 9:15 AM' },
    { id: 3, vehicle: 'DL-01-EF-9012', project: 'Dwarka Expressway', weight: '25.0 T', amount: '₹15,000', date: 'Yesterday, 4:45 PM' },
    { id: 4, vehicle: 'HR-55-GH-3456', project: 'Manesar Bypass', weight: '20.0 T', amount: '₹10,000', date: 'Yesterday, 2:30 PM' },
    { id: 5, vehicle: 'DL-01-IJ-7890', project: 'Kundli-Sonipat', weight: '24.0 T', amount: '₹12,000', date: 'Yesterday, 11:00 AM' },
  ]

  const chartData = [
    { label: 'Mon', height: 65, color: 'var(--color-accent)' },
    { label: 'Tue', height: 85, color: 'var(--color-accent)' },
    { label: 'Wed', height: 50, color: 'var(--color-accent)' },
    { label: 'Thu', height: 95, color: 'var(--color-accent)' },
    { label: 'Fri', height: 70, color: 'var(--color-accent)' },
    { label: 'Sat', height: 40, color: 'var(--color-accent)' },
    { label: 'Sun', height: 20, color: 'rgba(245,158,11,0.3)' },
  ]

  const activities = [
    { color: 'accent', text: '<strong>HR-55-AB-1234</strong> completed trip from Manesar Bypass', time: '10 min ago' },
    { color: 'success', text: 'New vehicle <strong>DL-01-KL-2345</strong> onboarded', time: '1 hr ago' },
    { color: 'info', text: 'Fuel expense of <strong>₹4,500</strong> logged for HR-55-CD-5678', time: '2 hrs ago' },
    { color: 'purple', text: 'Settlement generated for owner <strong>Ramesh Kumar</strong>', time: '3 hrs ago' },
    { color: 'accent', text: '<strong>DL-01-EF-9012</strong> completed trip from Dwarka Expressway', time: '5 hrs ago' },
  ]

  const expenseBreakdown = [
    { type: 'Fuel', amount: '₹3,45,000', pct: 55, color: 'var(--color-accent)' },
    { type: 'Driver Advance', amount: '₹1,20,000', pct: 19, color: 'var(--color-info)' },
    { type: 'Maintenance', amount: '₹95,000', pct: 15, color: 'var(--color-purple)' },
    { type: 'Toll', amount: '₹68,000', pct: 11, color: 'var(--color-success)' },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, Raja Singh</p>
          </div>
        </div>
        <div className="page-header-right">
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            📅 April 10, 2026
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

        {/* Charts + Activity */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>
          {/* Weekly Trip Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Weekly Trip Volume</span>
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

          {/* Expense Breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Expense Breakdown</span>
              <button className="btn btn-secondary btn-sm">This Month</button>
            </div>
            <div className="card-body">
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
            </div>
          </div>
        </div>

        {/* Recent Trips + Activity */}
        <div className="grid-2">
          {/* Recent Trips Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Trips</span>
              <a href="/dashboard/trips" className="btn btn-secondary btn-sm">View All →</a>
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
                  {recentTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td><strong>{trip.vehicle}</strong></td>
                      <td>{trip.project}</td>
                      <td>{trip.weight}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{trip.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
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
