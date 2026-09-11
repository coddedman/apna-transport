'use client'

import { useState, useTransition } from 'react'
import { getExpenseTally, type ExpenseTallyResult, type VehicleExpenseTally } from '@/lib/actions/expenseTally'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  FUEL: { label: 'Fuel', icon: '⛽', color: '#f59e0b' },
  TOLL: { label: 'Toll', icon: '🛣️', color: '#3b82f6' },
  MAINTENANCE: { label: 'Maintenance', icon: '🔧', color: '#ef4444' },
  DRIVER_ADVANCE: { label: 'Driver Advance', icon: '👤', color: '#8b5cf6' },
  CASH_PAYMENT: { label: 'Cash Payment', icon: '💵', color: '#10b981' },
  OWNER_ADVANCE: { label: 'Owner Advance', icon: '🏦', color: '#ec4899' },
}

function getFortnightPresets() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const presets = []

  // Current and previous 4 fortnights
  for (let i = 0; i < 5; i++) {
    const month = m - Math.floor(i / 2)
    const adjYear = y + Math.floor(month / 12) - (month < 0 ? 1 : 0)
    const adjMonth = ((month % 12) + 12) % 12

    if (i % 2 === 0) {
      // Current half
      const isFirstHalf = now.getDate() <= 15 || i > 0
      if (isFirstHalf || i > 0) {
        const lastDay = new Date(adjYear, adjMonth + 1, 0).getDate()
        // Second half
        presets.push({
          label: `${new Date(adjYear, adjMonth, 16).toLocaleDateString('en-IN', { month: 'short' })} 16-${lastDay}`,
          start: `${adjYear}-${String(adjMonth + 1).padStart(2, '0')}-16`,
          end: `${adjYear}-${String(adjMonth + 1).padStart(2, '0')}-${lastDay}`,
        })
      }
    } else {
      // First half
      presets.push({
        label: `${new Date(adjYear, adjMonth, 1).toLocaleDateString('en-IN', { month: 'short' })} 1-15`,
        start: `${adjYear}-${String(adjMonth + 1).padStart(2, '0')}-01`,
        end: `${adjYear}-${String(adjMonth + 1).padStart(2, '0')}-15`,
      })
    }
  }

  // Deduplicate and limit
  const seen = new Set<string>()
  return presets.filter(p => {
    if (seen.has(p.start)) return false
    seen.add(p.start)
    return true
  }).slice(0, 6)
}

function VehicleRow({ v, onAddExpense }: { v: VehicleExpenseTally; onAddExpense: (vehicleId: string, plateNo: string, category: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasMissing = v.missingCategories.length > 0

  const categories: { key: string; amount: number; count: number }[] = [
    { key: 'FUEL', amount: v.fuelAmount, count: v.fuelCount },
    { key: 'TOLL', amount: v.tollAmount, count: v.tollCount },
    { key: 'MAINTENANCE', amount: v.maintenanceAmount, count: v.maintenanceCount },
    { key: 'DRIVER_ADVANCE', amount: v.driverAdvanceAmount, count: v.driverAdvanceCount },
    { key: 'CASH_PAYMENT', amount: v.cashPaymentAmount, count: v.cashPaymentCount },
    { key: 'OWNER_ADVANCE', amount: v.ownerAdvanceAmount, count: v.ownerAdvanceCount },
  ]

  return (
    <div
      style={{
        background: hasMissing ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hasMissing ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16, marginBottom: 8, overflow: 'hidden', transition: 'all 0.2s',
      }}
    >
      {/* Header Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}
      >
        {/* Vehicle + Owner */}
        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)' }}>{v.plateNo}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{v.ownerName}</div>
        </div>

        {/* Trips */}
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-accent)' }}>{v.tripsCount}</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>trips</div>
        </div>

        {/* Revenue */}
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{fmt(v.totalRevenue)}</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>revenue</div>
        </div>

        {/* Expenses */}
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt(v.totalExpenses)}</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>expenses</div>
        </div>

        {/* Status Badges */}
        <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {hasMissing ? (
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ⚠️ {v.missingCategories.length} missing
            </span>
          ) : v.tripsCount > 0 ? (
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
            }}>
              ✅ All logged
            </span>
          ) : (
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
              background: 'rgba(100,116,139,0.12)', color: '#64748b',
            }}>
              No trips
            </span>
          )}
        </div>

        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--color-border)' }}>
          {/* Category Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginTop: 14 }}>
            {categories.map(cat => {
              const cfg = CATEGORY_CONFIG[cat.key]
              const isMissing = v.missingCategories.includes(cat.key)
              return (
                <div
                  key={cat.key}
                  style={{
                    padding: '10px 12px', borderRadius: 12,
                    background: isMissing ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isMissing ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {isMissing && (
                      <span style={{ fontSize: 8, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>MISSING</span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: cat.amount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                    {cat.amount > 0 ? fmt(cat.amount) : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {cat.count > 0 ? `${cat.count} entries` : 'No entries'}
                  </div>
                  {isMissing && v.tripsCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddExpense(v.vehicleId, v.plateNo, cat.key) }}
                      style={{
                        marginTop: 6, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontSize: 10, fontWeight: 700, background: cfg.color, color: '#fff', width: '100%',
                      }}
                    >
                      + Add {cfg.label}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Per-trip stats */}
          {v.tripsCount > 0 && (
            <div style={{
              marginTop: 12, padding: '10px 14px', background: 'var(--color-bg-secondary)', borderRadius: 10,
              display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, color: 'var(--color-text-muted)',
            }}>
              <span>Expense/Trip: <strong style={{ color: 'var(--color-text-primary)' }}>{fmt(v.expensePerTrip)}</strong></span>
              <span>Fuel/Trip: <strong style={{ color: '#f59e0b' }}>{fmt(v.fuelPerTrip)}</strong></span>
              <span>Days Active: <strong style={{ color: 'var(--color-text-primary)' }}>{v.daysActive}</strong></span>
              <span>Weight: <strong style={{ color: 'var(--color-text-primary)' }}>{v.totalWeight.toFixed(1)} MT</strong></span>
              {v.lastTripDate && <span>Last Trip: <strong>{v.lastTripDate}</strong></span>}
              {v.lastExpenseDate && <span>Last Expense: <strong>{v.lastExpenseDate}</strong></span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  vehicles: { id: string; plateNo: string }[]
  projects: { id: string; projectName: string }[]
}

export default function ExpenseTallyView({ vehicles, projects }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ExpenseTallyResult | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilter, setShowFilter] = useState<'all' | 'missing' | 'ok'>('all')
  const presets = getFortnightPresets()

  // For quick-add expense
  const [addingExpense, setAddingExpense] = useState<{ vehicleId: string; plateNo: string; category: string } | null>(null)

  function loadTally(start: string, end: string) {
    setStartDate(start)
    setEndDate(end)
    startTransition(async () => {
      try {
        const data = await getExpenseTally(start, end)
        setResult(data)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) return
    loadTally(startDate, endDate)
  }

  function handleAddExpense(vehicleId: string, plateNo: string, category: string) {
    setAddingExpense({ vehicleId, plateNo, category })
  }

  const filteredVehicles = result?.vehicles.filter(v => {
    if (showFilter === 'missing') return v.missingCategories.length > 0
    if (showFilter === 'ok') return v.missingCategories.length === 0 && v.tripsCount > 0
    return true
  }) || []

  return (
    <div>
      {/* Period Selector */}
      <div style={{
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 20, marginBottom: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(239,68,68,0.1)', padding: '5px 8px', borderRadius: 8 }}>🔍</span>
          Expense Tally — Select Period
        </div>

        {/* Fortnight Presets */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {presets.map(p => (
            <button
              key={p.start}
              onClick={() => loadTally(p.start, p.end)}
              disabled={isPending}
              style={{
                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: startDate === p.start && endDate === p.end ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                color: startDate === p.start && endDate === p.end ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              📅 {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date */}
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 10 }}>From</label>
            <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 10 }}>To</label>
            <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !startDate || !endDate} style={{ padding: '7px 16px' }}>
            {isPending ? '⏳ Loading...' : '🔍 Check Expenses'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary Banner */}
          <div style={{
            background: result.summary.vehiclesWithMissing > 0
              ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)',
            border: `1px solid ${result.summary.vehiclesWithMissing > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
            borderRadius: 20, padding: '20px 24px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 4 }}>
                  {result.periodLabel}
                </div>
                {result.summary.vehiclesWithMissing > 0 ? (
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>
                    ⚠️ {result.summary.vehiclesWithMissing} vehicle{result.summary.vehiclesWithMissing > 1 ? 's' : ''} with missing expenses
                  </div>
                ) : (
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>
                    ✅ All expenses are logged!
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-accent)' }}>{result.summary.totalTrips}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Trips</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)' }}>{result.summary.vehiclesWithTrips}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Vehicles</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{fmt(result.summary.totalExpenses)}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Expenses</div>
                </div>
              </div>
            </div>

            {/* Missing Breakdown */}
            {result.summary.missingBreakdown.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>Missing:</span>
                {result.summary.missingBreakdown.map(m => {
                  const cfg = CATEGORY_CONFIG[m.category]
                  return (
                    <span key={m.category} style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {cfg?.icon} {cfg?.label}: {m.count} vehicles
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { key: 'all', label: `All (${result.vehicles.length})` },
              { key: 'missing', label: `⚠️ Missing (${result.vehicles.filter(v => v.missingCategories.length > 0).length})` },
              { key: 'ok', label: `✅ Complete (${result.vehicles.filter(v => v.missingCategories.length === 0 && v.tripsCount > 0).length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setShowFilter(tab.key as any)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: showFilter === tab.key ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  color: showFilter === tab.key ? '#8b5cf6' : 'var(--color-text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vehicle List */}
          <div>
            {filteredVehicles.length === 0 ? (
              <div style={{
                padding: 40, textAlign: 'center', color: 'var(--color-text-muted)',
                background: 'var(--color-bg-secondary)', borderRadius: 16,
              }}>
                No vehicles match the selected filter.
              </div>
            ) : (
              filteredVehicles.map(v => (
                <VehicleRow key={v.vehicleId} v={v} onAddExpense={handleAddExpense} />
              ))
            )}
          </div>
        </>
      )}

      {/* Quick Add Expense Modal */}
      {addingExpense && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setAddingExpense(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1f2e', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {CATEGORY_CONFIG[addingExpense.category]?.icon} Add {CATEGORY_CONFIG[addingExpense.category]?.label} for {addingExpense.plateNo}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Go to the <strong>Expenses</strong> page to add this expense, or use the quick link below:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={`/dashboard/expenses?vehicleId=${addingExpense.vehicleId}`}
                className="btn btn-primary"
                style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px 16px' }}
              >
                📝 Go to Expenses
              </a>
              <button
                onClick={() => setAddingExpense(null)}
                className="btn btn-secondary"
                style={{ padding: '10px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isPending && (
        <div style={{
          background: 'var(--color-bg-secondary)', borderRadius: 20, padding: '60px 20px', textAlign: 'center',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Expense Tally & Audit
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto' }}>
            Select a period above to check if any expenses are missing for your vehicles. The system will flag vehicles that have trips but no fuel, toll, or maintenance entries logged.
          </div>
        </div>
      )}
    </div>
  )
}
