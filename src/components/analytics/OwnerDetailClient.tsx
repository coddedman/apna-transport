'use client'
import { useState } from 'react'

const EXP_COLORS: Record<string, string> = {
  FUEL: '#f59e0b', DRIVER_ADVANCE: '#3b82f6', OWNER_ADVANCE: '#8b5cf6',
  MAINTENANCE: '#ec4899', TOLL: '#10b981', CASH_PAYMENT: '#ef4444',
}

function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}` }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
function getWeekKey(iso: string) {
  const d = new Date(iso)
  const start = new Date(d); start.setDate(d.getDate() - d.getDay())
  return start.toISOString().split('T')[0]
}
function getWeekLabel(key: string) {
  const d = new Date(key)
  const end = new Date(key); end.setDate(d.getDate() + 6)
  return `${d.getDate()} ${d.toLocaleString('en-IN',{month:'short'})} – ${end.getDate()} ${end.toLocaleString('en-IN',{month:'short'})}`
}

function Bar({ value, max, color = '#f59e0b', height = 6 }: { value: number; max: number; color?: string; height?: number }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', height }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width .5s ease' }} />
    </div>
  )
}

type Tab = 'overview' | 'weekly' | 'trips' | 'expenses'

export default function OwnerDetailClient({ data }: { data: any }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const [selectedWeekVehicle, setSelectedWeekVehicle] = useState<string>(data.vehicles[0]?.id || '')

  // ── Aggregates ──
  const vehicles = data.vehicles
  const allTrips = vehicles.flatMap((v: any) => v.trips.map((t: any) => ({ ...t, plateNo: v.plateNo, vehicleId: v.id })))
  const allExpenses = vehicles.flatMap((v: any) => v.expenses.map((e: any) => ({ ...e, plateNo: v.plateNo, vehicleId: v.id })))

  const filteredTrips = selectedVehicle === 'all' ? allTrips : allTrips.filter((t: any) => t.vehicleId === selectedVehicle)
  const filteredExpenses = selectedVehicle === 'all' ? allExpenses : allExpenses.filter((e: any) => e.vehicleId === selectedVehicle)

  const totalRev = filteredTrips.reduce((a: number, t: any) => a + t.partyFreightAmount, 0)
  const totalExp = filteredExpenses.reduce((a: number, e: any) => a + e.amount, 0)
  const totalWeight = filteredTrips.reduce((a: number, t: any) => a + t.weight, 0)
  const totalAdvances = data.advances.reduce((a: number, x: any) => a + x.amount, 0)
  const settledAmount = data.settlements.filter((s: any) => s.status === 'SETTLED').reduce((a: number, s: any) => a + s.finalPayout, 0)
  const netPayable = totalRev - totalExp - totalAdvances

  // ── Per-vehicle stats ──
  const vehicleStats = vehicles.map((v: any) => {
    const rev = v.trips.reduce((a: number, t: any) => a + t.partyFreightAmount, 0)
    const exp = v.expenses.reduce((a: number, e: any) => a + e.amount, 0)
    const fuel = v.expenses.filter((e: any) => e.type === 'FUEL').reduce((a: number, e: any) => a + e.amount, 0)
    const wt = v.trips.reduce((a: number, t: any) => a + t.weight, 0)
    return { ...v, rev, exp, fuel, wt, net: rev - exp, trips: v.trips.length }
  }).sort((a: any, b: any) => b.rev - a.rev)

  const maxRev = Math.max(...vehicleStats.map((v: any) => v.rev), 1)

  // ── Expense by type ──
  const expByType: Record<string, number> = {}
  filteredExpenses.forEach((e: any) => { expByType[e.type] = (expByType[e.type] || 0) + e.amount })
  const maxExpType = Math.max(...Object.values(expByType) as number[], 1)

  // ── Weekly breakdown for selected vehicle ──
  const weeklyVehicle = vehicles.find((v: any) => v.id === selectedWeekVehicle)
  const weekMap: Record<string, { trips: number; revenue: number; weight: number; fuel: number; expenses: number }> = {}
  weeklyVehicle?.trips.forEach((t: any) => {
    const k = getWeekKey(t.date)
    if (!weekMap[k]) weekMap[k] = { trips: 0, revenue: 0, weight: 0, fuel: 0, expenses: 0 }
    weekMap[k].trips += 1; weekMap[k].revenue += t.partyFreightAmount; weekMap[k].weight += t.weight
  })
  weeklyVehicle?.expenses.forEach((e: any) => {
    const k = getWeekKey(e.date)
    if (!weekMap[k]) weekMap[k] = { trips: 0, revenue: 0, weight: 0, fuel: 0, expenses: 0 }
    weekMap[k].expenses += e.amount
    if (e.type === 'FUEL') weekMap[k].fuel += e.amount
  })
  const weekRows = Object.entries(weekMap).sort((a, b) => b[0].localeCompare(a[0]))
  const maxWeekRev = Math.max(...weekRows.map(([, v]) => v.revenue), 1)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'weekly', label: '📅 Weekly Breakdown' },
    { key: 'trips', label: `🛣️ All Trips (${allTrips.length})` },
    { key: 'expenses', label: `📉 All Expenses (${allExpenses.length})` },
  ]

  const tabBtn = (k: Tab) => ({
    padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px',
    border: 'none', cursor: 'pointer', transition: 'all .15s',
    background: tab === k ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
    color: tab === k ? '#000' : 'var(--color-text-secondary)',
  } as React.CSSProperties)

  const card = { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' } as React.CSSProperties

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(139,92,246,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#8b5cf6', flexShrink: 0 }}>
          {data.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{data.name}</h1>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: 2 }}>📱 {data.phone} · {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</div>
        </div>
        {/* Vehicle filter pill */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedVehicle('all')} style={{ ...tabBtn(tab), background: selectedVehicle === 'all' ? '#8b5cf6' : 'rgba(255,255,255,0.06)', color: selectedVehicle === 'all' ? '#fff' : 'var(--color-text-muted)', fontSize: '11px', padding: '5px 12px' }}>All Vehicles</button>
          {vehicles.map((v: any) => (
            <button key={v.id} onClick={() => setSelectedVehicle(v.id)} style={{ ...tabBtn(tab), background: selectedVehicle === v.id ? '#8b5cf6' : 'rgba(255,255,255,0.06)', color: selectedVehicle === v.id ? '#fff' : 'var(--color-text-muted)', fontSize: '11px', padding: '5px 12px' }}>{v.plateNo}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t.key} style={tabBtn(t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === 'overview' && (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Revenue', value: fmt(totalRev), sub: `${filteredTrips.length} trips`, color: '#10b981' },
              { label: 'Expenses', value: fmt(totalExp), sub: 'vehicle costs', color: '#ef4444' },
              { label: 'Net Payable', value: fmt(Math.abs(netPayable)), sub: netPayable >= 0 ? 'owed to owner' : 'over-advanced', color: netPayable >= 0 ? '#f59e0b' : '#ef4444' },
              { label: 'Weight Moved', value: `${totalWeight.toFixed(1)} MT`, sub: filteredTrips.length > 0 ? `${(totalWeight / filteredTrips.length).toFixed(1)} MT/trip` : '—', color: '#3b82f6' },
              { label: 'Advances', value: fmt(totalAdvances), sub: `${data.advances.length} given`, color: '#8b5cf6' },
              { label: 'Settled', value: fmt(settledAmount), sub: totalRev > 0 ? `${Math.round((settledAmount / totalRev) * 100)}% of revenue` : '—', color: '#10b981' },
            ].map(k => (
              <div key={k.label} style={{ ...card, borderLeft: `3px solid ${k.color}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{k.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Per-vehicle bars */}
            <div style={card}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>🚛 Vehicle Performance</div>
              {vehicleStats.map((v: any) => (
                <div key={v.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{v.plateNo}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{v.trips} trips · {v.wt.toFixed(1)} MT</span>
                  </div>
                  <div style={{ marginBottom: 3 }}><Bar value={v.rev} max={maxRev} color="#10b981" height={7} /></div>
                  <div style={{ marginBottom: 3 }}><Bar value={v.exp} max={maxRev} color="#ef4444" height={5} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: 3 }}>
                    <span style={{ color: '#10b981' }}>{fmt(v.rev)}</span>
                    <span style={{ color: '#ef4444' }}>−{fmt(v.exp)}</span>
                    <span style={{ color: v.net >= 0 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>Net: {fmt(v.net)}</span>
                  </div>
                </div>
              ))}
              {vehicleStats.length === 0 && <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No vehicles</div>}
            </div>

            {/* Expense breakdown */}
            <div style={card}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>📉 Expense Breakdown</div>
              {Object.entries(expByType).sort(([, a], [, b]) => (b as number) - (a as number)).map(([type, amt]) => (
                <div key={type} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: EXP_COLORS[type] || '#64748b', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{type.replace('_', ' ')}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: EXP_COLORS[type] || '#64748b' }}>{fmt(amt as number)}</span>
                  </div>
                  <Bar value={amt as number} max={maxExpType} color={EXP_COLORS[type] || '#64748b'} height={6} />
                </div>
              ))}
              {Object.keys(expByType).length === 0 && <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No expenses recorded</div>}
            </div>
          </div>

          {/* Fuel spotlight */}
          {vehicleStats.some((v: any) => v.fuel > 0) && (
            <div style={card}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>⛽ Fuel Consumption per Vehicle</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {vehicleStats.filter((v: any) => v.fuel > 0).map((v: any) => (
                  <div key={v.id} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6 }}>🚛 {v.plateNo}</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{fmt(v.fuel)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {v.trips > 0 ? `${fmt(Math.round(v.fuel / v.trips))}/trip` : '—'}
                      {v.wt > 0 ? ` · ${fmt(Math.round(v.fuel / v.wt))}/MT` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ WEEKLY ══ */}
      {tab === 'weekly' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {vehicles.map((v: any) => (
              <button key={v.id} onClick={() => setSelectedWeekVehicle(v.id)} style={{ ...tabBtn('overview'), background: selectedWeekVehicle === v.id ? '#f59e0b' : 'rgba(255,255,255,0.06)', color: selectedWeekVehicle === v.id ? '#000' : 'var(--color-text-muted)', fontSize: '12px', padding: '6px 14px' }}>{v.plateNo}</button>
            ))}
          </div>
          {weekRows.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>No data for this vehicle</div>
          ) : (
            <div style={card}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>
                Weekly breakdown — {weeklyVehicle?.plateNo}
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th style={{ textAlign: 'right' }}>Trips</th>
                      <th style={{ textAlign: 'right' }}>Weight (MT)</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'right' }}>⛽ Fuel</th>
                      <th style={{ textAlign: 'right' }}>Total Exp</th>
                      <th style={{ textAlign: 'right' }}>Net</th>
                      <th style={{ width: '120px' }}>Rev Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekRows.map(([key, w]) => {
                      const net = w.revenue - w.expenses
                      return (
                        <tr key={key}>
                          <td style={{ fontSize: '12px', fontWeight: 600 }}>{getWeekLabel(key)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ background: 'rgba(59,130,246,.1)', color: 'var(--color-info)', borderRadius: 20, padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>{w.trips}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '12px' }}>{w.weight.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{fmt(w.revenue)}</td>
                          <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '12px' }}>{w.fuel > 0 ? fmt(w.fuel) : '—'}</td>
                          <td style={{ textAlign: 'right', color: '#ef4444', fontSize: '12px' }}>{w.expenses > 0 ? fmt(w.expenses) : '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: net >= 0 ? '#f59e0b' : '#ef4444' }}>{fmt(net)}</td>
                          <td><Bar value={w.revenue} max={maxWeekRev} color="#10b981" height={8} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ ALL TRIPS ══ */}
      {tab === 'trips' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Complete Trip Log</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{filteredTrips.length} trips · {filteredTrips.reduce((a: number, t: any) => a + t.weight, 0).toFixed(1)} MT · {fmt(filteredTrips.reduce((a: number, t: any) => a + t.partyFreightAmount, 0))}</div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Project</th>
                  <th>Invoice / LR</th>
                  <th style={{ textAlign: 'right' }}>Weight (MT)</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No trips found</td></tr>}
                {filteredTrips.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                    <td><strong style={{ fontSize: '12px' }}>{t.plateNo}</strong></td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t.project.projectName}</td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {t.invoiceNo && <div>Inv: {t.invoiceNo}</div>}
                      {t.lrNo && <div>LR: {t.lrNo}</div>}
                      {!t.invoiceNo && !t.lrNo && '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '12px' }}>{t.weight}</td>
                    <td style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)' }}>₹{t.partyRate}/MT</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{fmt(t.partyFreightAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ ALL EXPENSES ══ */}
      {tab === 'expenses' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Complete Expense Log</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{filteredExpenses.length} entries · {fmt(filteredExpenses.reduce((a: number, e: any) => a + e.amount, 0))}</div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No expenses found</td></tr>}
                {filteredExpenses.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                    <td><strong style={{ fontSize: '12px' }}>{e.plateNo}</strong></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 700, background: `${EXP_COLORS[e.type] || '#64748b'}18`, color: EXP_COLORS[e.type] || '#64748b', padding: '3px 10px', borderRadius: 20 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: EXP_COLORS[e.type] || '#64748b', flexShrink: 0 }} />
                        {e.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{e.remarks || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: EXP_COLORS[e.type] || '#64748b' }}>{fmt(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
