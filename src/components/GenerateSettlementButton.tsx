'use client'

import { generateSettlement, previewSettlement, SettlementCalc } from '@/lib/actions/settlements'
import { useState, useMemo } from 'react'
import Modal from './Modal'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

interface Props {
  owners: { id: string; ownerName: string }[]
  lastSettlementByOwner: Record<string, string> // ownerId → last periodEnd date string (YYYY-MM-DD)
}

const ALL_EXPENSE_TYPES = [
  { key: 'FUEL', label: '⛽ Fuel (ईंधन)' },
  { key: 'TOLL', label: '🛣️ Toll (टोल)' },
  { key: 'MAINTENANCE', label: '🔧 Maintenance (मेन्टेनेन्स)' },
  { key: 'DRIVER_ADVANCE', label: '👤 Driver Advance (ड्राइवर एडवांस)' },
  { key: 'CASH_PAYMENT', label: '💵 Cash Payment (नकद)' },
]

export default function GenerateSettlementButton({ owners, lastSettlementByOwner }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [selectedOwnerId, setSelectedOwnerId] = useState('')
  const [deductibleTypes, setDeductibleTypes] = useState<string[]>([
    'FUEL', 'TOLL', 'MAINTENANCE', 'DRIVER_ADVANCE', 'CASH_PAYMENT'
  ])
  const [preview, setPreview] = useState<SettlementCalc | null>(null)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // Compute auto "from" date: day after last settlement for this owner
  const autoFromDate = useMemo(() => {
    if (!selectedOwnerId || !lastSettlementByOwner[selectedOwnerId]) return ''
    const lastEnd = new Date(lastSettlementByOwner[selectedOwnerId])
    lastEnd.setDate(lastEnd.getDate() + 1)
    return lastEnd.toISOString().split('T')[0]
  }, [selectedOwnerId, lastSettlementByOwner])

  const hasLastSettlement = !!selectedOwnerId && !!lastSettlementByOwner[selectedOwnerId]

  function closeAndReset() {
    setIsOpen(false)
    setPreview(null)
    setPendingFormData(null)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      const calc = await previewSettlement(formData)
      setPreview(calc)
      setPendingFormData(formData)
    } catch (err: any) {
      setError(err.message || 'Failed to compute preview')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!pendingFormData) return
    setLoading(true)
    setGlobalLoading(true)
    setError(null)

    toast.promise(
      generateSettlement(pendingFormData),
      {
        loading: 'Generating settlement...',
        success: () => { closeAndReset(); return 'Settlement generated!' },
        error: (err) => { setError(err.message || 'Failed'); return err.message || 'Failed' }
      }
    ).finally(() => { setLoading(false); setGlobalLoading(false) })
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>+ Generate Settlement</button>

      <Modal isOpen={isOpen} onClose={closeAndReset} title={preview ? 'Review Settlement' : 'Generate Settlement'}>
        {!preview && <form action={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vehicle Owner</label>
            <select
              name="ownerId"
              className="form-select"
              required
              defaultValue=""
              onChange={e => setSelectedOwnerId(e.target.value)}
            >
              <option value="" disabled>Select owner</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.ownerName}</option>)}
            </select>
          </div>

          {/* Last settlement info badge */}
          {selectedOwnerId && (
            <div style={{
              padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-md)',
              fontSize: 12, lineHeight: 1.5,
              background: hasLastSettlement ? 'rgba(34,211,238,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${hasLastSettlement ? 'rgba(34,211,238,0.2)' : 'rgba(245,158,11,0.2)'}`,
              color: hasLastSettlement ? '#22d3ee' : '#f59e0b',
            }}>
              {hasLastSettlement
                ? <>📋 Last settled till <strong>{new Date(lastSettlementByOwner[selectedOwnerId]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>. From date is set to the next day.</>
                : <>🆕 No previous settlement found for this owner. Set the start date manually.</>
              }
            </div>
          )}

          {/* From-To date fields */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input
                name="periodStart"
                type="date"
                className="form-input"
                key={autoFromDate || 'no-auto'} // reset when owner changes
                defaultValue={autoFromDate || ''}
                max={today}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input name="periodEnd" type="date" className="form-input" defaultValue={today} max={today} required />
            </div>
          </div>

          {/* Deductible Expenses Selection */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 8 }}>
              Deductible Expenses (कटौती के खर्चे)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              {ALL_EXPENSE_TYPES.map(type => (
                <label key={type.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    name="deductibleTypes"
                    value={type.key}
                    checked={deductibleTypes.includes(type.key)}
                    onChange={e => {
                      if (e.target.checked) {
                        setDeductibleTypes([...deductibleTypes, type.key])
                      } else {
                        setDeductibleTypes(deductibleTypes.filter(k => k !== type.key))
                      }
                    }}
                    style={{ accentColor: '#22d3ee', width: 16, height: 16 }}
                  />
                  <span style={{ color: deductibleTypes.includes(type.key) ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Uncheck Toll if you do not want to deduct toll expenses in this settlement.
            </div>
          </div>

          {/* Custom Rate Override */}
          <div className="form-group">
            <label className="form-label">Custom Rate per MT (₹) <span style={{ color: '#64748b', fontWeight: 400 }}>— optional</span></label>
            <input name="customRate" type="number" step="0.01" min="0" className="form-input" placeholder="Leave blank to use default rates" />
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              If set, this rate will override all default/owner/vehicle rates for this settlement only.
            </div>
          </div>

          <div style={{
            padding: '12px 16px', background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)',
            marginBottom: '16px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5,
          }}>
            💡 Only trips, selected deductible expenses, and advances within the date range will be included.
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || owners.length === 0}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg
                    style={{ animation: 'spin 0.8s linear infinite' }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Calculating...
                </span>
              ) : (
                'Preview Settlement'
              )}
            </button>
          </div>
        </form>}

        {preview && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              {preview.ownerName} · {new Date(preview.periodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(preview.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {preview.tripsCount} trips
            </div>

            {/* Per-rate breakdown — shows exactly which rate period each trip fell in */}
            {preview.rateBreakdown.length > 0 && (
              <div style={{ marginBottom: 14, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {preview.rateBreakdown.map(g => (
                  <div key={g.rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{g.trips} trips × ₹{g.rate}/MT ({g.weight.toFixed(2)} MT)</span>
                    <span>{fmt(g.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginBottom: 16 }}>
              <Row label="Gross Payout" value={fmt(preview.totalOwnerPayout)} />
              <Row label="Fuel" value={`- ${fmt(preview.totalFuel)}`} />
              <Row label="Toll" value={`- ${fmt(preview.totalTolls)}`} />
              <Row label="Maintenance" value={`- ${fmt(preview.totalMaint)}`} />
              <Row label="Driver Advance + Cash" value={`- ${fmt(preview.totalDriverAdvances + preview.totalOther)}`} />
              <Row label="Owner Advances Recovered" value={`- ${fmt(preview.availableAdvance)}`} />
              {preview.priorCarryForward !== 0 && (
                <Row label="Prior Carry-Forward" value={`${preview.priorCarryForward > 0 ? '+' : ''}${fmt(preview.priorCarryForward)}`} />
              )}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 4 }}>
                <Row label="Final Payout" value={fmt(preview.finalPayout)} bold />
              </div>
            </div>

            {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

            <div className="modal-footer" style={{ padding: '0', border: 'none', display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary" disabled={loading} onClick={() => { setPreview(null); setPendingFormData(null) }}>
                ← Edit
              </button>
              <button type="button" className="btn btn-primary" disabled={loading} onClick={handleConfirm}>
                {loading ? 'Generating...' : 'Confirm & Create Settlement'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: bold ? 700 : 400, fontSize: bold ? 14 : 13 }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
