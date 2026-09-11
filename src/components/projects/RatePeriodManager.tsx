'use client'

import { useState, useTransition } from 'react'
import { getRatePeriods, createRatePeriod, updateRatePeriod, deleteRatePeriod, generateFortnightlyPeriods } from '@/lib/actions/ratePeriods'

interface RatePeriod {
  id: string
  periodStart: string
  periodEnd: string
  partyRate: number
  ownerRate: number
  label: string | null
}

interface Props {
  projectId: string
  projectName: string
  defaultPartyRate: number
  defaultOwnerRate: number
}

export default function RatePeriodManager({ projectId, projectName, defaultPartyRate, defaultOwnerRate }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [periods, setPeriods] = useState<RatePeriod[]>([])
  const [loaded, setLoaded] = useState(false)

  // Form state for manual add
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [newPartyRate, setNewPartyRate] = useState(String(defaultPartyRate))
  const [newOwnerRate, setNewOwnerRate] = useState(String(defaultOwnerRate))

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPartyRate, setEditPartyRate] = useState('')
  const [editOwnerRate, setEditOwnerRate] = useState('')

  function loadPeriods() {
    startTransition(async () => {
      try {
        const data = await getRatePeriods(projectId)
        setPeriods(data.map(p => ({
          ...p,
          periodStart: p.periodStart.toISOString(),
          periodEnd: p.periodEnd.toISOString(),
        })) as any)
        setLoaded(true)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function toggleExpand() {
    if (!expanded && !loaded) loadPeriods()
    setExpanded(!expanded)
  }

  function handleAutoGenerate() {
    const now = new Date()
    startTransition(async () => {
      try {
        const result = await generateFortnightlyPeriods(projectId, now.getFullYear(), now.getMonth(), 3)
        alert(`Created ${result.created} rate period(s) out of ${result.total} slots`)
        loadPeriods()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleAddPeriod(e: React.FormEvent) {
    e.preventDefault()
    if (!newStart || !newEnd) return

    startTransition(async () => {
      try {
        await createRatePeriod({
          projectId,
          periodStart: newStart,
          periodEnd: newEnd,
          partyRate: parseFloat(newPartyRate),
          ownerRate: parseFloat(newOwnerRate),
        })
        setShowAddForm(false)
        setNewStart(''); setNewEnd('')
        loadPeriods()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function startEdit(p: RatePeriod) {
    setEditingId(p.id)
    setEditPartyRate(String(p.partyRate))
    setEditOwnerRate(String(p.ownerRate))
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      try {
        await updateRatePeriod(id, { partyRate: parseFloat(editPartyRate), ownerRate: parseFloat(editOwnerRate) })
        setEditingId(null)
        loadPeriods()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleDeletePeriod(id: string) {
    if (!confirm('Delete this rate period?')) return
    startTransition(async () => {
      try {
        await deleteRatePeriod(id)
        loadPeriods()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const isActive = (p: RatePeriod) => {
    const now = new Date()
    return new Date(p.periodStart) <= now && new Date(p.periodEnd) >= now
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={toggleExpand}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)',
          background: expanded ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
          color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s',
        }}
      >
        <span>📅 Fortnightly Rate Periods</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {expanded ? '▲ Collapse' : '▼ Expand'} {loaded ? `(${periods.length})` : ''}
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 8, padding: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoGenerate}
              disabled={isPending}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6',
              }}
            >
              {isPending ? '...' : '⚡ Auto-Generate (3 months)'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981',
              }}
            >
              + Add Custom Period
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddPeriod} style={{ marginBottom: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Start Date</label>
                  <input type="date" className="form-input" value={newStart} onChange={e => setNewStart(e.target.value)} style={{ fontSize: 11, padding: '6px 8px' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>End Date</label>
                  <input type="date" className="form-input" value={newEnd} onChange={e => setNewEnd(e.target.value)} style={{ fontSize: 11, padding: '6px 8px' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Party Rate (₹)</label>
                  <input type="number" className="form-input" value={newPartyRate} onChange={e => setNewPartyRate(e.target.value)} style={{ fontSize: 11, padding: '6px 8px' }} required min="0" />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Owner Rate (₹)</label>
                  <input type="number" className="form-input" value={newOwnerRate} onChange={e => setNewOwnerRate(e.target.value)} style={{ fontSize: 11, padding: '6px 8px' }} required min="0" />
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isPending} style={{ fontSize: 11, padding: '5px 12px' }}>
                  {isPending ? '...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ fontSize: 11, padding: '5px 12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 6, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Periods List */}
          {periods.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px 0', fontSize: 12 }}>
              No rate periods defined. Use "Auto-Generate" to create fortnightly slots.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {periods.map(p => {
                const active = isActive(p)
                const isEditing = editingId === p.id
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      background: active ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                      border: active ? '1px solid rgba(16,185,129,0.15)' : '1px solid transparent',
                      borderRadius: 10, fontSize: 12, flexWrap: 'wrap',
                    }}
                  >
                    {active && (
                      <span style={{ fontSize: 8, background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Active
                      </span>
                    )}
                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: 140 }}>
                      {p.label || `${fmtDate(p.periodStart)} – ${fmtDate(p.periodEnd)}`}
                    </span>

                    {isEditing ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Party:</span>
                          <input type="number" className="form-input" value={editPartyRate} onChange={e => setEditPartyRate(e.target.value)} style={{ width: 70, fontSize: 11, padding: '4px 6px' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Owner:</span>
                          <input type="number" className="form-input" value={editOwnerRate} onChange={e => setEditOwnerRate(e.target.value)} style={{ width: 70, fontSize: 11, padding: '4px 6px' }} />
                        </div>
                        <button onClick={() => handleSaveEdit(p.id)} disabled={isPending} style={{ fontSize: 10, padding: '3px 8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                          ✓ Save
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ fontSize: 10, padding: '3px 8px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>₹{p.partyRate}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>₹{p.ownerRate}</span>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>(party/owner)</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                          <button onClick={() => startEdit(p)} style={{ fontSize: 10, padding: '3px 8px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                            ✏️
                          </button>
                          <button onClick={() => handleDeletePeriod(p.id)} disabled={isPending} style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                            🗑
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
