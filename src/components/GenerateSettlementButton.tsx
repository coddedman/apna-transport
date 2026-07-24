'use client'

import { generateSettlement } from '@/lib/actions/settlements'
import { useState, useMemo } from 'react'
import Modal from './Modal'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

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

  const today = new Date().toISOString().split('T')[0]

  // Compute auto "from" date: day after last settlement for this owner
  const autoFromDate = useMemo(() => {
    if (!selectedOwnerId || !lastSettlementByOwner[selectedOwnerId]) return ''
    const lastEnd = new Date(lastSettlementByOwner[selectedOwnerId])
    lastEnd.setDate(lastEnd.getDate() + 1)
    return lastEnd.toISOString().split('T')[0]
  }, [selectedOwnerId, lastSettlementByOwner])

  const hasLastSettlement = !!selectedOwnerId && !!lastSettlementByOwner[selectedOwnerId]

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setGlobalLoading(true)
    setError(null)

    toast.promise(
      generateSettlement(formData),
      {
        loading: 'Generating settlement...',
        success: () => { setIsOpen(false); return 'Settlement generated!' },
        error: (err) => { setError(err.message || 'Failed'); return err.message || 'Failed' }
      }
    ).finally(() => { setLoading(false); setGlobalLoading(false) })
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>+ Generate Settlement</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Generate Settlement">
        <form action={handleSubmit}>
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
              {loading ? 'Generating...' : 'Generate Settlement'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
