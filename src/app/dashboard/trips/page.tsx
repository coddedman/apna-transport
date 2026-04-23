import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getVehicles } from '@/lib/actions/vehicles'
import { getProjects } from '@/lib/actions/projects'
import AddTripButton from '@/components/AddTripButton'
import EditTripButton from '@/components/EditTripButton'
import DeleteTripButton from '@/components/DeleteTripButton'
import ExportCSVButton from '@/components/ExportCSVButton'
import PageHeader from '@/components/PageHeader'
import { Prisma } from '@prisma/client'

export const metadata = {
  title: 'Trip Logger — Hyva Transport',
  description: 'Daily trip entries with automated freight calculation',
}

interface TripsPageProps {
  searchParams: Promise<{
    vehicleId?: string
    projectId?: string
    from?: string
    to?: string
  }>
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const params = await searchParams
  const { vehicleId, projectId, from, to } = params

  // Build server-side filter
  const where: Prisma.TripWhereInput = {
    project: { transporterId },
    ...(vehicleId ? { vehicleId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
        ...(to   ? { lte: new Date(to   + 'T23:59:59') } : {}),
      }
    } : {}),
  }

  const [tripsData, vehicles, projects] = await Promise.all([
    prisma.trip.findMany({
      where,
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
    invoiceNo: t.invoiceNo || 'N/A',
    lrNo: t.lrNo || 'N/A',
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

  const simpleVehicles = vehicles.map(v => ({ id: v.id, plateNo: v.plateNo }))
  const simpleProjects = projects.map(p => ({ id: p.id, projectName: p.projectName }))

  const hasFilter = vehicleId || projectId || from || to

  const csvColumns = [
    { key: 'date', label: 'Date' },
    { key: 'invoiceNo', label: 'Invoice No.' },
    { key: 'vehicle', label: 'Vehicle No.' },
    { key: 'lrNo', label: 'LR No.' },
    { key: 'project', label: 'Project' },
    { key: 'weight', label: 'Net Wt (MT)' },
    { key: 'ownerRate', label: 'Revenue Rate' },
    { key: 'partyRate', label: 'Payout Rate' },
    { key: 'ownerAmount', label: 'Total Revenue' },
    { key: 'partyAmount', label: 'Total Payout' },
    { key: 'profit', label: 'Margin' },
  ]

  return (
    <>
      <PageHeader 
        title="Trip Logger" 
        subtitle="Daily trip entries with automated freight calculation"
      >
        <AddTripButton vehicles={vehicles} projects={projects} />
      </PageHeader>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">🛣️</div>
            </div>
            <div className="stat-card-value">{trips.length}</div>
            <div className="stat-card-label">Total Trips{hasFilter ? ' (filtered)' : ' (All time)'}</div>
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

        {/* Filter Bar — server-side via GET form */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <form className="expense-filter-form" method="GET" action="/dashboard/trips" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '14px 16px' }}>
            <div className="form-group" style={{ minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Vehicle</label>
              <select className="form-select" name="vehicleId" style={{ padding: '6px 10px', fontSize: '12px' }} defaultValue={vehicleId || ''}>
                <option value="">All Vehicles</option>
                {simpleVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plateNo}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Project</label>
              <select className="form-select" name="projectId" style={{ padding: '6px 10px', fontSize: '12px' }} defaultValue={projectId || ''}>
                <option value="">All Projects</option>
                {simpleProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>From</label>
              <input className="form-input" name="from" type="date" defaultValue={from || ''} style={{ padding: '6px 10px', fontSize: '12px' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>To</label>
              <input className="form-input" name="to" type="date" defaultValue={to || ''} style={{ padding: '6px 10px', fontSize: '12px' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px', width: '100%', maxWidth: '280px' }}>
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 14px', alignSelf: 'flex-end', flex: 1 }}>
                🔍 Filter
              </button>
              {hasFilter && (
                <a href="/dashboard/trips" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', alignSelf: 'flex-end', textDecoration: 'none' }}>
                  ✕ Clear
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Trip Records
              {hasFilter && (
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-accent)', marginLeft: '8px' }}>
                  ({trips.length} results)
                </span>
              )}
            </span>
            <ExportCSVButton data={trips} filename="trips_export" columns={csvColumns} />
          </div>

          {/* Mobile totals summary */}
          <div className="mobile-totals-bar">
            <div className="mobile-totals-grid">
              <div className="mobile-total-item">
                <span className="mobile-total-label">Revenue</span>
                <span className="mobile-total-value" style={{ color: 'var(--color-success)' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="mobile-total-item">
                <span className="mobile-total-label">Payout</span>
                <span className="mobile-total-value" style={{ color: 'var(--color-accent)' }}>₹{totalPayout.toLocaleString('en-IN')}</span>
              </div>
              <div className="mobile-total-item">
                <span className="mobile-total-label">Profit</span>
                <span className="mobile-total-value" style={{ color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{totalProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="desktop-only-table">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>INVOICE NO. (Trip ID)</th>
                    <th>VEHICLE NO.</th>
                    <th>LR NO. (Yellow Sl No)</th>
                    <th>Project</th>
                    <th>NET WT (MT)</th>
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
                      <td colSpan={12} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                        No trips {hasFilter ? 'found for selected filters.' : 'recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    trips.map((trip) => (
                      <tr key={trip.id}>
                        <td>{trip.date}</td>
                        <td><code className="invoice-badge">{trip.invoiceNo}</code></td>
                        <td><strong>{trip.vehicle}</strong></td>
                        <td>{trip.lrNo}</td>
                        <td>{trip.project}</td>
                        <td style={{ fontWeight: 600 }}>{trip.weight}</td>
                        <td>₹{trip.ownerRate}</td>
                        <td>₹{trip.partyRate}</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>₹{trip.ownerAmount.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--color-warning)', fontWeight: 700 }}>₹{trip.partyAmount.toLocaleString('en-IN')}</td>
                        <td style={{ color: trip.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>₹{trip.profit.toLocaleString('en-IN')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <EditTripButton 
                              trip={trip} 
                              vehicles={vehicles} 
                              projects={simpleProjects} 
                            />
                            <DeleteTripButton tripId={trip.id} vehiclePlate={trip.vehicle} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Totals</td>
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

          {/* Mobile card view */}
          <div className="mobile-only-cards">
            {trips.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 20px' }}>
                No trips {hasFilter ? 'found for selected filters.' : 'recorded yet.'}
              </div>
            ) : (
              <div className="mobile-card-list">
                {trips.map((trip) => (
                  <div key={trip.id} className="mobile-record-card">
                    <div className="mobile-card-header">
                      <div className="mobile-card-title">
                        <span>🚛</span>
                        <span className="vehicle-plate">{trip.vehicle}</span>
                      </div>
                      <span className="mobile-card-date">{trip.date}</span>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Project</span>
                        <span className="mobile-card-field-value">{trip.project}</span>
                      </div>
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Weight</span>
                        <span className="mobile-card-field-value highlight">{trip.weight} MT</span>
                      </div>
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Revenue</span>
                        <span className="mobile-card-field-value success">₹{trip.ownerAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Payout</span>
                        <span className="mobile-card-field-value warning">₹{trip.partyAmount.toLocaleString('en-IN')}</span>
                      </div>
                      {trip.invoiceNo !== 'N/A' && (
                        <div className="mobile-card-field">
                          <span className="mobile-card-field-label">Invoice</span>
                          <span className="mobile-card-field-value"><code className="invoice-badge">{trip.invoiceNo}</code></span>
                        </div>
                      )}
                      {trip.lrNo !== 'N/A' && (
                        <div className="mobile-card-field">
                          <span className="mobile-card-field-label">LR No.</span>
                          <span className="mobile-card-field-value">{trip.lrNo}</span>
                        </div>
                      )}
                    </div>
                    <div className="mobile-card-footer">
                      <div>
                        <span className="mobile-card-profit-label">Margin </span>
                        <span className="mobile-card-profit" style={{ color: trip.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          ₹{trip.profit.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <EditTripButton 
                          trip={trip} 
                          vehicles={vehicles} 
                          projects={simpleProjects} 
                        />
                        <DeleteTripButton tripId={trip.id} vehiclePlate={trip.vehicle} />
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
