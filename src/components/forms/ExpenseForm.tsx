'use client'

import { createExpense } from '@/lib/actions/expenses'
import { useState } from 'react'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

interface ExpenseFormProps {
  vehicles: { id: string, plateNo: string }[]
  projects: { id: string, projectName: string }[]
  onSuccess: () => void
}

export default function ExpenseForm({ vehicles, projects, onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setGlobalLoading(true)
    setError(null)
    
    toast.promise(
      createExpense(formData),
      {
        loading: 'Logging expense...',
        success: () => {
          onSuccess()
          return 'Expense logged successfully!'
        },
        error: (err) => {
          setError(err.message || 'Something went wrong')
          return err.message || 'Failed to log expense'
        }
      }
    ).finally(() => {
      setLoading(false)
      setGlobalLoading(false)
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Expense Date</label>
          <input 
            name="date" 
            type="date" 
            className="form-input" 
            defaultValue={today}
            max={today}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Vehicle</label>
          <select name="vehicleId" className="form-select" required defaultValue="">
            <option value="" disabled>Select vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plateNo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input 
            name="amount" 
            type="number" 
            step="0.01"
            className="form-input" 
            placeholder="0.00" 
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select name="type" className="form-select" required defaultValue="FUEL">
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
        <label className="form-label">Project (Optional)</label>
        <select name="projectId" className="form-select" defaultValue="">
          <option value="">No specific project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.projectName}</option>
          ))}
        </select>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Assigning a project helps in project-wise profitability analysis.
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Remarks / Description</label>
        <input 
          name="remarks" 
          type="text" 
          className="form-input" 
          placeholder="e.g. Advance given for trip"
        />
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || vehicles.length === 0}>
          {loading ? 'Logging...' : 'Log Expense Record'}
        </button>
      </div>
    </form>
  )
}
