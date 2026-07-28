'use client'

import { useState, useTransition, useEffect } from 'react'
import Modal from '@/components/Modal'
import { updatePartyBill, calculateBillFromTrips } from '@/lib/actions/receivables'

interface Bill {
  id: string
  billNo: string
  projectId: string
  project: { id: string; projectName: string; partyRate?: number }
  periodStart: Date | string
  periodEnd: Date | string
  totalTrips: number
  totalWeight: number
  billAmount: number
  incentive?: number
  billType?: string
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

  const initialWeight = bill.totalWeight || 0
  const initialBaseAmount = bill.billAmount || 0
  const initialBaseRate = initialWeight > 0 ? (initialBaseAmount / initialWeight) : (bill.project.partyRate || 0)

  const [billNo, setBillNo] = useState(bill.billNo)
  const [billType, setBillType] = useState<string>(bill.billType || 'FREIGHT')
  const [periodStart, setPeriodStart] = useState(toInputDate(bill.periodStart))
  const [periodEnd, setPeriodEnd] = useState(toInputDate(bill.periodEnd))
  const [baseRate, setBaseRate] = useState(initialBaseRate > 0 ? String(Math.round(initialBaseRate * 100) / 100) : '')
  const [incentive, setIncentive] = useState((bill.incentive || 0).toString())
  const [totalWeight, setTotalWeight] = useState(bill.totalWeight.toString())
  const [totalTrips, setTotalTrips] = useState(bill.totalTrips.toString())
  const [billAmount, setBillAmount] = useState(bill.billAmount.toString())
  const [manualBaseOverride, setManualBaseOverride] = useState(false)

  const [submittedAt, setSubmittedAt] = useState(toInputDate(bill.submittedAt))
  const [dueDate, setDueDate] = useState(toInputDate(bill.dueDate))
  const [remarks, setRemarks] = useState(bill.remarks || '')
  const [error, setError] = useState<string | null>(null)

  // Auto-calculate Base Bill Amount whenever Weight or Base Rate changes (unless manually overridden)
  useEffect(() => {
    if (billType === 'FREIGHT' && !manualBaseOverride) {
      const w = parseFloat(totalWeight) || 0
      const r = parseFloat(baseRate) || 0
      if (w > 0 && r > 0) {
        setBillAmount(String(Math.round(w * r)))
      }
    }
  }, [totalWeight, baseRate, billType, manualBaseOverride])

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
        const w = data.totalWeight || 0
        const calcBase = data.billAmount || 0
        setBillAmount(String(Math.round(calcBase)))
        setManualBaseOverride(false)
        if (w > 0) {
          setBaseRate(String(Math.round(calcBase / w)))
        }
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const parsedBase = parseFloat(billAmount) || 0
  const parsedWeight = parseFloat(totalWeight) || 0
  const parsedIncRate = parseFloat(incentive) || 0
  const parsedBaseRate = parseFloat(baseRate) || (parsedWeight > 0 ? (parsedBase / parsedWeight) : 0)
  const totalIncentiveAmount = parsedWeight > 0 ? (parsedIncRate * parsedWeight) : parsedIncRate
  const totalPayableBill = billType === 'FREIGHT' ? (parsedBase + totalIncentiveAmount) : parsedBase

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
          billType,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          totalTrips: billType === 'FREIGHT' ? (totalTrips ? parseInt(totalTrips) : 0) : 0,
          totalWeight: billType === 'FREIGHT' ? parsedWeight : 0,
          billAmount: parsedBase,
          incentive: billType === 'FREIGHT' ? parsedIncRate : 0,
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Bill — ${bill.billNo}`} maxWidth="760px">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Bill Type Selector */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 10, background: '#0b1120', padding: 6, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => setBillType('FREIGHT')}
            style={{
              flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: billType === 'FREIGHT' ? '#8b5cf6' : 'transparent',
              color: billType === 'FREIGHT' ? '#fff' : '#94a3b8',
            }}
          >
            🚚 Freight Bill (Weight × [Base Rate + Incentive Rate])
          </button>
          <button
            type="button"
            onClick={() => setBillType('TOLL')}
            style={{
              flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: billType === 'TOLL' ? '#10b981' : 'transparent',
              color: billType === 'TOLL' ? '#fff' : '#94a3b8',
            }}
          >
            🛣️ Toll Bill (Fixed Reimbursement - No Weight)
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Bill Number *</label>
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
            <label className="form-label" style={{ fontSize: 11 }}>Project</label>
            <input
              type="text"
              className="form-input"
              value={bill.project.projectName}
              disabled
              style={{ opacity: 0.6 }}
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

        {billType === 'FREIGHT' && (
          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Recalculate weight & base amount from trips?</span>
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
        )}

        {/* Weight, Base Rate, Incentive Rate & Base Amount Inputs */}
        {billType === 'FREIGHT' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Total Weight (MT) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={totalWeight}
                onChange={e => { setTotalWeight(e.target.value); setManualBaseOverride(false) }}
                min="0"
                style={{ fontSize: 14, fontWeight: 700 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Base Rate (₹/MT)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 20"
                value={baseRate}
                onChange={e => { setBaseRate(e.target.value); setManualBaseOverride(false) }}
                min="0"
                step="0.1"
                style={{ fontSize: 14, fontWeight: 700 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Incentive Rate (₹/MT)</label>
              <input
                type="number"
                className="form-input"
                value={incentive}
                onChange={e => setIncentive(e.target.value)}
                min="0"
                step="0.1"
                style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Base Bill Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={billAmount}
                onChange={e => { setBillAmount(e.target.value); setManualBaseOverride(true) }}
                required
                min="1"
                style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Toll / Fixed Bill Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={billAmount}
                onChange={e => setBillAmount(e.target.value)}
                required
                min="1"
                style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}
              />
            </div>
          </div>
        )}

        {/* Formula calculation preview box */}
        {billType === 'FREIGHT' && (parsedWeight > 0 || parsedBase > 0) && (
          <div style={{ margin: '0 0 16px', padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, fontSize: 12 }}>
            <div style={{ color: '#10b981', fontWeight: 800, marginBottom: 4 }}>
              ⚡ Auto-Calculated Total Bill Formula:
            </div>
            <div style={{ color: '#e2e8f0', lineHeight: 1.5 }}>
              {parsedWeight > 0 && (parsedBaseRate > 0 || parsedIncRate > 0) ? (
                <span>
                  <strong>{parsedWeight} MT</strong> × (Base <strong>₹{parsedBaseRate.toFixed(2)}</strong> {parsedIncRate > 0 ? `+ Incentive ₹${parsedIncRate}` : ''})
                  = <strong>{parsedWeight} MT</strong> × <strong>₹{(parsedBaseRate + parsedIncRate).toFixed(2)}/MT</strong>
                </span>
              ) : (
                <span>Base Bill: <strong>₹{Math.round(parsedBase).toLocaleString('en-IN')}</strong></span>
              )}
              <span style={{ marginLeft: 10, color: '#10b981', fontWeight: 900, fontSize: 13 }}>
                ➔ Total Payable: ₹{Math.round(totalPayableBill).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          {billType === 'FREIGHT' && (
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
          )}

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

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Remarks</label>
            <input
              type="text"
              className="form-input"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ padding: 0, border: 'none', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending || !billNo || !billAmount} style={{ padding: '10px 24px' }}>
            {isPending ? '⏳ Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
