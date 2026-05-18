'use client'
import { useState } from 'react'
import { type AnalyticsData } from '@/lib/actions/analytics'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const card: React.CSSProperties = { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, marginBottom: 16 }

const EXP_TYPE_LABELS: Record<string, string> = {
  FUEL: '⛽ Fuel', DRIVER_ADVANCE: '👤 Driver Advance', OWNER_ADVANCE: '🏦 Owner Advance',
  MAINTENANCE: '🔧 Maintenance', TOLL: '🛣️ Toll', CASH_PAYMENT: '💵 Cash Payment',
}

function getWeekLabel(k: string) {
  const d = new Date(k); const e = new Date(k); e.setDate(d.getDate() + 6)
  return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })} – ${e.getDate()} ${e.toLocaleString('en-IN', { month: 'short' })}`
}

export default function SimulatorTab({
  data, deductibleTypes, setDeductibleTypes,
}: {
  data: AnalyticsData
  deductibleTypes: Set<string>
  setDeductibleTypes: (s: Set<string>) => void
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('__all__')
  const [projectionMode, setProjectionMode] = useState<'week' | 'month' | 'year'>('week')
  const [ownerPayoutTab, setOwnerPayoutTab] = useState<'weekly' | 'summary'>('weekly')

  const selectedProject = data.projectRates.find(p => p.projectId === selectedProjectId)

  const defaultCompanyRate = selectedProject
    ? selectedProject.partyRate
    : (data.totalWeight > 0 ? Math.round(data.totalRevenue / data.totalWeight) : 133)
  const defaultOwnerRate = selectedProject
    ? selectedProject.ownerRate
    : (data.totalWeight > 0 ? Math.round(data.ownerPayout / data.totalWeight) : 125)

  const [companyRate, setCompanyRate] = useState(defaultCompanyRate)
  const [ownerRate, setOwnerRate] = useState(defaultOwnerRate)

  // When project changes, update rates
  function handleProjectChange(pid: string) {
    setSelectedProjectId(pid)
    const proj = data.projectRates.find(p => p.projectId === pid)
    if (proj) {
      setCompanyRate(proj.partyRate || companyRate)
      setOwnerRate(proj.ownerRate || ownerRate)
    } else {
      setCompanyRate(data.totalWeight > 0 ? Math.round(data.totalRevenue / data.totalWeight) : 133)
      setOwnerRate(data.totalWeight > 0 ? Math.round(data.ownerPayout / data.totalWeight) : 125)
    }
  }

  const scope = selectedProject || {
    totalWeight: data.totalWeight,
    totalRevenue: data.totalRevenue,
    totalPayout: data.ownerPayout,
    trips: data.totalTrips,
  }

  const actualDeductions = data.expenseByType
    .filter(e => deductibleTypes.has(e.type.replace(/ /g, '_').toUpperCase()))
    .reduce((a, e) => a + e.amount, 0)
  const actualNonDeductExp = data.totalExpenses - actualDeductions

  const scenarioRevenue = scope.totalWeight * companyRate
  const scenarioPayout = scope.totalWeight * ownerRate
  const scenarioSettlement = scenarioPayout - actualDeductions
  const scenarioProfit = scenarioRevenue - scenarioSettlement - actualNonDeductExp
  const scenarioMargin = scenarioRevenue > 0 ? (scenarioProfit / scenarioRevenue) * 100 : 0
  const spread = companyRate - ownerRate

  // Projection multipliers
  const weeklyTrips = data.weeklyBreakdown.length > 0
    ? data.weeklyBreakdown.reduce((a, w) => a + w.trips, 0) / data.weeklyBreakdown.length
    : scope.trips / 4
  const avgWeightPerTrip = scope.trips > 0 ? scope.totalWeight / scope.trips : 20
  const mult = projectionMode === 'week' ? 1 : projectionMode === 'month' ? 4.3 : 52
  const projTrips = Math.round(weeklyTrips * mult)
  const projWeight = projTrips * avgWeightPerTrip
  const projRevenue = projWeight * companyRate
  const projPayout = projWeight * ownerRate
  const projProfit = (projRevenue - projPayout) * (scenarioProfit > 0 ? scenarioProfit / Math.max(scenarioRevenue - scenarioSettlement, 1) : 0.8)

  const allExpTypes = ['FUEL', 'MAINTENANCE', 'TOLL', 'DRIVER_ADVANCE', 'OWNER_ADVANCE', 'CASH_PAYMENT']

  const tabBtn = (v: string, cur: string, set: (s: any) => void, label: string) => (
    <button onClick={() => set(v)} style={{
      padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
      border: cur === v ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border)',
      background: cur === v ? 'rgba(245,158,11,0.08)' : 'transparent',
      color: cur === v ? '#f59e0b' : 'var(--color-text-muted)',
    }}>{label}</button>
  )

  return (
    <>
      {/* ── Project Selector ── */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          🧮 Rate Calculator & Projection
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>Scenario modelling · Per-project rates</span>
        </div>

        {/* Project filter */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            Select Project (auto-fills rates)
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => handleProjectChange('__all__')} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: selectedProjectId === '__all__' ? '1px solid #10b981' : '1px solid var(--color-border)',
              background: selectedProjectId === '__all__' ? 'rgba(16,185,129,0.08)' : 'transparent',
              color: selectedProjectId === '__all__' ? '#10b981' : 'var(--color-text-muted)',
            }}>All Projects</button>
            {data.projectRates.map(p => (
              <button key={p.projectId} onClick={() => handleProjectChange(p.projectId)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: selectedProjectId === p.projectId ? '1px solid #3b82f6' : '1px solid var(--color-border)',
                background: selectedProjectId === p.projectId ? 'rgba(59,130,246,0.08)' : 'transparent',
                color: selectedProjectId === p.projectId ? '#3b82f6' : 'var(--color-text-secondary)',
              }}>
                {p.projectName}
                <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6 }}>{p.trips}t</span>
              </button>
            ))}
          </div>
          {selectedProject && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
              Configured rates: Party ₹{selectedProject.partyRate}/MT · Owner ₹{selectedProject.ownerRate}/MT · {selectedProject.trips} trips · {selectedProject.totalWeight.toFixed(0)} MT
            </div>
          )}
        </div>

        {/* Rate inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>
          {/* Company Rate */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              🏢 Company Rate (₹/MT)
            </label>
            <input type="number" className="form-input" value={companyRate}
              onChange={e => setCompanyRate(parseFloat(e.target.value) || 0)}
              style={{ width: 110, fontSize: 16, fontWeight: 700, padding: '8px 12px', borderColor: '#10b981' }} min={0} step={1} />
            <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' as const }}>
              {[120, 125, 130, 133, 140, 150].map(r => (
                <button key={r} onClick={() => setCompanyRate(r)} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 5, border: 'none', cursor: 'pointer', background: companyRate === r ? '#10b981' : 'rgba(255,255,255,0.06)', color: companyRate === r ? '#fff' : 'var(--color-text-muted)' }}>₹{r}</button>
              ))}
            </div>
          </div>
          {/* Owner Rate */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              🚛 Owner Rate (₹/MT)
            </label>
            <input type="number" className="form-input" value={ownerRate}
              onChange={e => setOwnerRate(parseFloat(e.target.value) || 0)}
              style={{ width: 110, fontSize: 16, fontWeight: 700, padding: '8px 12px', borderColor: '#f59e0b' }} min={0} step={1} />
            <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' as const }}>
              {[110, 115, 120, 125, 130, 135].map(r => (
                <button key={r} onClick={() => setOwnerRate(r)} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 5, border: 'none', cursor: 'pointer', background: ownerRate === r ? '#f59e0b' : 'rgba(255,255,255,0.06)', color: ownerRate === r ? '#fff' : 'var(--color-text-muted)' }}>₹{r}</button>
              ))}
            </div>
          </div>
          {/* Deductibles */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Deduct from Owner Settlement
            </label>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {allExpTypes.map(type => {
                const isDeductible = deductibleTypes.has(type)
                const amt = data.expenseByType.find(e => e.type.replace(/ /g, '_').toUpperCase() === type)?.amount || 0
                return (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11 }}>
                    <input type="checkbox" checked={isDeductible} onChange={() => {
                      const next = new Set(deductibleTypes)
                      if (next.has(type)) next.delete(type); else next.add(type)
                      setDeductibleTypes(next)
                    }} style={{ width: 14, height: 14, accentColor: 'var(--color-accent)' }} />
                    <span style={{ color: isDeductible ? '#ef4444' : 'var(--color-text-secondary)', fontWeight: isDeductible ? 700 : 400 }}>{EXP_TYPE_LABELS[type] || type}</span>
                    {amt > 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: 10, marginLeft: 'auto' }}>{fmt(amt)}</span>}
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Spread indicator */}
        <div style={{ padding: '12px 16px', borderRadius: 10, background: spread > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${spread > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`, display: 'flex', gap: 24, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Rate Spread', val: `₹${spread}/MT`, color: spread > 0 ? '#10b981' : '#ef4444' },
            { label: 'Scenario Revenue', val: fmt(scenarioRevenue), color: '#10b981' },
            { label: 'Scenario Payout', val: fmt(scenarioPayout), color: '#f59e0b' },
            { label: 'Net Settlement', val: fmt(scenarioSettlement), color: '#8b5cf6' },
            { label: 'Scenario Profit', val: fmt(scenarioProfit), color: scenarioProfit >= 0 ? '#f59e0b' : '#ef4444' },
            { label: 'Margin', val: `${scenarioMargin.toFixed(1)}%`, color: scenarioMargin >= 15 ? '#10b981' : '#ef4444' },
          ].map(k => (
            <div key={k.label}>
              <div style={{ fontSize: 16, fontWeight: 900, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' as const, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Projection Card ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>📈 Projection (based on avg {Math.round(weeklyTrips)} trips/week · {avgWeightPerTrip.toFixed(0)} MT/trip)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {tabBtn('week', projectionMode, setProjectionMode, 'Weekly')}
            {tabBtn('month', projectionMode, setProjectionMode, 'Monthly')}
            {tabBtn('year', projectionMode, setProjectionMode, 'Yearly')}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[
            { label: `Est. Trips`, val: String(projTrips), color: '#3b82f6' },
            { label: `Est. Weight`, val: `${projWeight.toFixed(0)} MT`, color: '#8b5cf6' },
            { label: `Est. Revenue`, val: fmt(projRevenue), color: '#10b981' },
            { label: `Est. Payout`, val: fmt(projPayout), color: '#f59e0b' },
            { label: `Est. Profit`, val: fmt(projRevenue - projPayout), color: (projRevenue - projPayout) >= 0 ? '#f59e0b' : '#ef4444' },
          ].map(k => (
            <div key={k.label} style={{ textAlign: 'center', background: 'var(--color-bg-primary)', borderRadius: 10, padding: '12px 8px', border: `1px solid ${k.color}20` }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' as const, marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Owner Payout Tracker ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>💸 Owner Payout Tracker</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {tabBtn('weekly', ownerPayoutTab, setOwnerPayoutTab, 'By Week')}
            {tabBtn('summary', ownerPayoutTab, setOwnerPayoutTab, 'Summary')}
          </div>
        </div>

        {ownerPayoutTab === 'summary' && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Owner</th><th style={{ textAlign: 'right' }}>Trips</th><th style={{ textAlign: 'right' }}>Total Paid</th><th style={{ textAlign: 'right' }}>Avg/Trip</th></tr></thead>
              <tbody>
                {(() => {
                  const ownerTotals: Record<string, { name: string; trips: number; amount: number }> = {}
                  data.ownerPayoutByWeek.forEach(w => w.owners.forEach(o => {
                    if (!ownerTotals[o.ownerId]) ownerTotals[o.ownerId] = { name: o.ownerName, trips: 0, amount: 0 }
                    ownerTotals[o.ownerId].trips += o.trips
                    ownerTotals[o.ownerId].amount += o.amount
                  }))
                  const sorted = Object.values(ownerTotals).sort((a, b) => b.amount - a.amount)
                  return sorted.length === 0
                    ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>No payout data</td></tr>
                    : sorted.map((o, i) => (
                      <tr key={i}>
                        <td><strong>{o.name}</strong></td>
                        <td style={{ textAlign: 'right' }}><span style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{o.trips}</span></td>
                        <td style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>{fmt(o.amount)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{o.trips > 0 ? fmt(o.amount / o.trips) : '—'}</td>
                      </tr>
                    ))
                })()}
              </tbody>
            </table>
          </div>
        )}

        {ownerPayoutTab === 'weekly' && (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {data.ownerPayoutByWeek.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No weekly payout data</div>
              : [...data.ownerPayoutByWeek].sort((a, b) => a.weekKey.localeCompare(b.weekKey)).map(w => (
                <div key={w.weekKey} style={{ marginBottom: 12, background: 'var(--color-bg-primary)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{getWeekLabel(w.weekKey)}</span>
                    <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>{fmt(w.owners.reduce((a, o) => a + o.amount, 0))} total</span>
                  </div>
                  {w.owners.map((o, i) => {
                    const total = w.owners.reduce((a, x) => a + x.amount, 0)
                    const pct = total > 0 ? (o.amount / total) * 100 : 0
                    return (
                      <div key={i} style={{ padding: '8px 14px', borderBottom: i < w.owners.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{o.ownerName}</span>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{o.trips} trips</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt(o.amount)}</span>
                          </div>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 4 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* ── Weekly P&L ── */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>📅 Weekly Settlement — Scenario Projection</div>
        {data.weeklyBreakdown.length === 0
          ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No weekly data for this period</div>
          : <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week</th><th style={{ textAlign: 'right' }}>Trips</th><th style={{ textAlign: 'right' }}>Weight</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th><th style={{ textAlign: 'right' }}>Payout</th>
                  <th style={{ textAlign: 'right' }}>Deductions</th><th style={{ textAlign: 'right' }}>Net Settlement</th>
                  <th style={{ textAlign: 'right' }}>Spread</th>
                </tr>
              </thead>
              <tbody>
                {[...data.weeklyBreakdown].sort((a, b) => a.weekKey.localeCompare(b.weekKey)).map(w => {
                  const wDeductions = Object.entries(w.expByType).filter(([t]) => deductibleTypes.has(t)).reduce((a, [, v]) => a + v, 0)
                  const wTotalExp = Object.values(w.expByType).reduce((a, v) => a + v, 0)
                  const wRev = w.weight * companyRate
                  const wPayout = w.weight * ownerRate
                  const wSettlement = wPayout - wDeductions
                  const wMyExp = wTotalExp - wDeductions
                  const wNet = (wRev - wSettlement) - wMyExp
                  return (
                    <tr key={w.weekKey}>
                      <td style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{getWeekLabel(w.weekKey)}</td>
                      <td style={{ textAlign: 'right' }}><span style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{w.trips}</span></td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>{w.weight.toFixed(1)} MT</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmt(wRev)}</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: 12 }}>{fmt(wPayout)}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontSize: 12 }}>{wDeductions > 0 ? fmt(wDeductions) : '—'}</td>
                      <td style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 700 }}>{fmt(wSettlement)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: wNet >= 0 ? '#f59e0b' : '#ef4444' }}>{fmt(wNet)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
      </div>
    </>
  )
}
