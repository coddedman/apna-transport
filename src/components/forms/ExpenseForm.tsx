'use client'

import { createMultipleExpenses } from '@/lib/actions/expenses'
import { useState } from 'react'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

interface ExpenseFormProps {
  vehicles: { id: string, plateNo: string }[]
  projects: { id: string, projectName: string }[]
  onSuccess: () => void
}

interface ExpenseRow {
  id: string
  date: string
  vehicleId: string
  amount: string
  type: string
  projectId: string
  remarks: string
}

export default function ExpenseForm({ vehicles, projects, onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  
  const today = new Date().toISOString().split('T')[0]

  const createEmptyRow = (): ExpenseRow => ({
    id: Math.random().toString(36).substring(7),
    date: today,
    vehicleId: '',
    amount: '',
    type: 'FUEL',
    projectId: '',
    remarks: ''
  })

  const [rows, setRows] = useState<ExpenseRow[]>([createEmptyRow()])

  const updateRow = (id: string, field: keyof ExpenseRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, createEmptyRow()])
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id))
  const duplicateRow = (id: string) => {
    const rowToCopy = rows.find(r => r.id === id)
    if (rowToCopy) setRows(prev => [...prev, { ...rowToCopy, id: Math.random().toString(36).substring(7) }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate rows
    const validRows = rows.filter(r => r.vehicleId && r.amount && parseFloat(r.amount) > 0)
    if (validRows.length === 0) {
      toast.error('Please fill at least one expense completely')
      return
    }

    setLoading(true)
    setGlobalLoading(true)
    setError(null)
    
    const payload = validRows.map(r => ({
      vehicleId: r.vehicleId,
      amount: parseFloat(r.amount),
      type: r.type,
      remarks: r.remarks,
      date: r.date,
      projectId: r.projectId || undefined
    }))
    
    toast.promise(
      createMultipleExpenses(payload),
      {
        loading: `Logging ${validRows.length} expenses...`,
        success: (res) => {
          onSuccess()
          return `Successfully logged ${res.count} expenses!`
        },
        error: (err) => {
          setError(err.message || 'Something went wrong')
          return err.message || 'Failed to log expenses'
        }
      }
    ).finally(() => {
      setLoading(false)
      setGlobalLoading(false)
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Table Header */}
      <div style={{ display: 'flex', gap: '12px', padding: '0 12px', fontSize: '12px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
        <div style={{ width: '120px' }}>Date</div>
        <div style={{ flex: 1.5 }}>Vehicle *</div>
        <div style={{ flex: 1 }}>Amount (₹) *</div>
        <div style={{ flex: 1 }}>Category *</div>
        <div style={{ flex: 1.5 }}>Project</div>
        <div style={{ flex: 1.5 }}>Remarks</div>
        <div style={{ width: '40px', textAlign: 'center' }}>⚙️</div>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
        {rows.map((row, i) => (
          <div key={row.id} style={{ display: 'flex', gap: '12px', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
            <input 
              type="date" 
              className="form-input" 
              value={row.date} max={today} required
              onChange={e => updateRow(row.id, 'date', e.target.value)}
              style={{ width: '120px', padding: '8px 10px', fontSize: '13px' }}
            />
            <select 
              className="form-select" 
              value={row.vehicleId} required
              onChange={e => updateRow(row.id, 'vehicleId', e.target.value)}
              style={{ flex: 1.5, padding: '8px 10px', fontSize: '13px' }}
            >
              <option value="" disabled>Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNo}</option>)}
            </select>
            <input 
              type="number" step="0.01" min="1"
              className="form-input" placeholder="0.00" required
              value={row.amount}
              onChange={e => updateRow(row.id, 'amount', e.target.value)}
              style={{ flex: 1, padding: '8px 10px', fontSize: '13px' }}
            />
            <select 
              className="form-select" 
              value={row.type} required
              onChange={e => updateRow(row.id, 'type', e.target.value)}
              style={{ flex: 1, padding: '8px 10px', fontSize: '13px' }}
            >
              <option value="FUEL">⛽ Fuel</option>
              <option value="DRIVER_ADVANCE">👤 Driver Adv</option>
              <option value="OWNER_ADVANCE">🏦 Owner Adv</option>
              <option value="MAINTENANCE">🔧 Maint.</option>
              <option value="TOLL">🛣️ Toll</option>
              <option value="CASH_PAYMENT">💵 Cash</option>
            </select>
            <select 
              className="form-select" 
              value={row.projectId}
              onChange={e => updateRow(row.id, 'projectId', e.target.value)}
              style={{ flex: 1.5, padding: '8px 10px', fontSize: '13px' }}
            >
              <option value="">No Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
            </select>
            <input 
              type="text" 
              className="form-input" placeholder="Note..."
              value={row.remarks}
              onChange={e => updateRow(row.id, 'remarks', e.target.value)}
              style={{ flex: 1.5, padding: '8px 10px', fontSize: '13px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '40px' }}>
              <button type="button" onClick={() => duplicateRow(row.id)} title="Duplicate Row" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px', fontSize: '12px' }}>📄</button>
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(row.id)} title="Remove Row" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px', fontSize: '12px' }}>✖</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" onClick={addRow} style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ➕ Add Another Row
        </button>
        <div style={{ fontSize: '14px', fontWeight: 800 }}>
          Total: <span style={{ color: 'var(--color-accent)' }}>₹{rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0).toLocaleString('en-IN')}</span>
        </div>
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '20px 0 0 0', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || vehicles.length === 0} style={{ padding: '12px 32px', fontSize: '15px', fontWeight: 800 }}>
          {loading ? '⏳ Logging...' : `💾 Save ${rows.length} Expense${rows.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  )
}
