import { getVehicles } from '@/lib/actions/vehicles'
import { getOwners } from '@/lib/actions/owners'
import { getProjects } from '@/lib/actions/projects'
import AddVehicleButton from '@/components/AddVehicleButton'
import EditVehicleButton from '@/components/EditVehicleButton'
import DeleteVehicleButton from '@/components/DeleteVehicleButton'
import VehicleAnalyticsButton from '@/components/analytics/VehicleAnalyticsButton'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Vehicles — Hyva Transport',
  description: 'Fleet registry with operational tracking',
}

export default async function VehiclesPage() {
  const [vehicles, owners, projects] = await Promise.all([
    getVehicles(),
    getOwners(),
    getProjects()
  ])

  const activeCount = vehicles.length
  const totalExpenses = vehicles.reduce((acc, v) => acc + (v.expenses?.length || 0), 0)
  
  const stats = [
    { label: 'Total Vehicles', value: vehicles.length.toLocaleString(), icon: '🚛', color: 'accent' },
    { label: 'Active Fleet', value: activeCount.toLocaleString(), icon: '✅', color: 'success' },
    { label: 'Total Trips Logged', value: vehicles.reduce((acc, v) => acc + v.trips.length, 0).toLocaleString(), icon: '🛣️', color: 'info' },
    { label: 'Total Owners', value: owners.length.toLocaleString(), icon: '👤', color: 'purple' },
  ]

  const simpleOwners = owners.map(o => ({ id: o.id, ownerName: o.ownerName }))
  const simpleProjects = projects.map(p => ({ id: p.id, projectName: p.projectName }))

  return (
    <>
      <PageHeader title="Vehicles" subtitle="Fleet registry with operational tracking">
        <AddVehicleButton owners={simpleOwners} projects={simpleProjects} />
      </PageHeader>

      <div className="page-body">
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

        <div className="card">
          <div className="card-header">
            <span className="card-title">All Vehicles</span>
          </div>

          {/* Desktop table */}
          <div className="desktop-only-table">
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
                        <td><span className="badge active">● Active</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <VehicleAnalyticsButton vehicle={{
                              plateNo: v.plateNo,
                              trips: (v.trips || []).map((t: any) => ({
                                projectId: t.projectId,
                                project: t.project ? { projectName: t.project.projectName } : null,
                                partyFreightAmount: t.partyFreightAmount
                              })),
                              expenses: (v.expenses || []).map((e: any) => ({
                                projectId: e.projectId,
                                project: e.project ? { projectName: e.project.projectName } : null,
                                amount: e.amount
                              }))
                            }} />
                            <EditVehicleButton
                              vehicle={{ id: v.id, plateNo: v.plateNo, ownerId: v.owner.id, projectId: v.projectId }}
                              owners={simpleOwners}
                              projects={simpleProjects}
                            />
                            <DeleteVehicleButton
                              vehicleId={v.id}
                              plateNo={v.plateNo}
                              tripCount={v.trips.length}
                              expenseCount={v.expenses?.length || 0}
                            />
                          </div>
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
            {vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 20px' }}>
                No vehicles found. Start by registering one.
              </div>
            ) : (
              <div className="mobile-card-list">
                {vehicles.map((v) => (
                  <div key={v.id} className="mobile-record-card">
                    <div className="mobile-card-header">
                      <div className="mobile-card-title">
                        <span>🚛</span>
                        <span className="vehicle-plate">{v.plateNo}</span>
                      </div>
                      <span className="badge active" style={{ fontSize: '10px' }}>● Active</span>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Owner</span>
                        <span className="mobile-card-field-value">{v.owner.ownerName}</span>
                      </div>
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Trips</span>
                        <span className="mobile-card-field-value highlight">{v.trips.length}</span>
                      </div>
                      <div className="mobile-card-field" style={{ gridColumn: '1 / -1' }}>
                        <span className="mobile-card-field-label">Project</span>
                        <span className="mobile-card-field-value" style={{ color: v.project ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                          {v.project ? v.project.projectName : 'Not Assigned'}
                        </span>
                      </div>
                    </div>
                    <div className="mobile-card-footer">
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{v.trips.length} trips logged</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <VehicleAnalyticsButton vehicle={{
                          plateNo: v.plateNo,
                          trips: (v.trips || []).map((t: any) => ({
                            projectId: t.projectId,
                            project: t.project ? { projectName: t.project.projectName } : null,
                            partyFreightAmount: t.partyFreightAmount
                          })),
                          expenses: (v.expenses || []).map((e: any) => ({
                            projectId: e.projectId,
                            project: e.project ? { projectName: e.project.projectName } : null,
                            amount: e.amount
                          }))
                        }} />
                        <EditVehicleButton
                          vehicle={{ id: v.id, plateNo: v.plateNo, ownerId: v.owner.id, projectId: v.projectId }}
                          owners={simpleOwners}
                          projects={simpleProjects}
                        />
                        <DeleteVehicleButton
                          vehicleId={v.id}
                          plateNo={v.plateNo}
                          tripCount={v.trips.length}
                          expenseCount={v.expenses?.length || 0}
                        />
                      </div>
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
