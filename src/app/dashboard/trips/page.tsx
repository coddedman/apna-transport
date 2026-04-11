import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getVehicles } from '@/lib/actions/vehicles'
import { getProjects } from '@/lib/actions/projects'
import AddTripButton from '@/components/AddTripButton'
import EditTripButton from '@/components/EditTripButton'

export default async function TripsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const [tripsData, vehicles, projects] = await Promise.all([
    prisma.trip.findMany({
      where: { project: { transporterId } },
      include: {
        vehicle: true,
        project: true
      },
      orderBy: { date: 'desc' }
    }),
    getVehicles(),
    getProjects()
  ])

  // Format the data dynamically
  const trips = tripsData.map(t => ({
    id: t.id,
    date: new Date(t.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    vehicle: t.vehicle.plateNo,
    project: t.project.projectName,
    weight: t.weight,
    partyRate: t.partyRate,
    ownerRate: t.ownerRate,
    partyAmount: t.partyFreightAmount,
    ownerAmount: t.ownerFreightAmount,
    profit: t.ownerFreightAmount - t.partyFreightAmount,
    driver: 'Unknown', // Not in schema yet, keep generic
    rawDate: t.date.toISOString(),
    vehicleId: t.vehicleId,
    projectId: t.projectId
  }))

  const totalWeight = trips.reduce((a, t) => a + t.weight, 0)
  const totalRevenue = trips.reduce((a, t) => a + t.ownerAmount, 0)
  const totalPayout = trips.reduce((a, t) => a + t.partyAmount, 0)
  const totalProfit = totalRevenue - totalPayout

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Trip Logger</h1>
            <p className="page-subtitle">Daily trip entries with automated freight calculation</p>
          </div>
        </div>
        <div className="page-header-right">
          <AddTripButton vehicles={vehicles} projects={projects} />
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">🛣️</div>
            </div>
            <div className="stat-card-value">{trips.length}</div>
            <div className="stat-card-label">Total Trips (All time)</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">⚖️</div>
            </div>
            <div className="stat-card-value">{totalWeight.toFixed(1)} MT</div>
            <div className="stat-card-label">Total Weight</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">💰</div>
            </div>
            <div className="stat-card-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Revenue</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">📊</div>
            </div>
            <div className="stat-card-value">₹{totalProfit.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Net Trip Profit</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm">Filter by Range</button>
              <button className="btn btn-secondary btn-sm">All Vehicles</button>
              <button className="btn btn-secondary btn-sm">All Projects</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Trip Records</span>
            <button className="btn btn-secondary btn-sm">📥 Export CSV</button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle No.</th>
                  <th>Project</th>
                  <th>WT (MT)</th>
                  <th>Revenue Rate</th>
                  <th>Payout Rate</th>
                  <th>Total Revenue</th>
                  <th>Total Payout</th>
                  <th>Margin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                      No trips recorded yet.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip) => (
                    <tr key={trip.id}>
                      <td>{trip.date}</td>
                      <td><strong>{trip.vehicle}</strong></td>
                      <td>{trip.project}</td>
                      <td style={{ fontWeight: 600 }}>{trip.weight}</td>
                      <td>₹{trip.ownerRate}</td>
                      <td>₹{trip.partyRate}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>₹{trip.ownerAmount.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-warning)', fontWeight: 700 }}>₹{trip.partyAmount.toLocaleString('en-IN')}</td>
                      <td style={{ color: trip.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>₹{trip.profit.toLocaleString('en-IN')}</td>
                      <td>
                        <EditTripButton 
                          trip={trip} 
                          vehicles={vehicles} 
                          projects={projects.map(p => ({ id: p.id, projectName: p.projectName }))} 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Totals</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalWeight.toFixed(1)}</td>
                  <td colSpan={2}>—</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>₹{totalRevenue.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-warning)' }}>₹{totalPayout.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{totalProfit.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
