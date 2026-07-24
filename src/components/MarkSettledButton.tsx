'use client'

import { markSettled } from '@/lib/actions/settlements'
import { useState } from 'react'
import Modal from './Modal'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

interface SettlementInfo {
  id: string
  finalPayout: number
  ownerName: string
  status: string
  paidAmount?: number | null
  carryForward?: number | null
}

export default function MarkSettledButton({ settlement }: { settlement: SettlementInfo }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [paidInput, setPaidInput] = useState<string>(
    settlement.finalPayout > 0 ? settlement.finalPayout.toString() : '0'
  )
  const [error, setError] = useState<string | null>(null)

  const finalPayout = settlement.finalPayout
  const parsedPaid = parseFloat(paidInput) || 0
  const carryForward = finalPayout - parsedPaid

  const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setGlobalLoading(true)
    setError(null)

    toast.promise(
      markSettled(settlement.id, parsedPaid, carryForward),
      {
        loading: 'Marking as settled...',
        success: () => { setIsOpen(false); return 'Settlement updated and marked as settled!' },
        error: (err) => { setError(err.message || 'Failed'); return err.message || 'Failed' }
      }
    ).finally(() => {
      setLoading(false)
      setGlobalLoading(false)
    })
  }

  if (settlement.status === 'SETTLED') {
    return null
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setIsOpen(true)}>
        ✓ Mark Settled
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Finalize Settlement Payout">
        <form onSubmit={handleSubmit}>
          <div style={{
            padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Vehicle Owner: <strong>{settlement.ownerName}</strong>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>
              Calculated Final Payout:{' '}
              <span style={{ color: finalPayout > 0 ? '#22d3ee' : finalPayout < 0 ? '#ef4444' : 'inherit' }}>
                {finalPayout < 0 ? `−${fmt(finalPayout)} (Overdrawn Debt)` : fmt(finalPayout)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Actual Amount Paid / Settled (₹)
            </label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={paidInput}
              onChange={e => setPaidInput(e.target.value)}
              placeholder="0"
              required
            />
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {finalPayout < 0
                ? 'Enter negative number if owner paid back cash (e.g. -50000), or enter 0 to carry forward the debt.'
                : 'Enter the actual amount paid to the owner for this settlement.'
              }
            </div>
          </div>

          {/* Dynamic Live Status Preview */}
          <div style={{
            padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', lineHeight: 1.5,
            background: carryForward === 0 ? 'rgba(16,185,129,0.08)' : carryForward < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,211,238,0.08)',
            border: `1px solid ${carryForward === 0 ? 'rgba(16,185,129,0.2)' : carryForward < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,211,238,0.2)'}`,
            color: carryForward === 0 ? '#10b981' : carryForward < 0 ? '#ef4444' : '#22d3ee',
          }}>
            {carryForward === 0 && (
              <>✓ <strong>Fully Settled:</strong> 0 balance remaining. No carry forward needed.</>
            )}
            {carryForward < 0 && (
              <>⚠️ <strong>Carry Forward Debt:</strong> Owner debt of <strong>{fmt(carryForward)}</strong> will automatically carry forward to deduct from future settlements.</>
            )}
            {carryForward > 0 && (
              <>ℹ️ <strong>Carry Forward Credit:</strong> Remaining unpaid payout of <strong>{fmt(carryForward)}</strong> will carry forward to add to the next settlement payout.</>
            )}
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
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
                  Processing...
                </span>
              ) : (
                'Confirm & Mark Settled'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
