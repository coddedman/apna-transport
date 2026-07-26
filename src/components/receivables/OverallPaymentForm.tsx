'use client'

import { useState, useTransition } from 'react'
import { addBulkPartyPayment } from '@/lib/actions/receivables'

interface Project {
  id: string
  projectName: string
  partyRate: number
}

interface ProjectPending {
  projectId: string
  projectName: string
  billed: number
  received: number
  pending: number
  count: number
}

interface Props {
  projects: Project[]
  projectWise: ProjectPending[]
  totalPending: number
}

const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`

export default function OverallPaymentForm({ projects, projectWise, totalPending }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Current selected target outstanding
  const selectedProjectInfo = projectWise.find(p => p.projectId === projectId)
  const currentOutstanding = projectId
    ? (selectedProjectInfo?.pending || 0)
    : totalPending

  const parsedAmount = parseFloat(amount) || 0
  const remainingToAsk = currentOutstanding - parsedAmount

  function resetForm() {
    setProjectId('')
    setDate(new Date().toISOString().split('T')[0])
    setAmount('')
    setReferenceNo('')
    setRemarks('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parsedAmount <= 0) {
      setError('Please enter a valid positive payment amount')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await addBulkPartyPayment({
          projectId: projectId || undefined,
          date,
          amount: parsedAmount,
          referenceNo: referenceNo || undefined,
          remarks: remarks || undefined,
        })
        resetForm()
        setShowForm(false)
      } catch (err: any) {
        setError(err.message || 'Failed to record payment')
      }
    })
  }

  return (
    <div>
      <button
        className="btn"
        onClick={() => setShowForm(!showForm)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: showForm ? '#374151' : 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10,
          fontWeight: 700, cursor: 'pointer', fontSize: 13
        }}
      >
        {showForm ? '✕ Close' : '💳 Record Payment Received (Overall)'}
      </button>

      {showForm && (
        <div className="card" style={{ marginTop: 16, padding: 24, background: '#111827', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
            <span style={{ background: 'rgba(16,185,129,0.15)', padding: '6px 10px', borderRadius: 8 }}>💳</span>
            Record Overall Payment Received from Party
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, lineHeight: 1.5 }}>
            Record lump-sum payments received from party/clients. Payment is automatically distributed across pending bills in chronological order (FIFO) and updates the overall remaining balance to collect.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* Select Project / Party */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Account / Project</label>
                <select
                  className="form-select"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                >
                  <option value="">🌐 All Projects (Overall Account)</option>
                  {projects.map(p => {
                    const pw = projectWise.find(x => x.projectId === p.id)
                    const pend = pw ? pw.pending : 0
                    return (
                      <option key={p.id} value={p.id}>
                        {p.projectName} (Pending: {fmt(pend)})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Payment Received Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Amount Received (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}
                />
              </div>

              {/* Reference No */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>UTR / Reference / Cheque No</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UTR-982187312"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                />
              </div>

              {/* Remarks */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Remarks / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional payment notes..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Live Remaining Balance Calculation Preview */}
            <div style={{
              padding: '16px 20px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Current Outstanding ({projectId ? selectedProjectInfo?.projectName : 'Overall'})
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
                  {fmt(currentOutstanding)}
                </div>
              </div>

              <div style={{ fontSize: 20, color: '#475569', fontWeight: 900 }}>−</div>

              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Payment Received
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                  {fmt(parsedAmount)}
                </div>
              </div>

              <div style={{ fontSize: 20, color: '#475569', fontWeight: 900 }}>=</div>

              <div style={{
                background: remainingToAsk > 0 ? 'rgba(34,211,238,0.08)' : remainingToAsk < 0 ? 'rgba(139,92,246,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${remainingToAsk > 0 ? 'rgba(34,211,238,0.25)' : remainingToAsk < 0 ? 'rgba(139,92,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
                padding: '10px 16px', borderRadius: 10
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: remainingToAsk > 0 ? '#22d3ee' : remainingToAsk < 0 ? '#a78bfa' : '#10b981', textTransform: 'uppercase' }}>
                  {remainingToAsk > 0 ? 'REMAINING AMOUNT TO ASK / COLLECT' : remainingToAsk < 0 ? 'EXCESS OVERPAID ADVANCE' : 'ACCOUNT FULLY SETTLED'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: remainingToAsk > 0 ? '#22d3ee' : remainingToAsk < 0 ? '#a78bfa' : '#10b981', marginTop: 2 }}>
                  {fmt(remainingToAsk)}
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={isPending || !amount || parsedAmount <= 0}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: 13, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff'
                }}
              >
                {isPending ? '⏳ Recording...' : '✓ Confirm & Record Payment'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { resetForm(); setShowForm(false) }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
