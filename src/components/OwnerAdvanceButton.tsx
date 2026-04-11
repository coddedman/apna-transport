'use client'

import { useState, useTransition } from 'react'
import Modal from './Modal'
import { createOwnerAdvance } from '@/lib/actions/ownerAdvances'
import toast from 'react-hot-toast'

interface OwnerAdvanceButtonProps {
  owners: { id: string; ownerName: string }[]
  projects: { id: string; projectName: string }[]
}

export default function OwnerAdvanceButton({ owners, projects }: OwnerAdvanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await createOwnerAdvance(formData)
        toast.success('Owner advance logged successfully')
        setIsOpen(false)
      } catch (err: any) {
        toast.error(err.message || 'Failed to log advance')
      }
    })
  }

  return (
    <>
      <button
        className="btn btn-secondary"
        onClick={() => setIsOpen(true)}
      >
        💰 Log Advance
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Log Owner Advance">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              className="form-input"
              name="date"
              type="date"
              defaultValue={today}
              max={today}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Owner *</label>
            <select className="form-select" name="ownerId" required>
              <option value="">— Select Owner —</option>
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.ownerName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              className="form-input"
              name="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 5000"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Project (optional)</label>
            <select className="form-select" name="projectId">
              <option value="">— No specific project —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <input
              className="form-input"
              name="remarks"
              type="text"
              placeholder="e.g. weekly advance, fuel advance..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Logging...' : '💰 Log Advance'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
