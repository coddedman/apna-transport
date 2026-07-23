'use client'

import { useState, useTransition } from 'react'
import { addDailyLumpsum, updateDailyLumpsum, deleteDailyLumpsum, generateTally, type TallyResult, type DailyEntry, type CategoryTally } from '@/lib/actions/tally'

const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`

const CAT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  FUEL: { label: 'Fuel', icon: '⛽', color: '#f59e0b' },
  TOLL: { label: 'Toll', icon: '🛣️', color: '#3b82f6' },
  MAINTENANCE: { label: 'Maintenance', icon: '🔧', color: '#ef4444' },
  DRIVER_ADVANCE: { label: 'Driver Advance', icon: '👤', color: '#8b5cf6' },
  CASH_PAYMENT: { label: 'Cash Payment', icon: '💵', color: '#10b981' },
  OWNER_ADVANCE: { label: 'Owner Advance', icon: '🏦', color: '#ec4899' },
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  match: { label: 'Matched ✓', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
  over: { label: 'Over-logged', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '📈' },
  under: { label: 'Under-logged', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⚠️' },
  'no-lumpsum': { label: 'No Lumpsum', color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: '➖' },
  'no-expenses': { label: 'No Vehicle Entries', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '❓' },
}

function getFortnightPresets() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const presets = []

  for (let i = 0; i < 4; i++) {
    const adjMonth = m - Math.floor(i / 2)
    const adjYear = y + Math.floor(adjMonth / 12) - (adjMonth < 0 ? 1 : 0)
    const month = ((adjMonth % 12) + 12) % 12
    const lastDay = new Date(adjYear, month + 1, 0).getDate()
    const monthName = new Date(adjYear, month, 1).toLocaleDateString('en-IN', { month: 'short' })
    const pad = (n: number) => String(n).padStart(2, '0')

    if (i % 2 === 0) {
      presets.push({
        label: `${monthName} 16-${lastDay}`,
        start: `${adjYear}-${pad(month + 1)}-16`,
        end: `${adjYear}-${pad(month + 1)}-${lastDay}`,
      })
    } else {
      presets.push({
        label: `${monthName} 1-15`,
        start: `${adjYear}-${pad(month + 1)}-01`,
        end: `${adjYear}-${pad(month + 1)}-15`,
      })
    }
  }

  const seen = new Set<string>()
  return presets.filter(p => {
    if (seen.has(p.start)) return false
    seen.add(p.start)
    return true
  })
}

export default function TallyPage() {
  const [isPending, startTransition] = useTransition()
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [tally, setTally] = useState<TallyResult | null>(null)

  // Add Lumpsum Form
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [addCategory, setAddCategory] = useState('FUEL')
  const [addAmount, setAddAmount] = useState('')
  const [addRemarks, setAddRemarks] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')

  const presets = getFortnightPresets()

  function loadTally(start: string, end: string) {
    setStartDate(start)
    setEndDate(end)
    startTransition(async () => {
      try {
        const data = await generateTally(start, end)
        setTally(data)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleAddLumpsum(e: React.FormEvent) {
    e.preventDefault()
    if (!addAmount || parseFloat(addAmount) <= 0) return

    startTransition(async () => {
      try {
        await addDailyLumpsum({
          date: addDate,
          category: addCategory,
          amount: parseFloat(addAmount),
          remarks: addRemarks || undefined,
        })
        setAddAmount('')
        setAddRemarks('')
        // Reload tally if dates overlap
        if (startDate && endDate) {
          const data = await generateTally(startDate, endDate)
          setTally(data)
        }
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    startTransition(async () => {
      try {
        await deleteDailyLumpsum(id)
        if (startDate && endDate) {
          const data = await generateTally(startDate, endDate)
          setTally(data)
        }
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      try {
        await updateDailyLumpsum(id, parseFloat(editAmount))
        setEditingId(null)
        if (startDate && endDate) {
          const data = await generateTally(startDate, endDate)
          setTally(data)
        }
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const card: React.CSSProperties = {
    background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, marginBottom: 16,
  }

  return (
    <div>
      {/* ==================== ADD DAILY LUMPSUM ==================== */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(245,158,11,0.1)', padding: '5px 8px', borderRadius: 8 }}>📝</span>
          Log Daily Lumpsum Expense
        </div>

        <form onSubmit={handleAddLumpsum}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 10 }}>Date *</label>
              <input type="date" className="form-input" value={addDate} onChange={e => setAddDate(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 10 }}>Category *</label>
              <select className="form-select" value={addCategory} onChange={e => setAddCategory(e.target.value)}>
                {Object.entries(CAT_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 10 }}>Amount (₹) *</label>
              <input
                type="number" className="form-input" placeholder="0"
                value={addAmount} onChange={e => setAddAmount(e.target.value)}
                min="1" required style={{ fontSize: 16, fontWeight: 700 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 10 }}>Remarks</label>
              <input
                type="text" className="form-input" placeholder="Optional note..."
                value={addRemarks} onChange={e => setAddRemarks(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isPending || !addAmount} style={{ marginTop: 14, padding: '10px 24px' }}>
            {isPending ? '⏳ Saving...' : `📝 Log ${CAT_CONFIG[addCategory]?.label || addCategory}`}
          </button>
        </form>
      </div>

      {/* ==================== PERIOD SELECTOR ==================== */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(139,92,246,0.1)', padding: '5px 8px', borderRadius: 8 }}>📊</span>
          Tally & Reconcile — Select Period
        </div>

        {/* Presets */}
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

        {/* Custom */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 10 }}>From</label>
            <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 10 }}>To</label>
            <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => loadTally(startDate, endDate)} disabled={isPending} style={{ padding: '7px 16px' }}>
            {isPending ? '⏳...' : '📊 Tally'}
          </button>
        </div>
      </div>

      {/* ==================== TALLY RESULTS ==================== */}
      {tally && (
        <>
          {/* Grand Total Banner */}
          <div style={{
            ...card,
            background: Math.abs(tally.grandTotals.difference) < 10
              ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)'
              : tally.grandTotals.difference > 0
                ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)'
                : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)',
            border: `1px solid ${Math.abs(tally.grandTotals.difference) < 10 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 10 }}>
              {tally.periodLabel} — Grand Tally
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 4 }}>Lumpsum Paid</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{fmt(tally.grandTotals.lumpsumTotal)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 4 }}>Vehicle Expenses Total</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#8b5cf6' }}>{fmt(tally.grandTotals.vehicleExpenseTotal)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 4 }}>Difference</div>
                <div style={{
                  fontSize: 28, fontWeight: 900,
                  color: Math.abs(tally.grandTotals.difference) < 10 ? '#10b981' : '#ef4444',
                }}>
                  {tally.grandTotals.difference >= 0 ? '+' : '-'}{fmt(tally.grandTotals.difference)}
                </div>
                {Math.abs(tally.grandTotals.difference) >= 10 && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                    {tally.grandTotals.difference > 0 ? '⚠️ Vehicle expenses under-logged' : '📈 Vehicle expenses over-logged'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category-wise Tally Cards */}
          <div style={{ ...card, paddingBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Category-wise Reconciliation
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tally.categories.map(cat => {
                const cfg = CAT_CONFIG[cat.category] || { label: cat.category, icon: '📦', color: '#64748b' }
                const st = STATUS_STYLE[cat.status]
                const barWidth = cat.lumpsumTotal > 0 || cat.vehicleExpenseTotal > 0
                  ? Math.min(100, cat.percentMatch)
                  : 0

                return (
                  <div key={cat.category} style={{
                    padding: '14px 16px', borderRadius: 14,
                    background: cat.status === 'under' ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${cat.status === 'under' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  }}>
                    {/* Row Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cfg.color, flex: 1 }}>{cfg.label}</span>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                        color: st.color, background: st.bg,
                      }}>
                        {st.icon} {st.label}
                      </span>
                    </div>

                    {/* Amounts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>Lumpsum Paid</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: cat.lumpsumTotal > 0 ? '#f59e0b' : 'var(--color-text-muted)' }}>
                          {cat.lumpsumTotal > 0 ? fmt(cat.lumpsumTotal) : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{cat.lumpsumEntries} entries</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>Vehicle Expenses</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: cat.vehicleExpenseTotal > 0 ? '#8b5cf6' : 'var(--color-text-muted)' }}>
                          {cat.vehicleExpenseTotal > 0 ? fmt(cat.vehicleExpenseTotal) : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{cat.vehicleExpenseEntries} entries</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>Difference</div>
                        <div style={{
                          fontSize: 18, fontWeight: 900,
                          color: Math.abs(cat.difference) < 1 ? '#10b981' : cat.difference > 0 ? '#ef4444' : '#3b82f6',
                        }}>
                          {Math.abs(cat.difference) < 1 ? '✓ 0' : `${cat.difference > 0 ? '+' : '-'}${fmt(cat.difference)}`}
                        </div>
                      </div>
                    </div>

                    {/* Match Bar */}
                    {(cat.lumpsumTotal > 0 || cat.vehicleExpenseTotal > 0) && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                          <span>Match</span>
                          <span style={{ fontWeight: 700, color: barWidth >= 95 ? '#10b981' : barWidth >= 70 ? '#f59e0b' : '#ef4444' }}>
                            {barWidth.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3, transition: 'width 0.5s ease',
                            width: `${barWidth}%`,
                            background: barWidth >= 95 ? '#10b981' : barWidth >= 70 ? '#f59e0b' : '#ef4444',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daily Entries Log */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              📝 Daily Lumpsum Entries ({tally.dailyEntries.length})
            </div>

            {tally.dailyEntries.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px 0', fontSize: 12 }}>
                No lumpsum entries for this period. Use the form above to log daily expenses.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tally.dailyEntries.map(entry => {
                  const cfg = CAT_CONFIG[entry.category] || { label: entry.category, icon: '📦', color: '#64748b' }
                  const isEditing = editingId === entry.id
                  return (
                    <div key={entry.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      background: 'rgba(255,255,255,0.02)', borderRadius: 10, flexWrap: 'wrap',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', minWidth: 70, fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, minWidth: 90 }}>{cfg.label}</span>

                      {isEditing ? (
                        <>
                          <input type="number" className="form-input" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={{ width: 100, fontSize: 12, padding: '4px 8px' }} />
                          <button onClick={() => handleSaveEdit(entry.id)} disabled={isPending} style={{ fontSize: 10, padding: '3px 8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditingId(null)} style={{ fontSize: 10, padding: '3px 8px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)' }}>{fmt(entry.amount)}</span>
                          {entry.remarks && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>— {entry.remarks}</span>}
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            <button onClick={() => { setEditingId(entry.id); setEditAmount(String(entry.amount)) }} style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => handleDelete(entry.id)} disabled={isPending} style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer' }}>🗑</button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!tally && !isPending && (
        <div style={{
          ...card, textAlign: 'center', padding: '60px 20px',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Expense Tally & Reconciliation
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
            <strong>Step 1:</strong> Log daily lumpsum expenses above (e.g., "₹15,000 fuel today").<br />
            <strong>Step 2:</strong> Select a period and click "Tally" to compare lumpsum vs vehicle-level expenses.<br />
            <strong>Step 3:</strong> Fix any mismatches by adding missing vehicle expenses.
          </div>
        </div>
      )}
    </div>
  )
}
