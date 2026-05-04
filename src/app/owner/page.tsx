import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import OwnerChangePasswordButton from '@/components/OwnerChangePasswordButton'

export const metadata = {
  title: 'My Dashboard — Hyva Transport',
}

export default async function OwnerPortalPage() {
  const session = await auth()
  const user = session?.user as any

  // Get owner record with all related data
  const owner = await prisma.owner.findUnique({
    where: { userId: user.id },
    include: {
      transporter: true,
      vehicles: {
        include: {
          project: true,
          trips: {
            include: { project: true },
            orderBy: { date: 'desc' },
          },
          expenses: {
            orderBy: { date: 'desc' },
          },
        }
      }
    }
  })

  if (!owner) {
    return (
      <div style={{ 
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' 
      }}>
        Owner record not found. Contact your transporter admin.
      </div>
    )
  }

  // Calculate totals
  const totalTrips = owner.vehicles.reduce((acc, v) => acc + v.trips.length, 0)
  const totalRevenue = owner.vehicles.reduce((acc, v) => 
    acc + v.trips.reduce((a, t) => a + t.partyFreightAmount, 0), 0)
  const totalExpenses = owner.vehicles.reduce((acc, v) => 
    acc + v.expenses.reduce((a, e) => a + e.amount, 0), 0)
  const netPending = totalRevenue - totalExpenses

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(245,158,11,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>👤</div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                {owner.ownerName}
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                {owner.transporter.name} • Owner Portal
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <OwnerChangePasswordButton />
          <form action={async () => { 'use server'; const { signOut } = await import('@/lib/auth'); await signOut(); }}>
            <button type="submit" className="btn btn-secondary btn-sm">🚪 Sign Out</button>
          </form>
        </div>
      </header>

      <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">🚛</div>
            </div>
            <div className="stat-card-value">{owner.vehicles.length}</div>
            <div className="stat-card-label">My Vehicles</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">🛣️</div>
            </div>
            <div className="stat-card-value">{totalTrips}</div>
            <div className="stat-card-label">Total Trips</div>
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
            <div className="stat-card-value" style={{ color: netPending >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              ₹{netPending.toLocaleString('en-IN')}
            </div>
            <div className="stat-card-label">Net Pending</div>
          </div>
        </div>

        {/* Vehicles with their data */}
        {owner.vehicles.length === 0 ? (
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No vehicles assigned to you yet. Contact your transporter admin.
            </div>
          </div>
        ) : (
          owner.vehicles.map(vehicle => {
            const vTrips = vehicle.trips
            const vExpenses = vehicle.expenses
            const vRevenue = vTrips.reduce((a, t) => a + t.partyFreightAmount, 0)
            const vExpTotal = vExpenses.reduce((a, e) => a + e.amount, 0)

            return (
              <div key={vehicle.id} className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="card-title" style={{ fontSize: '16px' }}>🚛 {vehicle.plateNo}</span>
                    {vehicle.project && (
                      <span style={{
                        fontSize: '11px', padding: '3px 10px',
                        background: 'rgba(245,158,11,0.1)', color: 'var(--color-accent)',
                        borderRadius: '20px', fontWeight: 600,
                      }}>
                        📍 {vehicle.project.projectName}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    <span>Trips: <strong style={{ color: 'var(--color-text-primary)' }}>{vTrips.length}</strong></span>
                    <span>Revenue: <strong style={{ color: 'var(--color-success)' }}>₹{vRevenue.toLocaleString('en-IN')}</strong></span>
                    <span>Expenses: <strong style={{ color: 'var(--color-danger)' }}>₹{vExpTotal.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>

                {/* Trips Table */}
                {vTrips.length > 0 && (
                  <div style={{ padding: '0 20px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Trip Records
                    </h4>
                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Project</th>
                            <th>Weight (MT)</th>
                            <th>Rate/MT</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vTrips.slice(0, 10).map(trip => (
                            <tr key={trip.id}>
                              <td>{new Date(trip.date).toLocaleDateString('en-IN')}</td>
                              <td>{trip.project.projectName}</td>
                              <td>{trip.weight}</td>
                              <td>₹{trip.partyRate}</td>
                              <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>₹{trip.partyFreightAmount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {vTrips.length > 10 && (
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '8px 0', textAlign: 'center' }}>
                        Showing last 10 of {vTrips.length} trips
                      </p>
                    )}
                  </div>
                )}

                {/* Expenses Table */}
                {vExpenses.length > 0 && (
                  <div style={{ padding: '0 20px 16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Expense Records
                    </h4>
                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Remarks</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vExpenses.slice(0, 10).map(exp => (
                            <tr key={exp.id}>
                              <td>{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                              <td>
                                <span className={`badge ${exp.type === 'FUEL' ? 'fuel' : exp.type === 'MAINTENANCE' ? 'maintenance' : exp.type === 'DRIVER_ADVANCE' ? 'advance' : 'other'}`}>
                                  {exp.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td>{exp.remarks || '—'}</td>
                              <td style={{ fontWeight: 700 }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {vTrips.length === 0 && vExpenses.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    No trips or expenses logged for this vehicle yet.
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
