import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AddOwnerButton from '@/components/AddOwnerButton'
import EditOwnerButton from '@/components/EditOwnerButton'
import DeleteOwnerButton from '@/components/DeleteOwnerButton'
import OwnerAnalyticsButton from '@/components/analytics/OwnerAnalyticsButton'
import OwnerAdvanceButton from '@/components/OwnerAdvanceButton'

export default async function OwnersPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const [ownersData, projects] = await Promise.all([
    prisma.owner.findMany({
      where: { transporterId },
      include: {
        user: { select: { email: true, mustChangePassword: true } },
        settlements: true,
        advances: { include: { project: true } },
        vehicles: {
          include: {
            trips: { include: { project: true } },
            expenses: { include: { project: true } }
          }
        }
      }
    }),
    prisma.project.findMany({ where: { transporterId }, select: { id: true, projectName: true } })
  ])

  // Calculate dynamic stats
  const owners = ownersData.map(o => {
    let pendingPayout = 0
    const totalVehicles = o.vehicles.length
    const totalAdvances = o.advances.reduce((acc: number, a: any) => acc + a.amount, 0)
    
    o.vehicles.forEach(v => {
      const vehicleRevenue = v.trips.reduce((acc: number, t: any) => acc + t.partyFreightAmount, 0)
      const vehicleExpenses = v.expenses.reduce((acc: number, e: any) => acc + e.amount, 0)
      pendingPayout += (vehicleRevenue - vehicleExpenses)
    })
    // Deduct advances already given from pending payout
    const netPending = Math.max(0, pendingPayout - totalAdvances)

    return {
      id: o.id,
      name: o.ownerName,
      phone: o.phone,
      email: o.user?.email || null,
      defaultPassword: o.defaultPassword,
      mustChangePassword: o.user?.mustChangePassword ?? null,
      user: o.user,
      vehicles: totalVehicles,
      status: totalVehicles > 0 ? 'active' : 'inactive',
      pending: `₹${netPending.toLocaleString('en-IN')}`,
      totalAdvances
    }
  })

  const totalVehiclesCount = ownersData.reduce((acc, o) => acc + o.vehicles.length, 0)
  const totalAdvancesGiven = ownersData.reduce((acc, o) => acc + o.advances.reduce((a: number, adv: any) => a + adv.amount, 0), 0)
  const totalPendingOverall = ownersData.reduce((acc, o) => {
    let pending = 0
    o.vehicles.forEach(v => {
      pending += v.trips.reduce((a: number, t: any) => a + t.partyFreightAmount, 0) - v.expenses.reduce((a: number, e: any) => a + e.amount, 0)
    })
    const advances = o.advances.reduce((a: number, adv: any) => a + adv.amount, 0)
    return acc + Math.max(0, pending - advances)
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
          <OwnerAdvanceButton
            owners={owners.map(o => ({ id: o.id, ownerName: o.name }))}
            projects={projects}
          />
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
            <div className="stat-card-label">Net Pending Payout</div>
          </div>
          <div className="stat-card advance">
            <div className="stat-card-header">
              <div className="stat-card-icon advance">💰</div>
            </div>
            <div className="stat-card-value">₹{totalAdvancesGiven.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Advances Given</div>
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
                  <th>Login Email</th>
                  <th>Default Password</th>
                  <th>Vehicles</th>
                  <th>Pending Payout</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                      No owners registered yet. Add one!
                    </td>
                  </tr>
                ) : (
                  owners.map((owner) => (
                    <tr key={owner.id}>
                      <td><strong>{owner.name}</strong></td>
                      <td>{owner.phone}</td>
                      <td>
                        {owner.email ? (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{owner.email}</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No login</span>
                        )}
                      </td>
                      <td>
                        {owner.defaultPassword ? (
                          <code style={{ 
                            fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)',
                            background: 'rgba(245,158,11,0.08)', padding: '2px 8px',
                            borderRadius: '4px', letterSpacing: '0.5px',
                          }}>
                            {owner.defaultPassword}
                          </code>
                        ) : owner.email && owner.mustChangePassword === false ? (
                          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontStyle: 'italic' }}>
                            Changed ✓
                          </span>
                        ) : owner.email && owner.mustChangePassword === true ? (
                          <span style={{ fontSize: '11px', color: 'var(--color-accent)', fontStyle: 'italic' }}>
                            Not yet changed
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>{owner.vehicles} trucks</td>
                      <td style={{ color: owner.pending !== '₹0' ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                        {owner.pending}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <OwnerAnalyticsButton owner={{
                            ownerName: owner.name,
                            vehicles: (ownersData.find(od => od.id === owner.id)?.vehicles || []).map((v: any) => ({
                              id: v.id,
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
                            })),
                            settlements: (ownersData.find(od => od.id === owner.id)?.settlements || []).map((s: any) => ({
                              status: s.status,
                              finalPayout: s.finalPayout
                            })),
                            advances: (ownersData.find(od => od.id === owner.id)?.advances || []).map((a: any) => ({
                              id: a.id,
                              amount: a.amount,
                              date: a.date,
                              remarks: a.remarks,
                              project: a.project ? { projectName: a.project.projectName } : null
                            }))
                          }} />
                          <EditOwnerButton owner={{
                            id: owner.id,
                            ownerName: owner.name,
                            phone: owner.phone,
                            defaultPassword: owner.defaultPassword,
                            mustChangePassword: owner.mustChangePassword,
                            user: owner.user,
                          }} />
                          <DeleteOwnerButton
                            ownerId={owner.id}
                            ownerName={owner.name}
                            vehicleCount={owner.vehicles}
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
      </div>
    </>
  )
}
