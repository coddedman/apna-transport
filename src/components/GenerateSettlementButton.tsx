'use client'

import { generateSettlement } from '@/lib/actions/settlements'
import { useState } from 'react'
import Modal from './Modal'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

interface GenerateSettlementButtonProps {
  owners: { id: string, ownerName: string }[]
}

export default function GenerateSettlementButton({ owners }: GenerateSettlementButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)

  // ... (keeping existing date logic)
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setGlobalLoading(true)
    setError(null)
    
    toast.promise(
      generateSettlement(formData),
      {
        loading: 'Generating settlement...',
        success: () => {
          setIsOpen(false)
          return 'Settlement generated successfully!'
        },
        error: (err) => {
          setError(err.message || 'Failed to generate')
          return err.message || 'Failed to generate'
        }
      }
    ).finally(() => {
      setLoading(false)
      setGlobalLoading(false)
    })
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + Generate Settlement
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Generate Settlement">
        <form action={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vehicle Owner</label>
            <select name="ownerId" className="form-select" required defaultValue="">
              <option value="" disabled>Select owner</option>
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.ownerName}</option>
              ))}
            </select>
          </div>

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

          <div style={{
            padding: '12px 16px', background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)',
            marginBottom: '16px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5,
          }}>
            💡 This will calculate all trip revenue and expenses for the selected owner's vehicles within the date range and create a settlement record.
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
