'use client'

import { useState, useTransition } from 'react'
import Modal from './Modal'
import { updateExpense, deleteExpense } from '@/lib/actions/expenses'
import toast from 'react-hot-toast'

interface EditExpenseButtonProps {
  expense: {
    id: string
    date: string        // localeDateString — need raw ISO for form
    rawDate: string     // YYYY-MM-DD
    vehicleId: string
    vehicle: string
    projectId: string | null
    project: string
    type: string
    amount: number
    description: string
  }
  vehicles: { id: string; plateNo: string }[]
  projects: { id: string; projectName: string }[]
}

export default function EditExpenseButton({ expense, vehicles, projects }: EditExpenseButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('expenseId', expense.id)

    startTransition(async () => {
      try {
        await updateExpense(fd)
        toast.success('Expense updated')
        setIsOpen(false)
      } catch (err: any) {
        toast.error(err.message || 'Failed to update')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Delete this expense record?')) return
    startTransition(async () => {
      try {
        await deleteExpense(expense.id)
        toast.success('Expense deleted')
        setIsOpen(false)
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete')
      }
    })
  }

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        style={{ fontSize: '10px', padding: '2px 6px' }}
        onClick={() => setIsOpen(true)}
        title="Edit expense"
      >
        ✏️
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Expense">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" name="date" type="date" defaultValue={expense.rawDate} required />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle</label>
              <select className="form-select" name="vehicleId" defaultValue={expense.vehicleId} required>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plateNo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" name="amount" type="number" step="0.01" min="0" defaultValue={expense.amount} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" name="type" defaultValue={expense.type} required>
                <option value="FUEL">Fuel</option>
                <option value="DRIVER_ADVANCE">Driver Advance</option>
                <option value="OWNER_ADVANCE">Owner Advance</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TOLL">Toll</option>
                <option value="CASH_PAYMENT">Cash Payment</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project (optional)</label>
            <select className="form-select" name="projectId" defaultValue={expense.projectId || ''}>
              <option value="">— No specific project —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <input className="form-input" name="remarks" type="text" defaultValue={expense.description !== expense.type ? expense.description : ''} placeholder="Remarks..." />
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
