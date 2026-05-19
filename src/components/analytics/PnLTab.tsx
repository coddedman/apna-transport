'use client'

import type { AnalyticsData } from '@/lib/actions/analytics'

const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`
const fmtSign = (n: number) => `${n >= 0 ? '+' : '-'}₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`

const OVERHEAD_ICONS: Record<string, string> = {
  SALARY: '👷', RENT: '🏢', INSURANCE: '🛡️', EMI: '🏦',
  OFFICE: '💻', PARTNER_PAYOUT: '🤝', OTHER: '💸',
}

const OVERHEAD_COLORS: Record<string, string> = {
  SALARY: '#f59e0b', RENT: '#3b82f6', INSURANCE: '#10b981', EMI: '#ef4444',
  OFFICE: '#8b5cf6', PARTNER_PAYOUT: '#ec4899', OTHER: '#64748b',
}

interface Props {
  data: AnalyticsData
}

export default function PnLTab({ data }: Props) {
  const { pnl, companyOverhead, partnerData, cashFlowSummary } = data

  // Defensive check for stale cache / old data formats
  if (!pnl) {
    return (
      <div className="analytics-empty" style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔄</div>
        <h3>Dashboard Update in Progress</h3>
        <p style={{ marginTop: '8px', marginBottom: '24px' }}>
          We've just released a major performance update to the dashboard.<br/>
          Your browser is currently holding onto an older version of the data.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Click here to Refresh
        </button>
      </div>
    )
  }

  // Waterfall items
  const waterfall = [
    { label: 'Gross Revenue (Billings)', value: pnl.grossRevenue, color: '#10b981', icon: '🏢' },
    { label: 'Owner Payouts', value: -pnl.ownerPayout, color: '#f59e0b', icon: '💰' },
    { label: 'Rate Spread', value: pnl.rateSpread, color: '#22d3ee', icon: '📊', isSub: true },
    { label: 'Vehicle Expenses', value: -pnl.vehicleExpenses, color: '#ef4444', icon: '⛽' },
    { label: 'Company Overhead', value: -pnl.companyOverhead, color: '#ec4899', icon: '🏢' },
    { label: 'Net Profit', value: pnl.netProfitBeforePartners, color: pnl.netProfitBeforePartners >= 0 ? '#10b981' : '#ef4444', icon: '💵', isSub: true },
  ]

  const maxAbs = Math.max(...waterfall.map(w => Math.abs(w.value)), 1)

  return (
    <>
      {/* ── P&L KPI Row ── */}
      <div className="analytics-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="analytics-kpi success">
          <div className="analytics-kpi-icon">🏢</div>
          <div className="analytics-kpi-body">
            <div className="analytics-kpi-value">{fmt(pnl.grossRevenue)}</div>
            <div className="analytics-kpi-label">Gross Revenue</div>
          </div>
        </div>
        <div className="analytics-kpi warning">
          <div className="analytics-kpi-icon">💰</div>
          <div className="analytics-kpi-body">
            <div className="analytics-kpi-value">{fmt(pnl.ownerPayout)}</div>
            <div className="analytics-kpi-label">Owner Payouts</div>
          </div>
        </div>
        <div className="analytics-kpi danger">
          <div className="analytics-kpi-icon">📉</div>
          <div className="analytics-kpi-body">
            <div className="analytics-kpi-value">{fmt(pnl.companyOverhead)}</div>
            <div className="analytics-kpi-label">Overhead</div>
          </div>
        </div>
        <div className={`analytics-kpi ${pnl.netProfitBeforePartners >= 0 ? 'success' : 'loss'}`}>
          <div className="analytics-kpi-icon">💵</div>
          <div className="analytics-kpi-body">
            <div className="analytics-kpi-value">{fmt(pnl.netProfitBeforePartners)}</div>
            <div className="analytics-kpi-label">Net Profit</div>
          </div>
        </div>
        <div className="analytics-kpi teal">
          <div className="analytics-kpi-icon">📈</div>
          <div className="analytics-kpi-body">
            <div className="analytics-kpi-value">{pnl.margin.toFixed(1)}%</div>
            <div className="analytics-kpi-label">Margin</div>
          </div>
        </div>
      </div>

      {/* ── Waterfall P&L Breakdown ── */}
      <div className="analytics-card" style={{ marginBottom: 16 }}>
        <div className="analytics-card-header">
          <span className="analytics-card-title">📊 Profit & Loss Waterfall</span>
        </div>
        <div className="analytics-card-body" style={{ padding: '20px 16px' }}>
          {waterfall.map((w, i) => {
            const barWidth = Math.max((Math.abs(w.value) / maxAbs) * 100, 2)
            const isNeg = w.value < 0
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < waterfall.length - 1 ? '1px solid var(--color-border)' : 'none',
                ...(w.isSub ? { background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '12px 12px', margin: '4px 0' } : {}),
              }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{w.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: w.isSub ? 13 : 12,
                      fontWeight: w.isSub ? 800 : 600,
                      color: w.isSub ? w.color : 'var(--color-text-primary)',
                    }}>{w.label}</span>
                    <span style={{
                      fontSize: 14, fontWeight: 800, color: w.color,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}>
                      {isNeg ? '-' : ''}{fmt(w.value)}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 100,
                      background: w.color,
                      width: `${barWidth}%`,
                      opacity: w.isSub ? 0.9 : 0.6,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Three-column grid: Overhead | Partners | Cash Flow ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Company Overhead Breakdown */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">🏢 Overhead Breakdown</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>{fmt(companyOverhead.totalOverhead)}</span>
          </div>
          <div className="analytics-card-body" style={{ padding: '12px 16px' }}>
            {companyOverhead.byType.length === 0 ? (
              <div className="analytics-empty" style={{ padding: 24 }}>No overhead expenses logged</div>
            ) : (
              companyOverhead.byType.map((e, i) => {
                const pct = companyOverhead.totalOverhead > 0 ? (e.amount / companyOverhead.totalOverhead) * 100 : 0
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{OVERHEAD_ICONS[e.type] || '💸'}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>{e.type.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{pct.toFixed(0)}%</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: OVERHEAD_COLORS[e.type] || '#64748b' }}>{fmt(e.amount)}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100,
                        background: OVERHEAD_COLORS[e.type] || '#64748b',
                        width: `${pct}%`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Partner Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">🤝 Partner Equity</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>{partnerData.totalEquity.toFixed(0)}% allocated</span>
          </div>
          <div className="analytics-card-body" style={{ padding: '12px 16px' }}>
            {partnerData.partners.length === 0 ? (
              <div className="analytics-empty" style={{ padding: 24 }}>No partners registered</div>
            ) : (
              <>
                {partnerData.partners.map((p, i) => {
                  const colors = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899']
                  const color = colors[i % colors.length]
                  const netProfit = pnl.netProfitBeforePartners
                  const share = netProfit > 0 ? (p.equityPct / 100) * netProfit : 0
                  const pending = share - p.paidOutAmount
                  return (
                    <div key={p.id} style={{
                      padding: '10px 12px', marginBottom: 8, borderRadius: 10,
                      background: 'var(--color-bg-primary)', border: `1px solid ${color}30`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color }}>{p.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color }}>{p.equityPct}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#3b82f6' }}>{fmt(p.investedAmount)}</div>
                          <div style={{ color: 'var(--color-text-muted)' }}>Invested</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#10b981' }}>{fmt(share)}</div>
                          <div style={{ color: 'var(--color-text-muted)' }}>Share</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: pending > 0 ? '#f59e0b' : '#10b981' }}>{fmt(pending)}</div>
                          <div style={{ color: 'var(--color-text-muted)' }}>Pending</div>
                        </div>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 8 }}>
                        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${Math.min(p.equityPct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
                {pnl.netProfitBeforePartners > 0 && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 8, marginTop: 4,
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                    display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700,
                  }}>
                    <span style={{ color: '#f59e0b' }}>Your Remaining Share</span>
                    <span style={{ color: '#f59e0b' }}>
                      {fmt(pnl.netProfitBeforePartners - (partnerData.totalEquity / 100) * pnl.netProfitBeforePartners)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">💰 Cash Flow</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: cashFlowSummary.balance >= 0 ? '#10b981' : '#ef4444',
            }}>Net: {fmt(cashFlowSummary.balance)}</span>
          </div>
          <div className="analytics-card-body" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{
                textAlign: 'center', padding: '10px 8px', borderRadius: 10,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
              }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{fmt(cashFlowSummary.totalIn)}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Cash In</div>
              </div>
              <div style={{
                textAlign: 'center', padding: '10px 8px', borderRadius: 10,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
              }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ef4444' }}>{fmt(cashFlowSummary.totalOut)}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Cash Out</div>
              </div>
            </div>

            {/* Recent flows */}
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Recent Entries</div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {cashFlowSummary.recentFlows.length === 0 ? (
                <div className="analytics-empty" style={{ padding: 16 }}>No cash entries yet</div>
              ) : (
                cashFlowSummary.recentFlows.map(f => {
                  const isIn = f.direction === 'CASH_IN'
                  return (
                    <div key={f.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', borderRadius: 6, marginBottom: 3,
                      background: 'var(--color-bg-primary)',
                    }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 900,
                          background: isIn ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: isIn ? '#10b981' : '#ef4444',
                        }}>{isIn ? '↓' : '↑'}</span>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700 }}>{f.category}</div>
                          <div style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>{f.date}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isIn ? '#10b981' : '#ef4444' }}>
                        {isIn ? '+' : '-'}{fmt(f.amount)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Overhead Expenses ── */}
      <div className="analytics-card">
        <div className="analytics-card-header">
          <span className="analytics-card-title">📋 Recent Company Expenses</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Latest 10</span>
        </div>
        <div className="analytics-card-body analytics-card-body-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {companyOverhead.recentExpenses.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>No overhead expenses recorded</td></tr>
              ) : (
                companyOverhead.recentExpenses.map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(139,92,246,0.08)', padding: '2px 8px',
                        borderRadius: 12, fontSize: 11, fontWeight: 700,
                      }}>
                        {OVERHEAD_ICONS[e.type.replace(/ /g, '_')] || '💸'} {e.type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{e.description || '—'}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{fmt(e.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
