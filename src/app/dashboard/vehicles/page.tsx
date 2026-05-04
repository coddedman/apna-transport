import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getOwners } from '@/lib/actions/owners'
import { getProjects } from '@/lib/actions/projects'
import AddVehicleButton from '@/components/AddVehicleButton'
import EditVehicleButton from '@/components/EditVehicleButton'
import DeleteVehicleButton from '@/components/DeleteVehicleButton'
import VehicleAnalyticsButton from '@/components/analytics/VehicleAnalyticsButton'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Vehicles — Hyva Transport',
  description: 'Fleet registry with operational tracking and performance metrics',
}

interface VehiclesPageProps {
  searchParams: Promise<{
    q?: string
    ownerId?: string
  }>
}

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const params = await searchParams
  const searchQuery = params.q || ''
  const filterOwnerId = params.ownerId || ''

  const [vehiclesData, owners, projects] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        owner: { transporterId },
        ...(searchQuery ? {
          plateNo: { contains: searchQuery.toUpperCase(), mode: 'insensitive' as const }
        } : {}),
        ...(filterOwnerId ? { ownerId: filterOwnerId } : {}),
      },
      include: {
        owner: true,
        project: true,
        trips: { include: { project: true } },
        expenses: { include: { project: true } },
      },
      orderBy: { plateNo: 'asc' }
    }),
    getOwners(),
    getProjects()
  ])

  // Compute per-vehicle stats
  const vehicles = vehiclesData.map(v => {
    const totalTrips = v.trips.length
    const totalWeight = v.trips.reduce((a, t) => a + t.weight, 0)
    const totalRevenue = v.trips.reduce((a, t) => a + t.partyFreightAmount, 0)
    const totalOwnerRevenue = v.trips.reduce((a, t) => a + t.ownerFreightAmount, 0)
    const totalExpenses = v.expenses.reduce((a, e) => a + e.amount, 0)
    const profit = totalRevenue - totalExpenses
    const avgPerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0

    // Last trip date
    const lastTripDate = v.trips.length > 0
      ? new Date(Math.max(...v.trips.map(t => new Date(t.date).getTime())))
      : null

    // Days since last trip
    const daysSinceTrip = lastTripDate
      ? Math.floor((Date.now() - lastTripDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      id: v.id,
      plateNo: v.plateNo,
      owner: v.owner,
      project: v.project,
      projectId: v.projectId,
      totalTrips,
      totalWeight,
      totalRevenue,
      totalOwnerRevenue,
      totalExpenses,
      profit,
      avgPerTrip,
      lastTripDate,
      daysSinceTrip,
      rawTrips: v.trips,
      rawExpenses: v.expenses,
    }
  })

  // Sort by revenue descending
  vehicles.sort((a, b) => b.totalRevenue - a.totalRevenue)

  const totalTrips = vehicles.reduce((a, v) => a + v.totalTrips, 0)
  const totalRevenue = vehicles.reduce((a, v) => a + v.totalRevenue, 0)
  const totalWeight = vehicles.reduce((a, v) => a + v.totalWeight, 0)
  const totalProfit = vehicles.reduce((a, v) => a + v.profit, 0)
  const maxVehicleRevenue = Math.max(...vehicles.map(v => v.totalRevenue), 1)

  const hasFilter = searchQuery || filterOwnerId
  const simpleOwners = owners.map(o => ({ id: o.id, ownerName: o.ownerName }))
  const simpleProjects = projects.map(p => ({ id: p.id, projectName: p.projectName }))

  return (
    <>
      <PageHeader title="Vehicles" subtitle="Fleet registry with operational tracking">
        <AddVehicleButton owners={simpleOwners} projects={simpleProjects} />
      </PageHeader>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">🚛</div>
            </div>
            <div className="stat-card-value">{vehicles.length}</div>
            <div className="stat-card-label">Total Vehicles{hasFilter ? ' (filtered)' : ''}</div>
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
              <div className="stat-card-icon info">⚖️</div>
            </div>
            <div className="stat-card-value">{totalWeight.toFixed(0)} MT</div>
            <div className="stat-card-label">Total Weight</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">💰</div>
            </div>
            <div className="stat-card-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Revenue</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <form method="GET" action="/dashboard/vehicles" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', padding: '14px 16px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Search Vehicle</label>
              <input
                className="form-input"
                name="q"
                type="text"
                placeholder="Type plate number..."
                defaultValue={searchQuery}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              />
            </div>
            <div className="form-group" style={{ minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Filter by Owner</label>
              <select className="form-select" name="ownerId" style={{ padding: '6px 10px', fontSize: '12px' }} defaultValue={filterOwnerId}>
                <option value="">All Owners</option>
                {simpleOwners.map(o => (
                  <option key={o.id} value={o.id}>{o.ownerName}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 14px' }}>
              🔍 Filter
            </button>
            {hasFilter && (
              <a href="/dashboard/vehicles" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', textDecoration: 'none' }}>
                ✕ Clear
              </a>
            )}
          </form>
        </div>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Fleet Overview
            {hasFilter && (
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-accent)', marginLeft: '8px' }}>
                ({vehicles.length} results)
              </span>
            )}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Sorted by revenue
          </span>
        </div>

        {vehicles.length === 0 ? (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🚛</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              {hasFilter ? 'No Vehicles Found' : 'No Vehicles Yet'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {hasFilter ? 'Try a different search or filter.' : 'Start by registering your first vehicle.'}
            </div>
          </div>
        ) : (
          <div className="vehicle-card-grid">
            {vehicles.map((v) => {
              const revenueBarPct = (v.totalRevenue / maxVehicleRevenue) * 100
              const isIdle = v.daysSinceTrip !== null && v.daysSinceTrip > 7

              return (
                <div key={v.id} className="vehicle-perf-card">
                  {/* Header */}
                  <div className="vehicle-perf-header">
                    <div className="vehicle-perf-plate-group">
                      <div className="vehicle-perf-plate-icon">🚛</div>
                      <div>
                        <div className="vehicle-perf-plate">{v.plateNo}</div>
                        <div className="vehicle-perf-owner">{v.owner.ownerName}</div>
                      </div>
                    </div>
                    <span className={`badge ${isIdle ? 'inactive' : 'active'}`}>
                      {isIdle ? `Idle ${v.daysSinceTrip}d` : '● Active'}
                    </span>
                  </div>

                  {/* Project */}
                  <div className="vehicle-perf-project">
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Project</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: v.project ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                      {v.project ? v.project.projectName : 'Not Assigned'}
                    </span>
                  </div>

                  {/* KPIs */}
                  <div className="vehicle-perf-kpis">
                    <div className="vehicle-perf-kpi">
                      <span className="vehicle-perf-kpi-value">{v.totalTrips}</span>
                      <span className="vehicle-perf-kpi-label">Trips</span>
                    </div>
                    <div className="vehicle-perf-kpi">
                      <span className="vehicle-perf-kpi-value">{v.totalWeight.toFixed(0)}</span>
                      <span className="vehicle-perf-kpi-label">MT</span>
                    </div>
                    <div className="vehicle-perf-kpi">
                      <span className="vehicle-perf-kpi-value" style={{ color: 'var(--color-success)' }}>₹{(v.totalRevenue / 1000).toFixed(1)}k</span>
                      <span className="vehicle-perf-kpi-label">Revenue</span>
                    </div>
                    <div className="vehicle-perf-kpi">
                      <span className="vehicle-perf-kpi-value" style={{ color: v.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        ₹{(v.profit / 1000).toFixed(1)}k
                      </span>
                      <span className="vehicle-perf-kpi-label">Profit</span>
                    </div>
                  </div>

                  {/* Revenue bar */}
                  <div className="vehicle-perf-bar">
                    <div className="vehicle-perf-bar-header">
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Revenue Rank</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        ₹{v.totalRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="vehicle-perf-bar-track">
                      <div className="vehicle-perf-bar-fill" style={{ width: `${revenueBarPct}%` }} />
                    </div>
                  </div>

                  {/* Last Trip */}
                  {v.lastTripDate && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Last trip: {v.lastTripDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {v.avgPerTrip > 0 && (
                        <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>
                          Avg ₹{Math.round(v.avgPerTrip).toLocaleString('en-IN')}/trip
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="vehicle-perf-actions">
                    <VehicleAnalyticsButton vehicle={{ id: v.id, plateNo: v.plateNo }} />
                    <EditVehicleButton
                      vehicle={{ id: v.id, plateNo: v.plateNo, ownerId: v.owner.id, projectId: v.projectId }}
                      owners={simpleOwners}
                      projects={simpleProjects}
                    />
                    <DeleteVehicleButton
                      vehicleId={v.id}
                      plateNo={v.plateNo}
                      tripCount={v.totalTrips}
                      expenseCount={v.rawExpenses?.length || 0}
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
