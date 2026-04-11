'use client'

import { useState, useTransition } from 'react'
import Modal from '../Modal'
import { deleteOwnerAdvance, updateOwnerAdvance } from '@/lib/actions/ownerAdvances'
import toast from 'react-hot-toast'

interface OwnerAnalyticsProps {
  owner: any
}

export default function OwnerAnalyticsButton({ owner }: OwnerAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [localAdvances, setLocalAdvances] = useState<any[]>(owner.advances || [])
  const [isPending, startTransition] = useTransition()

  // Calcs
  const vehicles = owner.vehicles || []
  const advances = localAdvances
  let totalTrips = 0
  let totalRevenue = 0
  let totalExpenses = 0
  
  vehicles.forEach((v: any) => {
    totalTrips += v.trips?.length || 0
    totalRevenue += v.trips?.reduce((acc: number, t: any) => acc + t.totalAmount, 0) || 0
    totalExpenses += v.expenses?.reduce((acc: number, e: any) => acc + e.amount, 0) || 0
  })

  const totalAdvances = advances.reduce((acc: number, a: any) => acc + a.amount, 0)
  const settlements = owner.settlements || []
  const settledAmount = settlements
    .filter((s: any) => s.status === 'SETTLED')
    .reduce((a: number, s: any) => a + s.finalPayout, 0)

  // Group by Project
  const projectStats: Record<string, { name: string, revenue: number, expenses: number, trips: number }> = {}

  vehicles.forEach((v: any) => {
    v.trips?.forEach((t: any) => {
      const pId = t.projectId
      const pName = t.project?.projectName || 'General'
      if (!projectStats[pId]) projectStats[pId] = { name: pName, revenue: 0, expenses: 0, trips: 0 }
      projectStats[pId].revenue += t.totalAmount
      projectStats[pId].trips += 1
    })
    v.expenses?.forEach((e: any) => {
      const pId = e.projectId || 'none'
      const pName = e.project?.projectName || 'General'
      if (!projectStats[pId]) projectStats[pId] = { name: pName, revenue: 0, expenses: 0, trips: 0 }
      projectStats[pId].expenses += e.amount
    })
  })

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary btn-sm"
        title="View Analytics"
        style={{ fontSize: '11px', padding: '4px 8px' }}
      >
        📊 Analytics
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${owner.ownerName} — Performance Analytics`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div className="stat-card accent" style={{ padding: '16px' }}>
            <div className="stat-card-label">Total Revenue</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card danger" style={{ padding: '16px' }}>
            <div className="stat-card-label">Total Expenses</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card advance" style={{ padding: '16px' }}>
            <div className="stat-card-label">Owner Advances</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{totalAdvances.toLocaleString('en-IN')}</div>
          </div>
          <div className={`stat-card ${totalRevenue - totalExpenses - totalAdvances >= 0 ? 'success' : 'danger'}`} style={{ padding: '16px' }}>
            <div className="stat-card-label">Net Payable</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{(totalRevenue - totalExpenses - totalAdvances).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Performance by Project</h3>
        <div className="data-table-wrapper" style={{ marginBottom: '24px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th style={{ textAlign: 'right' }}>Trips</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Expenses</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(projectStats).length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No project data found</td></tr>
              ) : (
                Object.values(projectStats).map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ textAlign: 'right' }}>{p.trips}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>₹{p.revenue.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{p.expenses.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(p.revenue - p.expenses).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Performance by Vehicle</h3>
        <div className="data-table-wrapper" style={{ marginBottom: '24px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th style={{ textAlign: 'right' }}>Trips</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Expenses</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v: any) => {
                const rev = v.trips?.reduce((a: number, t: any) => a + t.totalAmount, 0) || 0
                const exp = v.expenses?.reduce((a: number, e: any) => a + e.amount, 0) || 0
                return (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.plateNo}</td>
                    <td style={{ textAlign: 'right' }}>{v.trips?.length || 0}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>₹{rev.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{exp.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(rev - exp).toLocaleString()}</td>
                  </tr>
                )
              })}
              {vehicles.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No vehicles found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {advances.length > 0 && (
          <>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Advances Given</h3>
            <div className="data-table-wrapper" style={{ marginBottom: '24px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Remarks</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((a: any, idx: number) => (
                    <>
                      <tr key={a.id || idx}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td>{a.project?.projectName || '—'}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{a.remarks || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)' }}>₹{a.amount.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                              onClick={() => setEditingId(editingId === (a.id || idx.toString()) ? null : (a.id || idx.toString()))}
                            >✏️</button>
                            <button
                              className="btn btn-sm"
                              style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)' }}
                              disabled={isPending}
                              onClick={() => {
                                if (!a.id) return toast.error('Cannot delete — refresh and try again')
                                if (!confirm('Delete this advance?')) return
                                startTransition(async () => {
                                  try {
                                    await deleteOwnerAdvance(a.id)
                                    setLocalAdvances(prev => prev.filter(x => x.id !== a.id))
                                    toast.success('Advance deleted')
                                  } catch (err: any) {
                                    toast.error(err.message || 'Failed to delete')
                                  }
                                })
                              }}
                            >🗑️</button>
                          </div>
                        </td>
                      </tr>
                      {editingId === (a.id || idx.toString()) && (
                        <tr key={`edit-${a.id || idx}`}>
                          <td colSpan={5} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <form
                              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}
                              onSubmit={(e) => {
                                e.preventDefault()
                                const fd = new FormData(e.currentTarget)
                                fd.set('advanceId', a.id)
                                startTransition(async () => {
                                  try {
                                    await updateOwnerAdvance(fd)
                                    setLocalAdvances(prev => prev.map(x => x.id === a.id ? {
                                      ...x,
                                      amount: parseFloat(fd.get('amount') as string),
                                      remarks: fd.get('remarks') as string,
                                      date: fd.get('date') as string,
                                    } : x))
                                    toast.success('Advance updated')
                                    setEditingId(null)
                                  } catch (err: any) {
                                    toast.error(err.message || 'Failed to update')
                                  }
                                })
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Date</label>
                                <input className="form-input" name="date" type="date"
                                  defaultValue={new Date(a.date).toISOString().split('T')[0]}
                                  style={{ padding: '4px 8px', fontSize: '12px', width: '130px' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Amount (₹)</label>
                                <input className="form-input" name="amount" type="number" step="0.01" min="1"
                                  defaultValue={a.amount}
                                  style={{ padding: '4px 8px', fontSize: '12px', width: '100px' }} required />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Remarks</label>
                                <input className="form-input" name="remarks" type="text"
                                  defaultValue={a.remarks || ''} placeholder="Remarks"
                                  style={{ padding: '4px 8px', fontSize: '12px', width: '150px' }} />
                              </div>
                              <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}
                                style={{ fontSize: '11px', padding: '4px 10px' }}>
                                {isPending ? '...' : 'Save'}
                              </button>
                              <button type="button" className="btn btn-secondary btn-sm"
                                style={{ fontSize: '11px', padding: '4px 10px' }}
                                onClick={() => setEditingId(null)}>Cancel</button>
                            </form>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-primary" onClick={() => setIsOpen(false)} style={{ width: '100%', justifyContent: 'center' }}>
            Close Analytics
          </button>
        </div>
      </Modal>
    </>
  )
}
