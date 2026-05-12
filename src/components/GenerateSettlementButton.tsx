'use client'

import { generateSettlement } from '@/lib/actions/settlements'
import { useState } from 'react'
import Modal from './Modal'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

interface Props { owners: { id: string; ownerName: string }[] }

export default function GenerateSettlementButton({ owners }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [tillDate, setTillDate] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  async function handleSubmit(formData: FormData) {
    // If "till date" mode, remove periodStart so server uses all-time
    if (tillDate) formData.delete('periodStart')

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
            <select name="ownerId" className="form-select" required defaultValue="">
              <option value="" disabled>Select owner</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.ownerName}</option>)}
            </select>
          </div>

          {/* Till Date toggle */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={tillDate} onChange={e => setTillDate(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
              <span style={{ fontWeight: tillDate ? 700 : 400, color: tillDate ? '#f59e0b' : '#94a3b8' }}>
                Settle till a specific date (all trips from beginning)
              </span>
            </label>
          </div>

          {tillDate ? (
            <div className="form-group">
              <label className="form-label">Settle everything up to</label>
              <input name="periodEnd" type="date" className="form-input" defaultValue={today} max={today} required />
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Period Start</label>
                <input name="periodStart" type="date" className="form-input" defaultValue={monthStart} max={today} required />
              </div>
              <div className="form-group">
                <label className="form-label">Period End</label>
                <input name="periodEnd" type="date" className="form-input" defaultValue={today} max={today} required />
              </div>
            </div>
          )}

          <div style={{
            padding: '12px 16px', background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)',
            marginBottom: '16px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5,
          }}>
            💡 {tillDate
              ? 'This will calculate owner payout (weight × rate) for all trips up to the selected date, deduct operational expenses, and subtract all cumulative advances ever given.'
              : 'This will calculate owner payout for trips within the selected date range, deduct expenses, and subtract all cumulative advances.'
            }
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
