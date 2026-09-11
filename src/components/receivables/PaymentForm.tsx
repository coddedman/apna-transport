'use client'

import { useState, useTransition } from 'react'
import { addBillPayment, deleteBillPayment } from '@/lib/actions/receivables'

interface Payment {
  id: string
  date: Date | string
  amount: number
  referenceNo: string | null
  remarks: string | null
  createdAt: Date | string
}

interface Props {
  billId: string
  payments: Payment[]
  billAmount: number
  receivedAmount: number
}

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function PaymentForm({ billId, payments, billAmount, receivedAmount }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const pending = billAmount - receivedAmount

  function resetForm() {
    setDate(new Date().toISOString().split('T')[0])
    setAmount('')
    setReferenceNo('')
    setRemarks('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    startTransition(async () => {
      try {
        await addBillPayment({
          billId,
          date,
          amount: parseFloat(amount),
          referenceNo: referenceNo || undefined,
          remarks: remarks || undefined,
        })
        resetForm()
        setShowForm(false)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleDelete(paymentId: string) {
    if (!confirm('Delete this payment?')) return
    setDeletingId(paymentId)
    startTransition(async () => {
      try {
        await deleteBillPayment(paymentId)
      } catch (err: any) {
        alert(err.message)
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div>
      {/* Payment History */}
      {payments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            💰 Payment History ({payments.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Reference</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Remarks</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)', width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#94a3b8' }}>{fmtDate(p.date)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#10b981', fontWeight: 700, textAlign: 'right' }}>{fmt(p.amount)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#8b5cf6', fontSize: 11 }}>{p.referenceNo || '—'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#64748b', fontSize: 11 }}>{p.remarks || '—'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#ef4444',
                        fontSize: 11, fontWeight: 600,
                      }}
                    >
                      {deletingId === p.id ? '...' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Collection Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: '#64748b' }}>Collected: <span style={{ color: '#10b981', fontWeight: 700 }}>{fmt(receivedAmount)}</span></span>
          <span style={{ color: '#64748b' }}>Pending: <span style={{ color: pending > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{fmt(pending)}</span></span>
        </div>
        <div style={{ height: 6, background: 'var(--color-bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min((receivedAmount / billAmount) * 100, 100)}%`,
            background: receivedAmount >= billAmount ? '#10b981' : 'linear-gradient(90deg, #10b981, #22d3ee)',
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Add Payment Toggle */}
      {pending > 0 && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)',
                background: 'rgba(16,185,129,0.08)', color: '#10b981', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              + Record Payment
            </button>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                💳 Record Payment <span style={{ fontWeight: 400, color: '#64748b', fontSize: 11 }}>— Remaining: {fmt(pending)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 10 }}>Date *</label>
                  <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required style={{ fontSize: 12 }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 10 }}>Amount (₹) *</label>
                  <input type="number" className="form-input" placeholder={String(Math.round(pending))} value={amount} onChange={e => setAmount(e.target.value)} required min="1" style={{ fontSize: 13, fontWeight: 700 }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 10 }}>Reference (UTR/Cheque)</label>
                  <input type="text" className="form-input" placeholder="Optional" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} style={{ fontSize: 12 }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 10 }}>Remarks</label>
                  <input type="text" className="form-input" placeholder="Optional" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ fontSize: 12 }} />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={isPending || !amount} style={{ padding: '8px 20px', fontSize: 12 }}>
                  {isPending ? '⏳ Saving...' : '✓ Save Payment'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false) }} style={{ padding: '8px 16px', fontSize: 12 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
