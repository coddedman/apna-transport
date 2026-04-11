'use client'

import { createExpense } from '@/lib/actions/expenses'
import { useState } from 'react'

interface ExpenseFormProps {
  vehicles: { id: string, plateNo: string }[]
  onSuccess: () => void
}

export default function ExpenseForm({ vehicles, onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await createExpense(formData)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
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
            <option value="MAINTENANCE">Maintenance</option>
            <option value="TOLL">Toll</option>
            <option value="CASH_PAYMENT">Cash Payment</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Remarks / Description</label>
        <input 
          name="remarks" 
          type="text" 
          className="form-input" 
          placeholder="e.g. Paid for diesel at HP pump"
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
