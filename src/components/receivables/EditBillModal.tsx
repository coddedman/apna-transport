'use client'

import { useState, useTransition } from 'react'
import Modal from '@/components/Modal'
import { updatePartyBill, calculateBillFromTrips } from '@/lib/actions/receivables'

interface Bill {
  id: string
  billNo: string
  projectId: string
  project: { id: string; projectName: string }
  periodStart: Date | string
  periodEnd: Date | string
  totalTrips: number
  totalWeight: number
  billAmount: number
  receivedAmount: number
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  submittedAt: Date | string | null
  dueDate: Date | string | null
  remarks: string | null
}

interface Props {
  bill: Bill
  isOpen: boolean
  onClose: () => void
}

export default function EditBillModal({ bill, isOpen, onClose }: Props) {
  const [isPending, startTransition] = useTransition()

  const toInputDate = (d: Date | string | null) => {
    if (!d) return ''
    return new Date(d).toISOString().split('T')[0]
  }

  const [billNo, setBillNo] = useState(bill.billNo)
  const [periodStart, setPeriodStart] = useState(toInputDate(bill.periodStart))
  const [periodEnd, setPeriodEnd] = useState(toInputDate(bill.periodEnd))
  const [billAmount, setBillAmount] = useState(bill.billAmount.toString())
  const [totalTrips, setTotalTrips] = useState(bill.totalTrips.toString())
  const [totalWeight, setTotalWeight] = useState(bill.totalWeight.toString())
  const [submittedAt, setSubmittedAt] = useState(toInputDate(bill.submittedAt))
  const [dueDate, setDueDate] = useState(toInputDate(bill.dueDate))
  const [remarks, setRemarks] = useState(bill.remarks || '')
  const [error, setError] = useState<string | null>(null)

  function handleAutoRecalculate() {
    if (!bill.projectId || !periodStart || !periodEnd) {
      alert('Select period first')
      return
    }
    startTransition(async () => {
      try {
        const data = await calculateBillFromTrips(bill.projectId, periodStart, periodEnd)
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
    if (!billNo || !billAmount) {
      setError('Bill number and amount are required')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await updatePartyBill(bill.id, {
          billNo,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          totalTrips: totalTrips ? parseInt(totalTrips) : undefined,
          totalWeight: totalWeight ? parseFloat(totalWeight) : undefined,
          billAmount: parseFloat(billAmount),
          submittedAt: submittedAt || null,
          dueDate: dueDate || null,
          remarks: remarks || null,
        })
        onClose()
      } catch (err: any) {
        setError(err.message || 'Failed to update bill')
      }
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`✏️ Edit Bill: ${bill.billNo}`}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '10px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: '#94a3b8' }}>
          Project: <strong style={{ color: '#fff' }}>{bill.project.projectName}</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Bill / Invoice No *</label>
            <input
              type="text"
              className="form-input"
              value={billNo}
              onChange={e => setBillNo(e.target.value)}
              required
              style={{ fontWeight: 700 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Period Start</label>
            <input
              type="date"
              className="form-input"
              value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Period End</label>
            <input
              type="date"
              className="form-input"
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Auto-calculate row */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Recalculate from trips?</span>
          <button
            type="button"
            onClick={handleAutoRecalculate}
            disabled={isPending || !periodStart || !periodEnd}
            style={{
              padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, background: '#8b5cf6', color: '#fff',
            }}
          >
            {isPending ? '⏳...' : '⚡ Recalculate'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Bill Amount (₹) *</label>
            <input
              type="number"
              className="form-input"
              value={billAmount}
              onChange={e => setBillAmount(e.target.value)}
              required
              min="1"
              style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Total Trips</label>
            <input
              type="number"
              className="form-input"
              value={totalTrips}
              onChange={e => setTotalTrips(e.target.value)}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Total Weight (MT)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={totalWeight}
              onChange={e => setTotalWeight(e.target.value)}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Submitted Date</label>
            <input
              type="date"
              className="form-input"
              value={submittedAt}
              onChange={e => setSubmittedAt(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Due Date</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontSize: 11 }}>Remarks</label>
            <input
              type="text"
              className="form-input"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending || !billNo || !billAmount}>
            {isPending ? '⏳ Saving...' : '✓ Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
