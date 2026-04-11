import { getVehicles } from '@/lib/actions/vehicles'
import { getOwners } from '@/lib/actions/owners'
import { getProjects } from '@/lib/actions/projects'
import AddVehicleButton from '@/components/AddVehicleButton'
import VehicleAnalyticsButton from '@/components/analytics/VehicleAnalyticsButton'

export default async function VehiclesPage() {
  const [vehicles, owners, projects] = await Promise.all([
    getVehicles(),
    getOwners(),
    getProjects()
  ])

  const activeCount = vehicles.length // Or some other logic
  const upcomingRenewals = 0 // In real system, query by renewal date
  
  const stats = [
    { label: 'Total Vehicles', value: vehicles.length.toLocaleString(), icon: '🚛', color: 'accent' },
    { label: 'Active Fleet', value: activeCount.toLocaleString(), icon: '✅', color: 'success' },
    { label: 'Total Trips Logged', value: vehicles.reduce((acc, v) => acc + v.trips.length, 0).toLocaleString(), icon: '🛣️', color: 'info' },
    { label: 'Upcoming Renewals', value: upcomingRenewals.toString(), icon: '⚠️', color: 'purple' },
  ]

  const simpleOwners = owners.map(o => ({ id: o.id, ownerName: o.ownerName }))
  const simpleProjects = projects.map(p => ({ id: p.id, projectName: p.projectName }))

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
          <AddVehicleButton owners={simpleOwners} projects={simpleProjects} />
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
                  <th>Assigned Project</th>
                  <th>Total Trips</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      No vehicles found. Start by registering one.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.plateNo}</strong></td>
                      <td>{v.owner.ownerName}</td>
                      <td>
                        {v.project ? (
                          <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{v.project.projectName}</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Not Assigned</span>
                        )}
                      </td>
                      <td>{v.trips.length}</td>
                      <td>
                        <span className="badge active">● Active</span>
                      </td>
                      <td>
                        <VehicleAnalyticsButton vehicle={{
                          plateNo: v.plateNo,
                          trips: (v.trips || []).map((t: any) => ({
                            projectId: t.projectId,
                            project: t.project ? { projectName: t.project.projectName } : null,
                            totalAmount: t.totalAmount
                          })),
                          expenses: (v.expenses || []).map((e: any) => ({
                            projectId: e.projectId,
                            project: e.project ? { projectName: e.project.projectName } : null,
                            amount: e.amount
                          }))
                        }} />
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
