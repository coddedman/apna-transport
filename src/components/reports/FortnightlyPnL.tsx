'use client'

import { useState, useTransition } from 'react'
import { generateFortnightlyPnL, type FortnightlyReport, type FortnightPnL } from '@/lib/actions/reports'

const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`
const fmtSm = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const card: React.CSSProperties = {
  background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, marginBottom: 16,
}

function PnLColumn({ data, label }: { data: FortnightPnL; label: string }) {
  const isProfit = data.netProfit >= 0

  const rows: { label: string; value: number; color: string; icon: string; indent?: boolean; bold?: boolean }[] = [
    { label: 'Gross Revenue (Billings)', value: data.grossRevenue, color: '#10b981', icon: '🏢', bold: true },
    { label: 'Owner Payouts', value: -data.ownerPayout, color: '#f59e0b', icon: '💰' },
    { label: 'Rate Spread', value: data.rateSpread, color: '#22d3ee', icon: '📊', bold: true },
    // Vehicle Expenses
    { label: 'Fuel', value: -data.fuelExpense, color: '#ef4444', icon: '⛽', indent: true },
    { label: 'Toll', value: -data.tollExpense, color: '#ef4444', icon: '🛣️', indent: true },
    { label: 'Maintenance', value: -data.maintenanceExpense, color: '#ef4444', icon: '🔧', indent: true },
    { label: 'Driver Advance', value: -data.driverAdvanceExpense, color: '#ef4444', icon: '👤', indent: true },
    { label: 'Cash Payment', value: -data.cashPaymentExpense, color: '#ef4444', icon: '💵', indent: true },
    { label: 'Total Vehicle Expenses', value: -data.totalVehicleExpenses, color: '#ef4444', icon: '🚛', bold: true },
    // Overhead
    { label: 'Salary', value: -data.salaryOverhead, color: '#ec4899', icon: '👷', indent: true },
    { label: 'Rent', value: -data.rentOverhead, color: '#ec4899', icon: '🏢', indent: true },
    { label: 'EMI', value: -data.emiOverhead, color: '#ec4899', icon: '🏦', indent: true },
    { label: 'Insurance', value: -data.insuranceOverhead, color: '#ec4899', icon: '🛡️', indent: true },
    { label: 'Office', value: -data.officeOverhead, color: '#ec4899', icon: '💻', indent: true },
    { label: 'Total Overhead', value: -data.totalOverhead, color: '#ec4899', icon: '🏗️', bold: true },
    // Net
    { label: 'Net Profit', value: data.netProfit, color: isProfit ? '#10b981' : '#ef4444', icon: isProfit ? '📈' : '📉', bold: true },
  ]

  // Filter out zero-value sub-items (keep bold summary rows even if 0)
  const filteredRows = rows.filter(r => r.bold || r.value !== 0)

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {data.periodStart} → {data.periodEnd}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Trips</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-accent)' }}>{data.tripsCount}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Weight</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text-primary)' }}>{data.totalWeight.toFixed(1)} MT</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Margin</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: isProfit ? '#10b981' : '#ef4444' }}>{data.profitMargin.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Waterfall Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredRows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: row.bold ? '10px 12px' : '6px 12px',
              background: row.bold ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderRadius: 10,
              marginLeft: row.indent ? 20 : 0,
            }}
          >
            <span style={{ fontSize: 14, width: 22 }}>{row.icon}</span>
            <span style={{
              flex: 1, fontSize: row.bold ? 12 : 11,
              fontWeight: row.bold ? 800 : 500,
              color: row.bold ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            }}>
              {row.label}
            </span>
            <span style={{
              fontSize: row.bold ? 14 : 12,
              fontWeight: row.bold ? 900 : 600,
              color: row.color,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {row.value >= 0 ? '+' : '-'}{fmt(row.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Transaction Summary */}
      {(data.partyPaymentsReceived > 0 || data.ownerPaymentsMade > 0 || data.ownerAdvancesGiven > 0) && (
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(139,92,246,0.05)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            💳 Transactions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.partyPaymentsReceived > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Party Payments Received</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>+{fmt(data.partyPaymentsReceived)}</span>
              </div>
            )}
            {data.ownerPaymentsMade > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Owner Payments Made</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>-{fmt(data.ownerPaymentsMade)}</span>
              </div>
            )}
            {data.ownerAdvancesGiven > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Advances Given</span>
                <span style={{ fontWeight: 700, color: '#8b5cf6' }}>-{fmt(data.ownerAdvancesGiven)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  initialYear: number
  initialMonth: number
}

export default function FortnightlyPnL({ initialYear, initialMonth }: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [report, setReport] = useState<FortnightlyReport | null>(null)
  const [isPending, startTransition] = useTransition()

  function loadReport(y: number, m: number) {
    startTransition(async () => {
      try {
        const data = await generateFortnightlyPnL(y, m)
        setReport(data)
      } catch (err: any) {
        alert(err.message || 'Failed to load report')
      }
    })
  }

  function handleMonthChange(direction: number) {
    let newMonth = month + direction
    let newYear = year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setMonth(newMonth)
    setYear(newYear)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Month Selector */}
      <div style={{
        ...card,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => handleMonthChange(-1)}
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)',
              cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text-primary)' }}>{monthLabel}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Fortnightly Profit & Loss</div>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)',
              cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            →
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => loadReport(year, month)}
          disabled={isPending}
          style={{ padding: '10px 24px' }}
        >
          {isPending ? '⏳ Generating...' : '📊 Generate Report'}
        </button>
      </div>

      {/* Report Content */}
      {report && (
        <>
          {/* Headline Banner */}
          <div style={{
            ...card,
            background: report.monthTotal.netProfit >= 0
              ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
            border: `1px solid ${report.monthTotal.netProfit >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>
              {report.monthLabel} — Net Profit
            </div>
            <div style={{
              fontSize: 32, fontWeight: 900,
              color: report.monthTotal.netProfit >= 0 ? '#10b981' : '#ef4444',
            }}>
              {report.monthTotal.netProfit >= 0 ? '+' : '-'}{fmt(report.monthTotal.netProfit)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {report.monthTotal.tripsCount} trips · {report.monthTotal.totalWeight.toFixed(1)} MT · {report.monthTotal.profitMargin.toFixed(1)}% margin
            </div>
          </div>

          {/* Comparison Bar */}
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Half-Month Comparison
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Revenue', first: report.firstHalf.grossRevenue, second: report.secondHalf.grossRevenue, color: '#10b981' },
                { label: 'Expenses', first: report.firstHalf.totalVehicleExpenses + report.firstHalf.totalOverhead, second: report.secondHalf.totalVehicleExpenses + report.secondHalf.totalOverhead, color: '#ef4444' },
                { label: 'Profit', first: report.firstHalf.netProfit, second: report.secondHalf.netProfit, color: '#22d3ee' },
                { label: 'Trips', first: report.firstHalf.tripsCount, second: report.secondHalf.tripsCount, color: '#f59e0b' },
              ].map(item => {
                const max = Math.max(Math.abs(item.first), Math.abs(item.second), 1)
                return (
                  <div key={item.label} style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 36 }}>1-15</span>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(Math.abs(item.first) / max) * 100}%`, background: item.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color, minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {typeof item.first === 'number' && item.first > 999 ? fmtSm(item.first) : item.first}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 36 }}>16+</span>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(Math.abs(item.second) / max) * 100}%`, background: item.color, borderRadius: 4, opacity: 0.6, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color, minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
                        {typeof item.second === 'number' && item.second > 999 ? fmtSm(item.second) : item.second}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Two-Panel Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            <PnLColumn data={report.firstHalf} label={`📅 ${report.firstHalf.label}`} />
            <PnLColumn data={report.secondHalf} label={`📅 ${report.secondHalf.label}`} />
          </div>

          {/* Full Month Total */}
          <PnLColumn data={report.monthTotal} label={`📊 Full Month — ${report.monthLabel}`} />
        </>
      )}

      {/* Empty State */}
      {!report && !isPending && (
        <div style={{
          ...card, textAlign: 'center', padding: '60px 20px',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Fortnightly P&L Report
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto' }}>
            Select a month and click "Generate Report" to see a detailed profit & loss breakdown for each 15-day period.
          </div>
        </div>
      )}
    </div>
  )
}
