'use client'

import { useState, useEffect } from 'react'
import { fetchProjectRateData, type ProjectRateData } from '@/lib/actions/projectRates'
import toast from 'react-hot-toast'

const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`
const fmtSmart = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function getWeekLabel(k: string) {
  const d = new Date(k)
  const e = new Date(k)
  e.setDate(d.getDate() + 6)
  return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })} – ${e.getDate()} ${e.toLocaleString('en-IN', { month: 'short' })}`
}

const EXP_ICONS: Record<string, string> = {
  FUEL: '⛽', DRIVER_ADVANCE: '👤', OWNER_ADVANCE: '🏦',
  MAINTENANCE: '🔧', TOLL: '🛣️', CASH_PAYMENT: '💵', OTHER: '💸',
}

interface Props {
  projectId: string
  projectName: string
  partyRate: number
  ownerRate: number
  onClose: () => void
}

export default function ProjectRateCalculator({ projectId, projectName, partyRate, ownerRate, onClose }: Props) {
  const [data, setData] = useState<ProjectRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyRate, setCompanyRate] = useState(partyRate || 133)
  const [ownerRateVal, setOwnerRateVal] = useState(ownerRate || 125)
  const [projectionMode, setProjectionMode] = useState<'week' | 'month' | 'year'>('month')

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchProjectRateData(projectId)
      .then(result => {
        if (cancelled) return
        setData(result)
        if (result.partyRate > 0) setCompanyRate(result.partyRate)
        if (result.ownerRate > 0) setOwnerRateVal(result.ownerRate)
      })
      .catch(err => {
        if (cancelled) return
        console.error('Rate calculator fetch error:', err)
        setError('Failed to load project rate data')
        toast.error('Failed to load project rate data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [projectId])

  const spread = companyRate - ownerRateVal
  const totalWeight = data?.totalWeight || 0
  const totalTrips = data?.totalTrips || 0
  const totalExpenses = data?.totalExpenses || 0
  const avgWeightPerTrip = totalTrips > 0 ? totalWeight / totalTrips : 20

  // Scenario calculations
  const scenarioRevenue = totalWeight * companyRate
  const scenarioPayout = totalWeight * ownerRateVal
  const scenarioProfit = scenarioRevenue - scenarioPayout - totalExpenses
  const scenarioMargin = scenarioRevenue > 0 ? (scenarioProfit / scenarioRevenue) * 100 : 0

  // Projections
  const weeksOfData = data?.weeklyData.length || 1
  const weeklyTrips = totalTrips / Math.max(weeksOfData, 1)
  const mult = projectionMode === 'week' ? 1 : projectionMode === 'month' ? 4.3 : 52
  const projTrips = Math.round(weeklyTrips * mult)
  const projWeight = projTrips * avgWeightPerTrip
  const projRevenue = projWeight * companyRate
  const projPayout = projWeight * ownerRateVal
  const projProfit = projRevenue - projPayout

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <div className="modal-title">🧮 Rate Calculator — {projectName}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Scenario modelling & projections for this project
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {loading ? (
            /* Skeleton while loading */
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                ))}
              </div>
              <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{error}</div>
              <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>Close</button>
            </div>
          ) : data ? (
            <>
              {/* Current Rates & Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20,
              }}>
                {[
                  { label: 'Trips', val: String(data.totalTrips), icon: '🚛', color: '#3b82f6' },
                  { label: 'Weight', val: `${data.totalWeight.toFixed(0)} MT`, icon: '⚖️', color: '#8b5cf6' },
                  { label: 'Revenue', val: fmtSmart(data.totalRevenue), icon: '💰', color: '#10b981' },
                  { label: 'Expenses', val: fmtSmart(data.totalExpenses), icon: '📉', color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: `${s.color}08`, border: `1px solid ${s.color}18`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 14 }}>{s.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Rate Inputs */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20,
                padding: '16px 20px', borderRadius: 14,
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
              }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    🏢 Party Rate (₹/MT)
                  </label>
                  <input type="number" className="form-input" value={companyRate}
                    onChange={e => setCompanyRate(parseFloat(e.target.value) || 0)}
                    style={{ width: 120, fontSize: 16, fontWeight: 700, padding: '8px 12px', borderColor: '#10b981' }} min={0} step={1} />
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {[100, 115, 125, 130, 133, 140, 150, 160].map(r => (
                      <button key={r} onClick={() => setCompanyRate(r)} style={{
                        padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 5, border: 'none', cursor: 'pointer',
                        background: companyRate === r ? '#10b981' : 'rgba(255,255,255,0.06)',
                        color: companyRate === r ? '#fff' : 'var(--color-text-muted)',
                      }}>₹{r}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    DB rate: ₹{data.partyRate}/MT
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    🚛 Owner Rate (₹/MT)
                  </label>
                  <input type="number" className="form-input" value={ownerRateVal}
                    onChange={e => setOwnerRateVal(parseFloat(e.target.value) || 0)}
                    style={{ width: 120, fontSize: 16, fontWeight: 700, padding: '8px 12px', borderColor: '#f59e0b' }} min={0} step={1} />
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {[100, 110, 115, 120, 125, 130, 135, 140].map(r => (
                      <button key={r} onClick={() => setOwnerRateVal(r)} style={{
                        padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 5, border: 'none', cursor: 'pointer',
                        background: ownerRateVal === r ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                        color: ownerRateVal === r ? '#fff' : 'var(--color-text-muted)',
                      }}>₹{r}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    DB rate: ₹{data.ownerRate}/MT
                  </div>
                </div>
              </div>

              {/* Scenario Results */}
              <div style={{
                padding: '14px 18px', borderRadius: 12, marginBottom: 20,
                background: spread > 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${spread > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
                  Scenario Output (based on {data.totalTrips} actual trips)
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Rate Spread', val: `₹${spread}/MT`, color: spread > 0 ? '#10b981' : '#ef4444' },
                    { label: 'Revenue', val: fmt(scenarioRevenue), color: '#10b981' },
                    { label: 'Owner Payout', val: fmt(scenarioPayout), color: '#f59e0b' },
                    { label: 'Expenses', val: fmt(totalExpenses), color: '#ef4444' },
                    { label: 'Net Profit', val: fmt(scenarioProfit), color: scenarioProfit >= 0 ? '#10b981' : '#ef4444' },
                    { label: 'Margin', val: `${scenarioMargin.toFixed(1)}%`, color: scenarioMargin >= 15 ? '#10b981' : '#ef4444' },
                  ].map(k => (
                    <div key={k.label}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: k.color }}>{k.val}</div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projection */}
              <div style={{
                padding: '16px 20px', borderRadius: 14, marginBottom: 20,
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    📈 Projection (avg {weeklyTrips.toFixed(1)} trips/week · {avgWeightPerTrip.toFixed(0)} MT/trip)
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['week', 'month', 'year'] as const).map(m => (
                      <button key={m} onClick={() => setProjectionMode(m)} style={{
                        padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: projectionMode === m ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border)',
                        background: projectionMode === m ? 'rgba(245,158,11,0.08)' : 'transparent',
                        color: projectionMode === m ? '#f59e0b' : 'var(--color-text-muted)',
                      }}>{m.charAt(0).toUpperCase() + m.slice(1)}ly</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {[
                    { label: 'Est. Trips', val: String(projTrips), color: '#3b82f6' },
                    { label: 'Est. Weight', val: `${projWeight.toFixed(0)} MT`, color: '#8b5cf6' },
                    { label: 'Est. Revenue', val: fmtSmart(projRevenue), color: '#10b981' },
                    { label: 'Est. Profit', val: fmtSmart(projProfit), color: projProfit >= 0 ? '#f59e0b' : '#ef4444' },
                  ].map(k => (
                    <div key={k.label} style={{ textAlign: 'center', background: 'var(--color-bg-primary)', borderRadius: 10, padding: '10px 8px', border: `1px solid ${k.color}20` }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: k.color }}>{k.val}</div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Breakdown */}
              {data.expensesByType.length > 0 && (
                <div style={{
                  padding: '16px 20px', borderRadius: 14, marginBottom: 20,
                  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>📋 Expense Breakdown</div>
                  {data.expensesByType.map((e, i) => {
                    const pct = data.totalExpenses > 0 ? (e.amount / data.totalExpenses) * 100 : 0
                    return (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>
                            {EXP_ICONS[e.type] || '💸'} {e.type.replace(/_/g, ' ')}
                          </span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{fmt(e.amount)}</span>
                          </div>
                        </div>
                        <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 100, background: '#ef4444', width: `${pct}%`, opacity: 0.6, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Weekly Table */}
              {data.weeklyData.length > 0 && (
                <div style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', fontSize: 12, fontWeight: 700 }}>
                    📅 Weekly Performance (at ₹{companyRate}/₹{ownerRateVal} rates)
                  </div>
                  <div className="data-table-wrapper" style={{ maxHeight: 280 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th style={{ textAlign: 'right' }}>Trips</th>
                          <th style={{ textAlign: 'right' }}>Weight</th>
                          <th style={{ textAlign: 'right' }}>Revenue</th>
                          <th style={{ textAlign: 'right' }}>Payout</th>
                          <th style={{ textAlign: 'right' }}>Spread</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.weeklyData.map(w => {
                          const wRev = w.weight * companyRate
                          const wPay = w.weight * ownerRateVal
                          const wSpread = wRev - wPay
                          return (
                            <tr key={w.weekKey}>
                              <td style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{getWeekLabel(w.weekKey)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <span style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{w.trips}</span>
                              </td>
                              <td style={{ textAlign: 'right', fontSize: 12 }}>{w.weight.toFixed(1)} MT</td>
                              <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmt(wRev)}</td>
                              <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: 12 }}>{fmt(wPay)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: wSpread >= 0 ? '#10b981' : '#ef4444' }}>{fmt(wSpread)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
