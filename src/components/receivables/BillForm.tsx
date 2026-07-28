'use client'

import { useState, useTransition, useEffect } from 'react'
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
  const [billType, setBillType] = useState<'FREIGHT' | 'TOLL'>('FREIGHT')
  const [projectId, setProjectId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  
  // Rate & weight inputs for auto-calculation
  const [baseRate, setBaseRate] = useState('')
  const [incentive, setIncentive] = useState('')
  const [totalWeight, setTotalWeight] = useState('')
  const [totalTrips, setTotalTrips] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [manualBaseOverride, setManualBaseOverride] = useState(false)

  const [submittedAt, setSubmittedAt] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [remarks, setRemarks] = useState('')

  // When project changes, set default base rate from project
  useEffect(() => {
    if (projectId) {
      const proj = projects.find(p => p.id === projectId)
      if (proj) {
        setBaseRate(String(proj.partyRate))
      }
    }
  }, [projectId, projects])

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

  function resetForm() {
    setBillNo(''); setBillType('FREIGHT'); setProjectId(''); setPeriodStart(''); setPeriodEnd('')
    setBaseRate(''); setIncentive(''); setTotalTrips(''); setTotalWeight(''); setBillAmount('')
    setManualBaseOverride(false)
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
    if (!billNo || !projectId || !periodStart || !periodEnd || !billAmount) return

    startTransition(async () => {
      try {
        await createPartyBill({
          billNo,
          projectId,
          periodStart,
          periodEnd,
          billType,
          billAmount: parsedBase,
          incentive: parsedIncRate,
          totalTrips: billType === 'FREIGHT' ? (parseInt(totalTrips) || 0) : 0,
          totalWeight: billType === 'FREIGHT' ? parsedWeight : 0,
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

      <Modal isOpen={showForm} onClose={() => { resetForm(); setShowForm(false) }} title="📄 Record a Submitted Bill" maxWidth="760px">
        <form onSubmit={handleSubmit}>
          {/* Bill Category Selector */}
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
              <label className="form-label" style={{ fontSize: 11 }}>Bill / Invoice No *</label>
              <input type="text" className="form-input" placeholder={billType === 'TOLL' ? 'e.g., TOLL-2026-001' : 'e.g., INV-2026-042'} value={billNo} onChange={e => setBillNo(e.target.value)} required style={{ fontWeight: 700 }} />
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

          {/* Auto-calculate row (for Freight bills only) */}
          {billType === 'FREIGHT' && (
            <div style={{ margin: '0 0 16px', padding: '10px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Auto-fill trips, weight & rates from logged trips?</span>
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
          )}

          {/* Weight, Base Rate, Incentive Rate & Base Amount Inputs */}
          {billType === 'FREIGHT' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Total Weight (MT) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 100"
                  value={totalWeight}
                  onChange={e => { setTotalWeight(e.target.value); setManualBaseOverride(false) }}
                  min="0"
                  step="0.01"
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
                  placeholder="e.g. 3"
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
                  placeholder="0"
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
                  placeholder="0"
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
                <input type="number" className="form-input" placeholder="0" value={totalTrips} onChange={e => setTotalTrips(e.target.value)} min="0" />
              </div>
            )}

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
