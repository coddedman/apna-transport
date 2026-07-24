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
        <div className="page-header-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportCSVButton data={csvData} filename="settlements_export" columns={csvColumns} />
          <GenerateSettlementButton owners={owners} />
        </div>
      </header>

      <div className="page-body">
        {/* Formula Banner */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formula:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', padding: '4px 10px', borderRadius: '6px' }}>
                  Owner Payout (Weight × Rate)
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>−</span>
                <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', padding: '4px 10px', borderRadius: '6px' }}>
                  Deductions (Fuel + Maint + Toll + Other)
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>−</span>
                <span style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)', padding: '4px 10px', borderRadius: '6px' }}>
                  Advances Paid
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>=</span>
                <span style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)', padding: '4px 10px', borderRadius: '6px', fontWeight: 800 }}>
                  Balance Due
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {settlements.map((s) => {
              const operationalDeductions = s.totalFuel + s.totalMaint + s.totalTolls + s.totalOther
              const netSettlement = s.totalRevenue - operationalDeductions
              const till = isTillDate(s)

              return (
                <div key={s.id} className="card animate-in" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="card-body" style={{ padding: '20px 24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', fontWeight: 800, color: '#f59e0b'
                        }}>
                          {s.owner.ownerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
                            {s.owner.ownerName}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            <span>📅 {till ? `All records till ${fmtDate(s.periodEnd)}` : `${fmtDate(s.periodStart)} — ${fmtDate(s.periodEnd)}`}</span>
                            <span>•</span>
                            <span>🚚 {s.owner.vehicles.length} {s.owner.vehicles.length === 1 ? 'vehicle' : 'vehicles'}</span>
                            <span>•</span>
                            <span>📦 {s.tripsCount} trips</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {till && (
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                            background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)'
                          }}>
                            Till Date
                          </span>
                        )}
                        <span className={`badge ${s.status === 'SETTLED' ? 'active' : 'fuel'}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                          {s.status === 'SETTLED' ? '✓ Settled' : '◷ Pending'}
                        </span>
                        {s.status === 'SETTLED' && s.settledAt && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{fmtDate(s.settledAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Financial breakdown Grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px',
                      marginBottom: '16px',
                    }}>
                      {/* Box 1: Owner Payout */}
                      <div style={{
                        padding: '14px 16px', background: 'rgba(245,158,11,0.04)',
                        borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.15)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}>
                        <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>
                          1. Owner Payout (Gross)
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#f59e0b', lineHeight: 1.1 }}>
                          {fmt(s.totalRevenue)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                          Weight × Rate
                        </div>
                      </div>

                      {/* Box 2: Deductions */}
                      <div style={{
                        padding: '14px 16px', background: 'rgba(239,68,68,0.04)',
                        borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.15)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}>
                        <div style={{ fontSize: '10px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>
                          2. Operational Deductions
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#ef4444', lineHeight: 1.1 }}>
                          −{fmt(operationalDeductions)}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          <span>Fuel {fmt(s.totalFuel)}</span> · <span>Maint {fmt(s.totalMaint)}</span> · <span>Toll {fmt(s.totalTolls)}</span> · <span>Other {fmt(s.totalOther)}</span>
                        </div>
                      </div>

                      {/* Box 3: Net Settlement */}
                      <div style={{
                        padding: '14px 16px', background: 'rgba(16,185,129,0.04)',
                        borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.15)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}>
                        <div style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>
                          3. Net Settlement
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', lineHeight: 1.1 }}>
                          {fmt(netSettlement)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                          Payout − Deductions
                        </div>
                      </div>

                      {/* Box 4: Advances Paid */}
                      <div style={{
                        padding: '14px 16px', background: 'rgba(249,115,22,0.04)',
                        borderRadius: 'var(--radius-md)', border: '1px solid rgba(249,115,22,0.15)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}>
                        <div style={{ fontSize: '10px', color: '#f97316', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>
                          4. Advances Paid
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#f97316', lineHeight: 1.1 }}>
                          −{fmt(s.totalAdvances)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                          All Cumulative Advances
                        </div>
                      </div>
                    </div>

                    {/* Balance Due + Actions Footer Bar */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px',
                      padding: '16px 20px',
                      background: s.finalPayout > 0 ? 'rgba(34,211,238,0.08)' : s.finalPayout < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${s.finalPayout > 0 ? 'rgba(34,211,238,0.25)' : s.finalPayout < 0 ? 'rgba(239,68,68,0.25)' : 'var(--color-border)'}`,
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                          {s.finalPayout > 0 ? 'Final Balance Due (Payable to Owner)' : s.finalPayout < 0 ? 'Overdrawn Balance (Owner Owes)' : 'Balance Settled'}
                        </div>
                        <div style={{
                          fontSize: '26px', fontWeight: 900, lineHeight: 1.1,
                          color: s.finalPayout > 0 ? '#22d3ee' : s.finalPayout < 0 ? '#ef4444' : 'var(--color-text-primary)',
                          letterSpacing: '-0.02em'
                        }}>
                          {fmt(s.finalPayout)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
