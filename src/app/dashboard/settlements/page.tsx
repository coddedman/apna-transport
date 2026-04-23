import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import GenerateSettlementButton from '@/components/GenerateSettlementButton'
import MarkSettledButton from '@/components/MarkSettledButton'
import ExportCSVButton from '@/components/ExportCSVButton'

export const metadata = {
  title: 'Settlements — Hyva Transport',
  description: 'Owner reconciliation and payout generation',
}

export default async function SettlementsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  // Get owners for the generate dropdown
  const owners = await prisma.owner.findMany({
    where: { transporterId },
    select: { id: true, ownerName: true },
    orderBy: { ownerName: 'asc' }
  })

  // Get all settlements for this transporter's owners
  const settlements = await prisma.settlement.findMany({
    where: {
      owner: { transporterId }
    },
    include: {
      owner: { select: { ownerName: true, vehicles: { select: { id: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const totalPending = settlements
    .filter(s => s.status === 'PENDING')
    .reduce((acc, s) => acc + s.finalPayout, 0)

  const totalSettled = settlements
    .filter(s => s.status === 'SETTLED')
    .reduce((acc, s) => acc + s.finalPayout, 0)

  const csvData = settlements.map(s => ({
    owner: s.owner.ownerName,
    period: `${new Date(s.periodStart).toLocaleDateString('en-IN')} — ${new Date(s.periodEnd).toLocaleDateString('en-IN')}`,
    trips: s.tripsCount,
    revenue: s.totalRevenue,
    fuel: s.totalFuel,
    advances: s.totalAdvances,
    maintenance: s.totalMaint,
    tolls: s.totalTolls,
    other: s.totalOther,
    payout: s.finalPayout,
    status: s.status,
  }))

  const csvColumns = [
    { key: 'owner', label: 'Owner' },
    { key: 'period', label: 'Period' },
    { key: 'trips', label: 'Trips' },
    { key: 'revenue', label: 'Revenue (₹)' },
    { key: 'fuel', label: 'Fuel (₹)' },
    { key: 'advances', label: 'Advances (₹)' },
    { key: 'maintenance', label: 'Maintenance (₹)' },
    { key: 'tolls', label: 'Tolls (₹)' },
    { key: 'other', label: 'Other (₹)' },
    { key: 'payout', label: 'Final Payout (₹)' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Settlements</h1>
            <p className="page-subtitle">Owner reconciliation and payout generation</p>
          </div>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: '10px' }}>
          <ExportCSVButton data={csvData} filename="settlements_export" columns={csvColumns} />
          <GenerateSettlementButton owners={owners} />
        </div>
      </header>

      <div className="page-body">
        {/* Formula Banner */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Settlement Formula:</span>
              <code style={{
                background: 'rgba(245,158,11,.08)',
                border: '1px solid rgba(245,158,11,.2)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--color-accent)',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}>
                Final Payout = Σ(Trip Revenue) − Σ(Advances + Fuel + Deductions)
              </code>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">📋</div>
            </div>
            <div className="stat-card-value">{settlements.length}</div>
            <div className="stat-card-label">Total Settlements</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">✅</div>
            </div>
            <div className="stat-card-value">{settlements.filter(s => s.status === 'SETTLED').length}</div>
            <div className="stat-card-label">Settled</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">⏳</div>
            </div>
            <div className="stat-card-value">₹{totalPending.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Pending Payout</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">💰</div>
            </div>
            <div className="stat-card-value">₹{totalSettled.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Settled</div>
          </div>
        </div>

        {/* Settlement Cards */}
        {settlements.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '50px' }}>
              No settlements generated yet. Click "+ Generate Settlement" to create one.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {settlements.map((s) => {
              const totalDeductions = s.totalFuel + s.totalAdvances + s.totalMaint + s.totalTolls + s.totalOther

              return (
                <div key={s.id} className="card animate-in">
                  <div className="card-body" style={{ padding: '24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                          {s.owner.ownerName}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          📅 {new Date(s.periodStart).toLocaleDateString('en-IN')} — {new Date(s.periodEnd).toLocaleDateString('en-IN')} · {s.owner.vehicles.length} vehicles · {s.tripsCount} trips
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`badge ${s.status === 'SETTLED' ? 'active' : 'fuel'}`}>
                          {s.status === 'SETTLED' ? '✓ Settled' : '◷ Pending'}
                        </span>
                        {s.status === 'SETTLED' && s.settledAt && (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            {new Date(s.settledAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '14px',
                      padding: '18px',
                      background: 'rgba(255,255,255,.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      marginBottom: '16px',
                    }}>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Trip Revenue</p>
                        <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)', letterSpacing: '-0.02em' }}>
                          ₹{s.totalRevenue.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Fuel</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{s.totalFuel.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Advances</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{s.totalAdvances.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Maintenance</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{s.totalMaint.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tolls & Others</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{(s.totalTolls + s.totalOther).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Final Payout */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      background: s.finalPayout > 0 ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${s.finalPayout > 0 ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'}`,
                    }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                          FINAL PAYOUT
                        </p>
                        <p style={{
                          fontSize: '24px',
                          fontWeight: 800,
                          color: s.finalPayout > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                          letterSpacing: '-0.03em',
                        }}>
                          ₹{s.finalPayout.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {s.status === 'PENDING' && (
                          <MarkSettledButton settlementId={s.id} />
                        )}
                      </div>
                    </div>
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
