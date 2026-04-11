import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getVehicles } from '@/lib/actions/vehicles'
import { getProjects } from '@/lib/actions/projects'
import AddTripButton from '@/components/AddTripButton'

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
    rate: t.ratePerTon,
    amount: t.totalAmount,
    driver: 'Unknown' // Not in schema yet, keep generic
  }))

  const totalWeight = trips.reduce((a, t) => a + t.weight, 0)
  const totalAmount = trips.reduce((a, t) => a + t.amount, 0)

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
            <div className="stat-card-value">₹{totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Freight</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">📊</div>
            </div>
            <div className="stat-card-value">₹{trips.length > 0 ? Math.round(totalAmount / trips.length).toLocaleString('en-IN') : 0}</div>
            <div className="stat-card-label">Avg per Trip</div>
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
                  <th>Weight (MT)</th>
                  <th>Rate/MT</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
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
                      <td>₹{trip.rate}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>₹{trip.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Totals</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalWeight.toFixed(1)}</td>
                  <td>—</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>₹{totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
