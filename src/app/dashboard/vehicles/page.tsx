import { getVehicles } from '@/lib/actions/vehicles'

export default async function VehiclesPage() {
  const vehicles = await getVehicles()

  const activeCount = vehicles.length // Or some other logic
  const upcomingRenewals = 0 // In real system, query by renewal date
  
  const stats = [
    { label: 'Total Vehicles', value: vehicles.length.toLocaleString(), icon: '🚛', color: 'accent' },
    { label: 'Active Fleet', value: activeCount.toLocaleString(), icon: '✅', color: 'success' },
    { label: 'Total Trips Logged', value: vehicles.reduce((acc, v) => acc + v.trips.length, 0).toLocaleString(), icon: '🛣️', color: 'info' },
    { label: 'Upcoming Renewals', value: upcomingRenewals.toString(), icon: '⚠️', color: 'purple' },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Vehicles</h1>
            <p className="page-subtitle">Fleet registry with operational tracking</p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">+ Register Vehicle</button>
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className={`stat-card ${stat.color}`}>
              <div className="stat-card-header">
                <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Vehicles</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm">Filter by Owner</button>
              <button className="btn btn-secondary btn-sm">🔍 Search</button>
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle No.</th>
                  <th>Owner</th>
                  <th>Total Trips</th>
                  <th>Last Trip</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      No vehicles found. Start by registering one.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.plateNo}</strong></td>
                      <td>{v.owner.ownerName}</td>
                      <td>{v.trips.length}</td>
                      <td>{v.trips.length > 0 ? 'Recent' : 'N/A'}</td>
                      <td>
                        <span className="badge active">● Active</span>
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
