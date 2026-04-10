import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AddOwnerButton from '@/components/AddOwnerButton'

export default async function OwnersPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const ownersData = await prisma.owner.findMany({
    where: { transporterId },
    include: {
      vehicles: {
        include: {
          trips: true,
          expenses: true
        }
      }
    }
  })

  // Calculate dynamic stats
  const owners = ownersData.map(o => {
    let pendingPayout = 0
    let totalVehicles = o.vehicles.length
    
    o.vehicles.forEach(v => {
      const vehicleRevenue = v.trips.reduce((acc, t) => acc + t.totalAmount, 0)
      const vehicleExpenses = v.expenses.reduce((acc, e) => acc + e.amount, 0)
      // Pending payout is normally Revenue - Expenses for that owner's vehicles
      pendingPayout += (vehicleRevenue - vehicleExpenses)
    })

    return {
      id: o.id,
      name: o.ownerName,
      phone: o.phone,
      vehicles: totalVehicles,
      status: totalVehicles > 0 ? 'active' : 'inactive',
      pending: `₹${Math.max(0, pendingPayout).toLocaleString('en-IN')}`
    }
  })

  const totalVehiclesCount = ownersData.reduce((acc, o) => acc + o.vehicles.length, 0)
  const totalPendingOverall = ownersData.reduce((acc, o) => {
    let pending = 0
    o.vehicles.forEach(v => {
      pending += v.trips.reduce((acc, t) => acc + t.totalAmount, 0) - v.expenses.reduce((acc, e) => acc + e.amount, 0)
    })
    return acc + Math.max(0, pending)
  }, 0)

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Vehicle Owners</h1>
            <p className="page-subtitle">Manage 3rd party vehicle owners and their details</p>
          </div>
        </div>
        <div className="page-header-right">
          <AddOwnerButton />
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">👤</div>
            </div>
            <div className="stat-card-value">{owners.length}</div>
            <div className="stat-card-label">Total Owners</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">✅</div>
            </div>
            <div className="stat-card-value">{owners.filter(o => o.status === 'active').length}</div>
            <div className="stat-card-label">Active Owners</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">🚛</div>
            </div>
            <div className="stat-card-value">{totalVehiclesCount}</div>
            <div className="stat-card-label">Total Vehicles</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">💸</div>
            </div>
            <div className="stat-card-value">₹{totalPendingOverall.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Pending</div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Owners</span>
            <button className="btn btn-secondary btn-sm">🔍 Search</button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Owner Name</th>
                  <th>Contact</th>
                  <th>Vehicles</th>
                  <th>Pending Payout</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {owners.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                      No owners registered yet. Add one!
                    </td>
                  </tr>
                ) : (
                  owners.map((owner) => (
                    <tr key={owner.id}>
                      <td><strong>{owner.name}</strong></td>
                      <td>{owner.phone}</td>
                      <td>{owner.vehicles} trucks</td>
                      <td style={{ color: owner.pending !== '₹0' ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                        {owner.pending}
                      </td>
                      <td>
                        <span className={`badge ${owner.status}`}>
                          {owner.status === 'active' ? '● Active' : '○ Inactive'}
                        </span>
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
