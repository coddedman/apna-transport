'use client'

import { useState, useEffect, useTransition } from 'react'
import { fetchProjectRateData, updateProjectRates, type ProjectRateData } from '@/lib/actions/projectRates'
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
  isPage?: boolean
  onClose?: () => void
}

export default function ProjectRateCalculator({ projectId, projectName, partyRate, ownerRate, isPage, onClose }: Props) {
  const [data, setData] = useState<ProjectRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyRate, setCompanyRate] = useState(partyRate || 133)
  const [ownerRateVal, setOwnerRateVal] = useState(ownerRate || 125)
  const [projectionMode, setProjectionMode] = useState<'week' | 'month' | 'year'>('month')
  const [saving, startSave] = useTransition()
  const [savedRates, setSavedRates] = useState({ partyRate, ownerRate })

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
        setSavedRates({ partyRate: result.partyRate, ownerRate: result.ownerRate })
      })
      .catch(err => {
        if (cancelled) return
        console.error('Rate calculator fetch error:', err)
        setError('Failed to load project rate data')
        toast.error('Failed to load project rate data')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId])

  const hasChanges = companyRate !== savedRates.partyRate || ownerRateVal !== savedRates.ownerRate

  function handleSave() {
    startSave(async () => {
      try {
        await updateProjectRates(projectId, companyRate, ownerRateVal)
        setSavedRates({ partyRate: companyRate, ownerRate: ownerRateVal })
        toast.success(`Rates updated — Party ₹${companyRate}/MT · Owner ₹${ownerRateVal}/MT`)
      } catch {
        toast.error('Failed to save rates')
      }
    })
  }

  const spread = companyRate - ownerRateVal
  const totalWeight = data?.totalWeight || 0
  const totalTrips = data?.totalTrips || 0
  const totalExpenses = data?.totalExpenses || 0
  const avgWeightPerTrip = totalTrips > 0 ? totalWeight / totalTrips : 20

  const scenarioRevenue = totalWeight * companyRate
  const scenarioPayout = totalWeight * ownerRateVal
  const scenarioProfit = scenarioRevenue - scenarioPayout - totalExpenses
  const scenarioMargin = scenarioRevenue > 0 ? (scenarioProfit / scenarioRevenue) * 100 : 0

  const weeksOfData = data?.weeklyData.length || 1
  const weeklyTrips = totalTrips / Math.max(weeksOfData, 1)
  const mult = projectionMode === 'week' ? 1 : projectionMode === 'month' ? 4.3 : 52
  const projTrips = Math.round(weeklyTrips * mult)
  const projWeight = projTrips * avgWeightPerTrip
  const projRevenue = projWeight * companyRate
  const projPayout = projWeight * ownerRateVal
  const projProfit = projRevenue - projPayout

  const content = (
    <div>
      {loading ? (
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 140, borderRadius: 12, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{error}</div>
        </div>
      ) : data ? (
        <>
          {/* KPI Stats */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Trips', val: String(data.totalTrips), icon: '🚛', cls: 'accent' },
              { label: 'Weight', val: `${data.totalWeight.toFixed(0)} MT`, icon: '⚖️', cls: 'purple' },
              { label: 'Revenue', val: fmtSmart(data.totalRevenue), icon: '💰', cls: 'success' },
              { label: 'Expenses', val: fmtSmart(data.totalExpenses), icon: '📉', cls: 'fuel' },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.cls}`}>
                <div className="stat-card-header">
                  <div className={`stat-card-icon ${s.cls}`}>{s.icon}</div>
                </div>
                <div className="stat-card-value">{s.val}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rate Inputs + Save */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">📐 Rate Configuration</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {hasChanges && (
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>● Unsaved changes</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '6px 16px',
                    opacity: hasChanges ? 1 : 0.4,
                    cursor: hasChanges ? 'pointer' : 'not-allowed',
                  }}
                >
                  {saving ? '⏳ Saving...' : '💾 Save Rates'}
                </button>
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  🏢 Party Rate (₹/MT)
                </label>
                <input type="number" className="form-input" value={companyRate}
                  onChange={e => setCompanyRate(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', fontSize: 18, fontWeight: 700, padding: '10px 14px' }} min={0} step={1} />
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {[100, 115, 125, 130, 133, 140, 150, 160].map(r => (
                    <button key={r} onClick={() => setCompanyRate(r)} style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: companyRate === r ? '#10b981' : 'var(--color-bg-secondary)',
                      color: companyRate === r ? '#fff' : 'var(--color-text-muted)',
                      transition: 'all .15s',
                    }}>₹{r}</button>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  Saved: ₹{savedRates.partyRate}/MT
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  🚛 Owner Rate (₹/MT)
                </label>
                <input type="number" className="form-input" value={ownerRateVal}
                  onChange={e => setOwnerRateVal(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', fontSize: 18, fontWeight: 700, padding: '10px 14px' }} min={0} step={1} />
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {[100, 110, 115, 120, 125, 130, 135, 140].map(r => (
                    <button key={r} onClick={() => setOwnerRateVal(r)} style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: ownerRateVal === r ? '#f59e0b' : 'var(--color-bg-secondary)',
                      color: ownerRateVal === r ? '#fff' : 'var(--color-text-muted)',
                      transition: 'all .15s',
                    }}>₹{r}</button>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  Saved: ₹{savedRates.ownerRate}/MT
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                background: spread > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                borderRadius: 12, padding: 16, border: `1px solid ${spread > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Spread</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: spread > 0 ? '#10b981' : '#ef4444' }}>₹{spread}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>per MT</div>
              </div>
            </div>
          </div>

          {/* Scenario Results */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">📊 Scenario Output ({data.totalTrips} actual trips)</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
              {[
                { label: 'Rate Spread', val: `₹${spread}/MT`, color: spread > 0 ? '#10b981' : '#ef4444' },
                { label: 'Revenue', val: fmt(scenarioRevenue), color: '#10b981' },
                { label: 'Owner Payout', val: fmt(scenarioPayout), color: '#f59e0b' },
                { label: 'Expenses', val: fmt(totalExpenses), color: '#ef4444' },
                { label: 'Net Profit', val: fmt(scenarioProfit), color: scenarioProfit >= 0 ? '#10b981' : '#ef4444' },
                { label: 'Margin', val: `${scenarioMargin.toFixed(1)}%`, color: scenarioMargin >= 15 ? '#10b981' : '#ef4444' },
              ].map(k => (
                <div key={k.label} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 10, background: 'var(--color-bg-secondary)' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 3 }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Projection */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">📈 Projection (avg {weeklyTrips.toFixed(1)} trips/wk · {avgWeightPerTrip.toFixed(0)} MT/trip)</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['week', 'month', 'year'] as const).map(m => (
                  <button key={m} onClick={() => setProjectionMode(m)} className={`btn btn-sm ${projectionMode === m ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 12px', fontSize: 11 }}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}ly
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Est. Trips', val: String(projTrips), cls: 'accent' },
                { label: 'Est. Weight', val: `${projWeight.toFixed(0)} MT`, cls: 'purple' },
                { label: 'Est. Revenue', val: fmtSmart(projRevenue), cls: 'success' },
                { label: 'Est. Profit', val: fmtSmart(projProfit), cls: projProfit >= 0 ? 'success' : 'fuel' },
              ].map(k => (
                <div key={k.label} className={`stat-card ${k.cls}`}>
                  <div className="stat-card-value">{k.val}</div>
                  <div className="stat-card-label">{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two columns: Expense Breakdown + Weekly Table */}
          <div style={{ display: 'grid', gridTemplateColumns: data.expensesByType.length > 0 ? '1fr 2fr' : '1fr', gap: 16 }}>
            {/* Expense Breakdown */}
            {data.expensesByType.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📋 Expenses</span>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  {data.expensesByType.map((e, i) => {
                    const pct = data.totalExpenses > 0 ? (e.amount / data.totalExpenses) * 100 : 0
                    return (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>
                            {EXP_ICONS[e.type] || '💸'} {e.type.replace(/_/g, ' ')}
                          </span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{fmt(e.amount)}</span>
                          </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 100, background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 100, background: '#ef4444', width: `${pct}%`, opacity: 0.65, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Total</span>
                    <span style={{ fontWeight: 900, fontSize: 14, color: '#ef4444' }}>{fmt(data.totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Table */}
            {data.weeklyData.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📅 Weekly Performance (₹{companyRate}/₹{ownerRateVal})</span>
                </div>
                <div className="data-table-wrapper" style={{ maxHeight: 350 }}>
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
          </div>
        </>
      ) : null}
    </div>
  )

  // If used as a page, render content directly
  if (isPage) return content

  // Modal fallback (kept for backward compat but shouldn't be used)
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-content" style={{ maxWidth: 900, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <div className="modal-title">🧮 Rate Calculator — {projectName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {content}
        </div>
      </div>
    </div>
  )
}
