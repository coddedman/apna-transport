import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AddOwnerButton from '@/components/AddOwnerButton'
import EditOwnerButton from '@/components/EditOwnerButton'
import DeleteOwnerButton from '@/components/DeleteOwnerButton'
import OwnerAnalyticsButton from '@/components/analytics/OwnerAnalyticsButton'
import OwnerAdvanceButton from '@/components/OwnerAdvanceButton'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Vehicle Owners — Hyva Transport',
  description: 'Manage 3rd party vehicle owners and their details',
}

interface OwnersPageProps {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function OwnersPage({ searchParams }: OwnersPageProps) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const params = await searchParams
  const searchQuery = params.q || ''

  const [ownersData, projects] = await Promise.all([
    prisma.owner.findMany({
      where: {
        transporterId,
        ...(searchQuery ? {
          OR: [
            { ownerName: { contains: searchQuery, mode: 'insensitive' as const } },
            { phone: { contains: searchQuery } },
          ]
        } : {}),
      },
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

  // Calculate dynamic stats per owner
  const owners = ownersData.map(o => {
    let totalRevenue = 0
    let totalExpenses = 0
    let totalTrips = 0
    let totalWeight = 0
    const totalVehicles = o.vehicles.length
    const totalAdvances = o.advances.reduce((acc: number, a: any) => acc + a.amount, 0)
    
    o.vehicles.forEach(v => {
      const vehicleRevenue = v.trips.reduce((acc: number, t: any) => acc + t.partyFreightAmount, 0)
      const vehicleExpenses = v.expenses.reduce((acc: number, e: any) => acc + e.amount, 0)
      const vehicleTrips = v.trips.length
      const vehicleWeight = v.trips.reduce((acc: number, t: any) => acc + t.weight, 0)
      totalRevenue += vehicleRevenue
      totalExpenses += vehicleExpenses
      totalTrips += vehicleTrips
      totalWeight += vehicleWeight
    })

    const grossPayable = totalRevenue - totalExpenses
    const netPayable = Math.max(0, grossPayable - totalAdvances)
    const settledAmount = o.settlements
      .filter((s: any) => s.status === 'SETTLED')
      .reduce((a: number, s: any) => a + s.finalPayout, 0)

    // Vehicle breakdown
    const vehicleBreakdown = o.vehicles.map(v => {
      const rev = v.trips.reduce((acc: number, t: any) => acc + t.partyFreightAmount, 0)
      const exp = v.expenses.reduce((acc: number, e: any) => acc + e.amount, 0)
      return {
        plateNo: v.plateNo,
        trips: v.trips.length,
        revenue: rev,
        expenses: exp,
        profit: rev - exp
      }
    })

    return {
      id: o.id,
      name: o.ownerName,
      phone: o.phone,
      email: o.user?.email || null,
      defaultPassword: o.defaultPassword,
      mustChangePassword: o.user?.mustChangePassword ?? null,
      user: o.user,
      vehicles: totalVehicles,
      totalTrips,
      totalWeight,
      totalRevenue,
      totalExpenses,
      totalAdvances,
      grossPayable,
      netPayable,
      settledAmount,
      status: totalVehicles > 0 ? 'active' : 'inactive',
      vehicleBreakdown,
      pendingSettlements: o.settlements.filter((s: any) => s.status === 'PENDING').length,
    }
  })

  // Aggregated stats
  const totalVehiclesCount = owners.reduce((acc, o) => acc + o.vehicles, 0)
  const totalAdvancesGiven = owners.reduce((acc, o) => acc + o.totalAdvances, 0)
  const totalRevenueAll = owners.reduce((acc, o) => acc + o.totalRevenue, 0)
  const totalPendingOverall = owners.reduce((acc, o) => acc + o.netPayable, 0)
  const totalTripsAll = owners.reduce((acc, o) => acc + o.totalTrips, 0)
  const maxRevenue = Math.max(...owners.map(o => o.totalRevenue), 1)

  return (
    <>
      <PageHeader 
        title="Vehicle Owners" 
        subtitle="Manage 3rd party vehicle owners and their details"
      >
        <OwnerAdvanceButton
          owners={owners.map(o => ({ id: o.id, ownerName: o.name }))}
          projects={projects}
        />
        <AddOwnerButton />
      </PageHeader>

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
              <div className="stat-card-icon success">🚛</div>
            </div>
            <div className="stat-card-value">{totalVehiclesCount}</div>
            <div className="stat-card-label">Total Vehicles</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">💰</div>
            </div>
            <div className="stat-card-value">₹{totalRevenueAll.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Revenue</div>
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
              <div className="stat-card-icon advance">🏦</div>
            </div>
            <div className="stat-card-value">₹{totalAdvancesGiven.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Advances Given</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <form method="GET" action="/dashboard/owners" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', padding: '14px 16px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Search by Name or Phone</label>
              <input
                className="form-input"
                name="q"
                type="text"
                placeholder="Type owner name or phone..."
                defaultValue={searchQuery}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 14px' }}>
              🔍 Search
            </button>
            {searchQuery && (
              <a href="/dashboard/owners" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', textDecoration: 'none' }}>
                ✕ Clear
              </a>
            )}
          </form>
        </div>

        {/* Owner Profile Cards */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            All Owners
            {searchQuery && (
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-accent)', marginLeft: '8px' }}>
                ({owners.length} results for &quot;{searchQuery}&quot;)
              </span>
            )}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {totalTripsAll} total trips across all owners
          </span>
        </div>

        {owners.length === 0 ? (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>👤</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              {searchQuery ? 'No Owners Found' : 'No Owners Yet'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {searchQuery ? `No results for "${searchQuery}". Try a different search.` : 'Register your first vehicle owner to get started.'}
            </div>
          </div>
        ) : (
          <div className="owner-card-grid">
            {owners.map((owner) => {
              const payoutPct = owner.totalRevenue > 0
                ? Math.min(100, Math.round(((owner.totalAdvances + owner.settledAmount) / owner.totalRevenue) * 100))
                : 0

              return (
                <div key={owner.id} className="owner-profile-card">
                  {/* Header */}
                  <div className="owner-profile-header">
                    <div className="owner-profile-avatar">
                      {owner.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="owner-profile-info">
                      <div className="owner-profile-name">{owner.name}</div>
                      <div className="owner-profile-contact">
                        <span>📱 {owner.phone}</span>
                        {owner.email && <span>✉️ {owner.email}</span>}
                      </div>
                    </div>
                    <span className={`badge ${owner.status === 'active' ? 'active' : 'inactive'}`}>
                      {owner.status === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>

                  {/* Mini KPIs */}
                  <div className="owner-kpi-row">
                    <div className="owner-kpi">
                      <span className="owner-kpi-value">{owner.vehicles}</span>
                      <span className="owner-kpi-label">Vehicles</span>
                    </div>
                    <div className="owner-kpi">
                      <span className="owner-kpi-value">{owner.totalTrips}</span>
                      <span className="owner-kpi-label">Trips</span>
                    </div>
                    <div className="owner-kpi">
                      <span className="owner-kpi-value">{owner.totalWeight.toFixed(0)}</span>
                      <span className="owner-kpi-label">MT Hauled</span>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="owner-finance-block">
                    <div className="owner-finance-row">
                      <span className="owner-finance-label">Revenue</span>
                      <span className="owner-finance-value" style={{ color: 'var(--color-success)' }}>
                        ₹{owner.totalRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="owner-finance-row">
                      <span className="owner-finance-label">Expenses</span>
                      <span className="owner-finance-value" style={{ color: 'var(--color-danger)' }}>
                        ₹{owner.totalExpenses.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="owner-finance-row">
                      <span className="owner-finance-label">Advances Given</span>
                      <span className="owner-finance-value" style={{ color: 'var(--color-info)' }}>
                        ₹{owner.totalAdvances.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="owner-finance-row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                      <span className="owner-finance-label" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Net Payable</span>
                      <span className="owner-finance-value" style={{ 
                        fontWeight: 800, fontSize: '15px',
                        color: owner.netPayable > 0 ? 'var(--color-accent)' : 'var(--color-success)' 
                      }}>
                        ₹{owner.netPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Payout Progress */}
                  <div className="owner-payout-progress">
                    <div className="owner-payout-header">
                      <span className="owner-payout-label">Payout Progress</span>
                      <span className="owner-payout-pct">{payoutPct}% paid</span>
                    </div>
                    <div className="owner-payout-track">
                      <div 
                        className="owner-payout-fill" 
                        style={{ width: `${payoutPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Revenue contribution bar */}
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenue Share</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        {totalRevenueAll > 0 ? Math.round((owner.totalRevenue / totalRevenueAll) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', borderRadius: '100px',
                        width: `${(owner.totalRevenue / maxRevenue) * 100}%`,
                        background: 'linear-gradient(90deg, var(--color-info), var(--color-purple))',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>

                  {/* Vehicle Breakdown (compact) */}
                  {owner.vehicleBreakdown.length > 0 && (
                    <div className="owner-vehicles-breakdown">
                      <div className="owner-section-title">Vehicle Breakdown</div>
                      {owner.vehicleBreakdown.map((vb, idx) => (
                        <div key={idx} className="owner-vehicle-row">
                          <span className="owner-vehicle-plate">🚛 {vb.plateNo}</span>
                          <span className="owner-vehicle-stat">{vb.trips} trips</span>
                          <span className="owner-vehicle-stat" style={{ color: 'var(--color-success)' }}>₹{vb.revenue.toLocaleString('en-IN')}</span>
                          <span className="owner-vehicle-stat" style={{ 
                            color: vb.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                            fontWeight: 700
                          }}>
                            {vb.profit >= 0 ? '+' : ''}₹{vb.profit.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Login Status */}
                  {owner.email && (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.02)', marginTop: '8px',
                      fontSize: '11px'
                    }}>
                      <span>🔐</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>Login:</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{owner.email}</span>
                      {owner.defaultPassword ? (
                        <code style={{ 
                          marginLeft: 'auto', fontSize: '10px', fontWeight: 600,
                          color: 'var(--color-accent)', background: 'rgba(245,158,11,0.08)',
                          padding: '1px 6px', borderRadius: '3px'
                        }}>{owner.defaultPassword}</code>
                      ) : owner.mustChangePassword === false ? (
                        <span style={{ marginLeft: 'auto', color: 'var(--color-success)', fontSize: '10px' }}>Password Changed ✓</span>
                      ) : (
                        <span style={{ marginLeft: 'auto', color: 'var(--color-accent)', fontSize: '10px' }}>Pending Change</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="owner-profile-actions">
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
