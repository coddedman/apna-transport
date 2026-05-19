'use client'

import type { AnalyticsData } from '@/lib/actions/analytics'

// Smart formatter: auto-abbreviates large numbers so they never truncate
const fmtSmart = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}
const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`

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
  const isProfit = pnl.netProfitBeforePartners >= 0

  return (
    <>
      {/* ── P&L Headline Banner ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20,
        padding: '24px 28px', marginBottom: 16, borderRadius: 16,
        background: isProfit
          ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)',
        border: `1px solid ${isProfit ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
      }}>
        {/* Left: Revenue & Payouts */}
        <div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 4 }}>Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{fmt(pnl.grossRevenue)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 4 }}>Owner Payouts</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{fmt(pnl.ownerPayout)}</div>
            </div>
          </div>
        </div>

        {/* Center: Divider */}
        <div style={{ width: 1, height: 60, background: 'var(--color-border)' }} />

        {/* Right: Profit & Margin */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 4 }}>Net Profit</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: isProfit ? '#10b981' : '#ef4444' }}>
                {pnl.netProfitBeforePartners < 0 ? '-' : ''}{fmt(pnl.netProfitBeforePartners)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 4 }}>Margin</div>
              <div style={{
                fontSize: 28, fontWeight: 900,
                color: isProfit ? '#10b981' : '#ef4444',
              }}>
                {pnl.margin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mini KPI Chips ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Rate Spread', value: fmt(pnl.rateSpread), color: '#22d3ee', icon: '📊' },
          { label: 'Vehicle Expenses', value: fmt(pnl.vehicleExpenses), color: '#ef4444', icon: '⛽' },
          { label: 'Overhead', value: fmt(pnl.companyOverhead), color: '#ec4899', icon: '🏢' },
        ].map((c, i) => (
          <div key={i} style={{
            flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            background: `${c.color}08`, border: `1px solid ${c.color}20`,
          }}>
            <span style={{ fontSize: 18 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Waterfall P&L Breakdown ── */}
      <div className="analytics-card" style={{ marginBottom: 16 }}>
        <div className="analytics-card-header">
          <span className="analytics-card-title">📊 Profit & Loss Waterfall</span>
        </div>
        <div className="analytics-card-body" style={{ padding: '16px 20px' }}>
          {waterfall.map((w, i) => {
            const barWidth = Math.max((Math.abs(w.value) / maxAbs) * 100, 3)
            const isNeg = w.value < 0
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: w.isSub ? '14px 16px' : '12px 0',
                borderBottom: i < waterfall.length - 1 && !w.isSub ? '1px solid var(--color-border)' : 'none',
                ...(w.isSub ? {
                  background: `${w.color}08`,
                  border: `1px solid ${w.color}18`,
                  borderRadius: 12,
                  margin: '6px 0',
                } : {}),
              }}>
                <span style={{
                  fontSize: 22, width: 36, height: 36, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  borderRadius: 10, background: `${w.color}10`,
                }}>{w.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{
                      fontSize: w.isSub ? 14 : 13,
                      fontWeight: w.isSub ? 800 : 600,
                      color: w.isSub ? w.color : 'var(--color-text-primary)',
                    }}>{w.label}</span>
                    <span style={{
                      fontSize: w.isSub ? 18 : 15, fontWeight: 900, color: w.color,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}>
                      {isNeg ? '−' : ''}{fmt(w.value)}
                    </span>
                  </div>
                  <div style={{ height: w.isSub ? 10 : 8, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 100,
                      background: `linear-gradient(90deg, ${w.color} 0%, ${w.color}90 100%)`,
                      width: `${barWidth}%`,
                      boxShadow: `0 0 12px ${w.color}40`,
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Three-column grid: Overhead | Partners | Cash Flow ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* Company Overhead Breakdown */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">🏢 Overhead Breakdown</span>
            <span style={{ fontSize: 12, color: '#ec4899', fontWeight: 800 }}>{fmt(companyOverhead.totalOverhead)}</span>
          </div>
          <div className="analytics-card-body" style={{ padding: '14px 18px' }}>
            {companyOverhead.byType.length === 0 ? (
              <div className="analytics-empty" style={{ padding: 24 }}>No overhead expenses logged</div>
            ) : (
              companyOverhead.byType.map((e, i) => {
                const pct = companyOverhead.totalOverhead > 0 ? (e.amount / companyOverhead.totalOverhead) * 100 : 0
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{OVERHEAD_ICONS[e.type] || '💸'}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>{e.type.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 9, padding: '2px 6px', borderRadius: 6,
                          background: `${OVERHEAD_COLORS[e.type] || '#64748b'}15`,
                          color: OVERHEAD_COLORS[e.type] || '#64748b', fontWeight: 800,
                        }}>{pct.toFixed(0)}%</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: OVERHEAD_COLORS[e.type] || '#64748b' }}>{fmt(e.amount)}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100,
                        background: `linear-gradient(90deg, ${OVERHEAD_COLORS[e.type] || '#64748b'}, ${OVERHEAD_COLORS[e.type] || '#64748b'}80)`,
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
            <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 800 }}>{partnerData.totalEquity.toFixed(0)}% allocated</span>
          </div>
          <div className="analytics-card-body" style={{ padding: '14px 18px' }}>
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
                      padding: '12px 14px', marginBottom: 10, borderRadius: 12,
                      background: `${color}06`, border: `1px solid ${color}18`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{p.name}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 900, color, padding: '2px 8px',
                          borderRadius: 8, background: `${color}15`,
                        }}>{p.equityPct}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#3b82f6' }}>{fmtSmart(p.investedAmount)}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: 9, fontWeight: 600 }}>Invested</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#10b981' }}>{fmtSmart(share)}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: 9, fontWeight: 600 }}>Share</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: pending > 0 ? '#f59e0b' : '#10b981' }}>{fmtSmart(pending)}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: 9, fontWeight: 600 }}>Pending</div>
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 10 }}>
                        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${Math.min(p.equityPct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
                {pnl.netProfitBeforePartners > 0 && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginTop: 6,
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                    display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800,
                  }}>
                    <span style={{ color: '#f59e0b' }}>🏆 Your Share</span>
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
              fontSize: 12, fontWeight: 800,
              color: cashFlowSummary.balance >= 0 ? '#10b981' : '#ef4444',
            }}>Net: {fmtSmart(cashFlowSummary.balance)}</span>
          </div>
          <div className="analytics-card-body" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{
                textAlign: 'center', padding: '12px 10px', borderRadius: 12,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{fmtSmart(cashFlowSummary.totalIn)}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 3 }}>Cash In</div>
              </div>
              <div style={{
                textAlign: 'center', padding: '12px 10px', borderRadius: 12,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#ef4444' }}>{fmtSmart(cashFlowSummary.totalOut)}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 3 }}>Cash Out</div>
              </div>
            </div>

            {/* Recent flows */}
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Entries</div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {cashFlowSummary.recentFlows.length === 0 ? (
                <div className="analytics-empty" style={{ padding: 16 }}>No cash entries yet</div>
              ) : (
                cashFlowSummary.recentFlows.map(f => {
                  const isIn = f.direction === 'CASH_IN'
                  return (
                    <div key={f.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                      background: 'var(--color-bg-primary)',
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 900,
                          background: isIn ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: isIn ? '#10b981' : '#ef4444',
                        }}>{isIn ? '↓' : '↑'}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{f.category}</div>
                          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{f.date}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: isIn ? '#10b981' : '#ef4444' }}>
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
                        background: 'rgba(139,92,246,0.08)', padding: '3px 10px',
                        borderRadius: 12, fontSize: 11, fontWeight: 700,
                      }}>
                        {OVERHEAD_ICONS[e.type.replace(/ /g, '_')] || '💸'} {e.type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{e.description || '—'}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 700, fontSize: 13 }}>{fmt(e.amount)}</td>
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
