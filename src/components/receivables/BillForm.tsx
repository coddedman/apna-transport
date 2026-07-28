'use client'

import { useState, useTransition } from 'react'
import Modal from '@/components/Modal'
import { createPartyBill, calculateBillFromTrips } from '@/lib/actions/receivables'

interface Project { id: string; projectName: string; partyRate: number }

interface Props {
  projects: Project[]
}

export default function BillForm({ projects }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  const [billNo, setBillNo] = useState('')
  const [projectId, setProjectId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [incentive, setIncentive] = useState('')
  const [totalTrips, setTotalTrips] = useState('')
  const [totalWeight, setTotalWeight] = useState('')
  const [submittedAt, setSubmittedAt] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [remarks, setRemarks] = useState('')

  function resetForm() {
    setBillNo(''); setProjectId(''); setPeriodStart(''); setPeriodEnd('')
    setBillAmount(''); setIncentive(''); setTotalTrips(''); setTotalWeight('')
    setSubmittedAt(new Date().toISOString().split('T')[0]); setDueDate(''); setRemarks('')
  }

  function handleAutoCalculate() {
    if (!projectId || !periodStart || !periodEnd) {
      alert('Select project and period first')
      return
    }
    startTransition(async () => {
      try {
        const data = await calculateBillFromTrips(projectId, periodStart, periodEnd)
        setTotalTrips(String(data.totalTrips))
        setTotalWeight(String(data.totalWeight.toFixed(2)))
        setBillAmount(String(Math.round(data.billAmount)))
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!billNo || !projectId || !periodStart || !periodEnd || !billAmount) return

    startTransition(async () => {
      try {
        await createPartyBill({
          billNo,
          projectId,
          periodStart,
          periodEnd,
          billAmount: parseFloat(billAmount),
          incentive: parseFloat(incentive) || 0,
          totalTrips: parseInt(totalTrips) || 0,
          totalWeight: parseFloat(totalWeight) || 0,
          submittedAt: submittedAt || undefined,
          dueDate: dueDate || undefined,
          remarks: remarks || undefined,
        })
        resetForm()
        setShowForm(false)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        + Record Bill
      </button>

      <Modal isOpen={showForm} onClose={() => { resetForm(); setShowForm(false) }} title="📄 Record a Submitted Bill" maxWidth="720px">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Bill / Invoice No *</label>
              <input type="text" className="form-input" placeholder="e.g., INV-2026-042" value={billNo} onChange={e => setBillNo(e.target.value)} required style={{ fontWeight: 700 }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Project *</label>
              <select className="form-select" value={projectId} onChange={e => setProjectId(e.target.value)} required>
                <option value="">— Select Project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectName} (₹{p.partyRate}/MT)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Period Start *</label>
              <input type="date" className="form-input" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Period End *</label>
              <input type="date" className="form-input" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
            </div>
          </div>

          {/* Auto-calculate row */}
          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Auto-fill from trips?</span>
            <button
              type="button"
              onClick={handleAutoCalculate}
              disabled={isPending || !projectId || !periodStart || !periodEnd}
              style={{
                padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, background: '#8b5cf6', color: '#fff',
              }}
            >
              {isPending ? '⏳...' : '⚡ Calculate from Trips'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Base Bill Amount (₹) *</label>
              <input type="number" className="form-input" placeholder="0" value={billAmount} onChange={e => setBillAmount(e.target.value)} required min="1" style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Incentive (₹)</label>
              <input type="number" className="form-input" placeholder="0" value={incentive} onChange={e => setIncentive(e.target.value)} min="0" style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Total Trips</label>
              <input type="number" className="form-input" placeholder="0" value={totalTrips} onChange={e => setTotalTrips(e.target.value)} min="0" />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Total Weight (MT)</label>
              <input type="number" className="form-input" placeholder="0" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} min="0" step="0.01" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Submitted On</label>
              <input type="date" className="form-input" value={submittedAt} onChange={e => setSubmittedAt(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Due Date</label>
              <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Remarks</label>
              <input type="text" className="form-input" placeholder="Optional notes..." value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: 0, border: 'none', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false) }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending || !billNo || !billAmount} style={{ padding: '10px 24px' }}>
              {isPending ? '⏳ Saving...' : '📄 Record Bill'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
