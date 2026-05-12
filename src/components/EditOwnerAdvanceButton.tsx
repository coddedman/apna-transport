'use client'

import { useState, useTransition } from 'react'
import Modal from './Modal'
import { updateOwnerAdvance, deleteOwnerAdvance } from '@/lib/actions/ownerAdvances'
import toast from 'react-hot-toast'

interface EditOwnerAdvanceButtonProps {
  advance: {
    id: string
    date: string        // localeDateString
    rawDate: string     // YYYY-MM-DD
    amount: number
    projectId: string | null
    project: string | null
    remarks: string
  }
  projects: { id: string; projectName: string }[]
}

export default function EditOwnerAdvanceButton({ advance, projects }: EditOwnerAdvanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('advanceId', advance.id)

    startTransition(async () => {
      try {
        await updateOwnerAdvance(fd)
        toast.success('Advance updated')
        setIsOpen(false)
      } catch (err: any) {
        toast.error(err.message || 'Failed to update advance')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Delete this advance record?')) return
    startTransition(async () => {
      try {
        await deleteOwnerAdvance(advance.id)
        toast.success('Advance deleted')
        setIsOpen(false)
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete advance')
      }
    })
  }

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        style={{ fontSize: '10px', padding: '2px 6px' }}
        onClick={() => setIsOpen(true)}
        title="Edit advance"
      >
        ✏️
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Owner Advance">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" name="date" type="date" defaultValue={advance.rawDate} required />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className="form-input" name="amount" type="number" step="0.01" min="1" defaultValue={advance.amount} required />
          </div>

          <div className="form-group">
            <label className="form-label">Project (optional)</label>
            <select className="form-select" name="projectId" defaultValue={advance.projectId || ''}>
              <option value="">— No specific project —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <input className="form-input" name="remarks" type="text" defaultValue={advance.remarks} placeholder="Remarks..." />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)' }}
              disabled={isPending}
              onClick={handleDelete}
            >
              🗑️ Delete
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
