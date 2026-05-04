'use client'
import { useState } from 'react'

const EXP_COLORS: Record<string, string> = {
  FUEL: '#f59e0b', DRIVER_ADVANCE: '#3b82f6', OWNER_ADVANCE: '#8b5cf6',
  MAINTENANCE: '#ec4899', TOLL: '#10b981', CASH_PAYMENT: '#ef4444',
}
const EXP_ICONS: Record<string, string> = {
  FUEL: '⛽', DRIVER_ADVANCE: '👤', OWNER_ADVANCE: '🏦',
  MAINTENANCE: '🔧', TOLL: '🛣️', CASH_PAYMENT: '💵',
}

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const getWeekKey = (iso: string) => { const d = new Date(iso); const s = new Date(d); s.setDate(d.getDate() - d.getDay()); return s.toISOString().split('T')[0] }
const getWeekLabel = (k: string) => { const d = new Date(k); const e = new Date(k); e.setDate(d.getDate() + 6); return `${d.getDate()} ${d.toLocaleString('en-IN',{month:'short'})} – ${e.getDate()} ${e.toLocaleString('en-IN',{month:'short'})}` }

function Bar({ value, max, color = '#f59e0b', height = 6 }: { value: number; max: number; color?: string; height?: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', height }}>
      <div style={{ height: '100%', width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0}%`, background: color, borderRadius: 100, transition: 'width .5s' }} />
    </div>
  )
}

type Tab = 'overview' | 'weekly' | 'trips' | 'expenses' | 'projects'

export default function VehicleDetailClient({ data }: { data: any }) {
  const [tab, setTab] = useState<Tab>('overview')

  const trips = data.trips
  const expenses = data.expenses

  // Core totals
  const totalTrips = trips.length
  const totalRevenue = trips.reduce((a: number, t: any) => a + t.partyFreightAmount, 0)
  const totalOwnerRevenue = trips.reduce((a: number, t: any) => a + t.ownerFreightAmount, 0)
  const totalWeight = trips.reduce((a: number, t: any) => a + t.weight, 0)
  const totalExpenses = expenses.reduce((a: number, e: any) => a + e.amount, 0)
  const profit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0.0'
  const avgRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0
  const avgWeightPerTrip = totalTrips > 0 ? totalWeight / totalTrips : 0

  // Expense by type
  const expByType: Record<string, number> = {}
  expenses.forEach((e: any) => { expByType[e.type] = (expByType[e.type] || 0) + e.amount })
  const fuel = expByType['FUEL'] || 0
  const maintenance = expByType['MAINTENANCE'] || 0
  const toll = expByType['TOLL'] || 0
  const driverAdvance = expByType['DRIVER_ADVANCE'] || 0
  const maxExpType = Math.max(...Object.values(expByType) as number[], 1)

  // Project breakdown
  const projMap: Record<string, { name: string; trips: number; revenue: number; weight: number; expenses: number }> = {}
  trips.forEach((t: any) => {
    const k = t.project.projectName
    if (!projMap[k]) projMap[k] = { name: k, trips: 0, revenue: 0, weight: 0, expenses: 0 }
    projMap[k].trips += 1; projMap[k].revenue += t.partyFreightAmount; projMap[k].weight += t.weight
  })
  expenses.forEach((e: any) => {
    // expenses don't have project in this data shape so put in general
  })
  const projList = Object.values(projMap).sort((a, b) => b.revenue - a.revenue)
  const maxProjRev = Math.max(...projList.map(p => p.revenue), 1)

  // Weekly breakdown
  const weekMap: Record<string, { trips: number; revenue: number; weight: number; fuel: number; expenses: number }> = {}
  trips.forEach((t: any) => {
    const k = getWeekKey(t.date)
    if (!weekMap[k]) weekMap[k] = { trips: 0, revenue: 0, weight: 0, fuel: 0, expenses: 0 }
    weekMap[k].trips += 1; weekMap[k].revenue += t.partyFreightAmount; weekMap[k].weight += t.weight
  })
  expenses.forEach((e: any) => {
    const k = getWeekKey(e.date)
    if (!weekMap[k]) weekMap[k] = { trips: 0, revenue: 0, weight: 0, fuel: 0, expenses: 0 }
    weekMap[k].expenses += e.amount
    if (e.type === 'FUEL') weekMap[k].fuel += e.amount
  })
  const weekRows = Object.entries(weekMap).sort((a, b) => b[0].localeCompare(a[0]))
  const maxWeekRev = Math.max(...weekRows.map(([, v]) => v.revenue), 1)

  // Last trip / idle detection
  const lastTrip = trips[0]
  const daysSinceLast = lastTrip ? Math.floor((Date.now() - new Date(lastTrip.date).getTime()) / 86400000) : null
  const isIdle = daysSinceLast !== null && daysSinceLast > 7

  const TABS = [
    { key: 'overview' as Tab, label: '📊 Overview' },
    { key: 'weekly' as Tab, label: `📅 Weekly (${weekRows.length})` },
    { key: 'trips' as Tab, label: `🛣️ Trips (${totalTrips})` },
    { key: 'expenses' as Tab, label: `📉 Expenses (${expenses.length})` },
    { key: 'projects' as Tab, label: `📁 Projects (${projList.length})` },
  ]

  const tabBtn = (k: Tab) => ({
    padding: '8px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px',
    border: 'none', cursor: 'pointer', transition: 'all .15s',
    background: tab === k ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
    color: tab === k ? '#000' : 'var(--color-text-secondary)',
  } as React.CSSProperties)

  const card = { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' } as React.CSSProperties

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: '12px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🚛</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{data.plateNo}</h1>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: isIdle ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: isIdle ? '#ef4444' : '#10b981' }}>
              {isIdle ? `⚠ Idle ${daysSinceLast}d` : '● Active'}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: 3 }}>
            👤 <a href={`/dashboard/owners/${data.ownerId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>{data.ownerName}</a>
            {data.currentProject && <> · 📁 {data.currentProject}</>}
            {daysSinceLast !== null && <> · Last trip {daysSinceLast === 0 ? 'today' : `${daysSinceLast}d ago`}</>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t.key} style={tabBtn(t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Trips', value: String(totalTrips), color: '#3b82f6', icon: '🛣️' },
              { label: 'Weight Moved', value: `${totalWeight.toFixed(1)} MT`, color: '#8b5cf6', icon: '⚖️' },
              { label: 'Revenue', value: fmt(totalRevenue), color: '#10b981', icon: '💰' },
              { label: 'Expenses', value: fmt(totalExpenses), color: '#ef4444', icon: '📉' },
              { label: 'Net Profit', value: fmt(profit), color: profit >= 0 ? '#f59e0b' : '#ef4444', icon: '📊' },
              { label: 'Profit Margin', value: `${profitMargin}%`, color: parseFloat(profitMargin) >= 30 ? '#10b981' : '#f59e0b', icon: '📈' },
            ].map(k => (
              <div key={k.label} style={{ ...card, borderLeft: `3px solid ${k.color}`, padding: '14px 16px' }}>
                <div style={{ fontSize: '16px', marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Efficiency metrics */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>⚡ Efficiency Metrics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {[
                { label: 'Avg Revenue/Trip', value: fmt(avgRevenuePerTrip), color: '#10b981' },
                { label: 'Avg Weight/Trip', value: `${avgWeightPerTrip.toFixed(1)} MT`, color: '#8b5cf6' },
                { label: 'Fuel/Trip', value: totalTrips > 0 && fuel > 0 ? fmt(fuel / totalTrips) : '—', color: '#f59e0b' },
                { label: 'Fuel/MT', value: totalWeight > 0 && fuel > 0 ? fmt(fuel / totalWeight) : '—', color: '#f59e0b' },
                { label: 'Total Exp/Trip', value: totalTrips > 0 && totalExpenses > 0 ? fmt(totalExpenses / totalTrips) : '—', color: '#ef4444' },
                { label: 'Revenue/MT', value: totalWeight > 0 ? fmt(totalRevenue / totalWeight) : '—', color: '#3b82f6' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense breakdown */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>📉 Expense Breakdown by Category</div>
            {Object.keys(expByType).length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No expenses recorded</div>
            ) : Object.entries(expByType).sort(([,a],[,b]) => (b as number)-(a as number)).map(([type, amt]) => (
              <div key={type} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {EXP_ICONS[type] || '💸'} {type.replace(/_/g, ' ')}
                  </span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>{totalExpenses > 0 ? `${Math.round(((amt as number)/totalExpenses)*100)}%` : ''}</span>
                    <span style={{ fontWeight: 700, color: EXP_COLORS[type] || '#64748b' }}>{fmt(amt as number)}</span>
                  </div>
                </div>
                <Bar value={amt as number} max={maxExpType} color={EXP_COLORS[type] || '#64748b'} height={7} />
              </div>
            ))}
            {totalExpenses > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4, borderTop: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 700 }}>
                <span style={{ color: 'var(--color-text-primary)' }}>Total</span>
                <span style={{ color: '#ef4444' }}>{fmt(totalExpenses)}</span>
              </div>
            )}
          </div>

          {/* Financial waterfall */}
          <div style={card}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>💹 Financial Summary</div>
            {[
              { label: 'Gross Revenue (party rate)', value: totalRevenue, color: '#10b981', sign: '' },
              { label: 'Owner Revenue (owner rate)', value: totalOwnerRevenue, color: '#3b82f6', sign: '' },
              { label: '⛽ Fuel', value: fuel, color: '#f59e0b', sign: '−' },
              { label: '🔧 Maintenance', value: maintenance, color: '#ec4899', sign: '−' },
              { label: '🛣️ Toll', value: toll, color: '#10b981', sign: '−' },
              { label: '👤 Driver Advance', value: driverAdvance, color: '#3b82f6', sign: '−' },
            ].filter(r => r.value > 0).map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', width: '180px', flexShrink: 0 }}>{row.label}</span>
                <Bar value={row.value} max={Math.max(totalRevenue, totalOwnerRevenue, 1)} color={row.color} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: row.color, width: '90px', textAlign: 'right', flexShrink: 0 }}>{row.sign}{fmt(row.value)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Net Profit</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: profit >= 0 ? '#f59e0b' : '#ef4444' }}>{fmt(profit)}</span>
            </div>
          </div>
        </>
      )}

      {/* ── WEEKLY ── */}
      {tab === 'weekly' && (
        <div style={card}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 16 }}>📅 Week-by-Week Performance — {data.plateNo}</div>
          {weekRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No data</div>
          ) : (
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
                    <th style={{ width: '100px' }}>Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {weekRows.map(([key, w]) => {
                    const net = w.revenue - w.expenses
                    return (
                      <tr key={key}>
                        <td style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{getWeekLabel(key)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>{w.trips}</span>
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
          )}
        </div>
      )}

      {/* ── TRIPS ── */}
      {tab === 'trips' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>🛣️ Complete Trip Log</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{totalTrips} trips · {totalWeight.toFixed(1)} MT · {fmt(totalRevenue)}</div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Invoice / LR</th>
                  <th style={{ textAlign: 'right' }}>Weight (MT)</th>
                  <th style={{ textAlign: 'right' }}>Party Rate</th>
                  <th style={{ textAlign: 'right' }}>Owner Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No trips yet</td></tr>}
                {trips.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t.project.projectName}</td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {t.invoiceNo && <div>Inv: {t.invoiceNo}</div>}
                      {t.lrNo && <div>LR: {t.lrNo}</div>}
                      {!t.invoiceNo && !t.lrNo && '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '12px' }}>{t.weight}</td>
                    <td style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)' }}>₹{t.partyRate}/MT</td>
                    <td style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)' }}>₹{t.ownerRate}/MT</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{fmt(t.partyFreightAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {tab === 'expenses' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>📉 Expense Log</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{expenses.length} entries · {fmt(totalExpenses)}</div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No expenses yet</td></tr>}
                {expenses.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 700, background: `${EXP_COLORS[e.type]||'#64748b'}18`, color: EXP_COLORS[e.type]||'#64748b', padding: '3px 10px', borderRadius: 20 }}>
                        {EXP_ICONS[e.type]||'💸'} {e.type.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{e.remarks || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: EXP_COLORS[e.type]||'#64748b' }}>{fmt(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PROJECTS ── */}
      {tab === 'projects' && (
        <div>
          {projList.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>No project data</div>
          ) : projList.map((p, i) => (
            <div key={i} style={{ ...card, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>📁 {p.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>{p.trips} trips · {p.weight.toFixed(1)} MT · avg {p.trips > 0 ? fmt(p.revenue/p.trips) : '—'}/trip</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{fmt(p.revenue)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{maxProjRev > 0 ? `${Math.round((p.revenue/maxProjRev)*100)}% of top` : ''}</div>
                </div>
              </div>
              <Bar value={p.revenue} max={maxProjRev} color="var(--color-accent)" height={8} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
