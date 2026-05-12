import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import GenerateSettlementButton from '@/components/GenerateSettlementButton'
import MarkSettledButton from '@/components/MarkSettledButton'
import ExportCSVButton from '@/components/ExportCSVButton'
import SettlementActions from '@/components/SettlementActions'

export const metadata = {
  title: 'Settlements — Hyva Transport',
  description: 'Owner reconciliation and payout generation',
}

export default async function SettlementsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const owners = await prisma.owner.findMany({
    where: { transporterId },
    select: { id: true, ownerName: true },
    orderBy: { ownerName: 'asc' }
  })

  const settlements = await prisma.settlement.findMany({
    where: { owner: { transporterId } },
    include: { owner: { select: { ownerName: true, vehicles: { select: { id: true } } } } },
    orderBy: { createdAt: 'desc' }
  })

  const totalPending = settlements.filter(s => s.status === 'PENDING').reduce((a, s) => a + s.finalPayout, 0)
  const totalSettled = settlements.filter(s => s.status === 'SETTLED').reduce((a, s) => a + s.finalPayout, 0)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  const csvData = settlements.map(s => ({
    owner: s.owner.ownerName,
    period: isTillDate(s) ? `Till ${fmtDate(s.periodEnd)}` : `${fmtDate(s.periodStart)} — ${fmtDate(s.periodEnd)}`,
    trips: s.tripsCount,
    ownerPayout: s.totalRevenue,
    fuel: s.totalFuel,
    advances: s.totalAdvances,
    maintenance: s.totalMaint,
    tolls: s.totalTolls,
    other: s.totalOther,
    balanceDue: s.finalPayout,
    status: s.status,
  }))

  const csvColumns = [
    { key: 'owner', label: 'Owner' },
    { key: 'period', label: 'Period' },
    { key: 'trips', label: 'Trips' },
    { key: 'ownerPayout', label: 'Owner Payout (₹)' },
    { key: 'fuel', label: 'Fuel (₹)' },
    { key: 'advances', label: 'Advances Paid (₹)' },
    { key: 'maintenance', label: 'Maintenance (₹)' },
    { key: 'tolls', label: 'Tolls (₹)' },
    { key: 'other', label: 'Other (₹)' },
    { key: 'balanceDue', label: 'Balance Due (₹)' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Settlements</h1>
            <p className="page-subtitle">Owner reconciliation and payout records</p>
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
                background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)',
                padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px',
                color: 'var(--color-accent)', fontWeight: 600, fontFamily: 'var(--font-mono)',
              }}>
                Balance Due = Σ(Weight × Owner Rate) − Σ(Fuel + Toll + Maintenance + Other) − Σ(All Advances Paid)
              </code>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card accent">
            <div className="stat-card-header"><div className="stat-card-icon accent">📋</div></div>
            <div className="stat-card-value">{settlements.length}</div>
            <div className="stat-card-label">Total Settlements</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header"><div className="stat-card-icon success">✅</div></div>
            <div className="stat-card-value">{settlements.filter(s => s.status === 'SETTLED').length}</div>
            <div className="stat-card-label">Settled</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header"><div className="stat-card-icon purple">⏳</div></div>
            <div className="stat-card-value">{fmt(totalPending)}</div>
            <div className="stat-card-label">Pending Balance</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header"><div className="stat-card-icon info">💰</div></div>
            <div className="stat-card-value">{fmt(totalSettled)}</div>
            <div className="stat-card-label">Total Settled</div>
          </div>
        </div>

        {/* Settlement Cards */}
        {settlements.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '50px' }}>
              No settlements generated yet. Click &quot;+ Generate Settlement&quot; to create one.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            {settlements.map((s) => {
              const operationalDeductions = s.totalFuel + s.totalMaint + s.totalTolls + s.totalOther
              const till = isTillDate(s)

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
                          📅 {till ? `All records till ${fmtDate(s.periodEnd)}` : `${fmtDate(s.periodStart)} — ${fmtDate(s.periodEnd)}`} · {s.owner.vehicles.length} vehicles · {s.tripsCount} trips
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {till && <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>Till Date</span>}
                        <span className={`badge ${s.status === 'SETTLED' ? 'active' : 'fuel'}`}>
                          {s.status === 'SETTLED' ? '✓ Settled' : '◷ Pending'}
                        </span>
                        {s.status === 'SETTLED' && s.settledAt && (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{fmtDate(s.settledAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Financial breakdown */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                      padding: '16px 20px', background: 'rgba(255,255,255,.02)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '12px',
                    }}>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700 }}>Owner Payout</p>
                        <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-accent)' }}>{fmt(s.totalRevenue)}</p>
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>−</span>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700 }}>Deductions</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>{fmt(operationalDeductions)}</p>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          Fuel {fmt(s.totalFuel)} · Maint {fmt(s.totalMaint)} · Toll {fmt(s.totalTolls)} · Other {fmt(s.totalOther)}
                        </p>
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>=</span>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700 }}>Net</p>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-success)' }}>{fmt(s.totalRevenue - operationalDeductions)}</p>
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>−</span>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700 }}>Advances Paid</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#f97316' }}>{fmt(s.totalAdvances)}</p>
                      </div>
                    </div>

                    {/* Balance Due + Actions */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 18px',
                      background: s.finalPayout > 0 ? 'rgba(34,211,238,.06)' : 'rgba(239,68,68,.06)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${s.finalPayout > 0 ? 'rgba(34,211,238,.15)' : 'rgba(239,68,68,.15)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '2px', textTransform: 'uppercase' }}>Balance Due</p>
                          <p style={{ fontSize: '24px', fontWeight: 900, color: s.finalPayout > 0 ? '#22d3ee' : 'var(--color-danger)', letterSpacing: '-0.03em' }}>
                            {fmt(s.finalPayout)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {s.status === 'PENDING' && <MarkSettledButton settlementId={s.id} />}
                        <SettlementActions settlement={JSON.parse(JSON.stringify(s))} />
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

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isTillDate(s: { periodStart: Date }) {
  return new Date(s.periodStart).getFullYear() <= 2000
}
