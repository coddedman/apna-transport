'use client'

import { useState, useTransition } from 'react'
import { createTransaction, updateTransactionStatus, deleteTransaction } from '@/lib/actions/transactions'
import type { TransactionType, TransactionStatus } from '@prisma/client'

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  PARTY_PAYMENT: { label: 'Party Payment', icon: '🏢', color: '#10b981' },
  OWNER_PAYMENT: { label: 'Owner Payment', icon: '💰', color: '#f59e0b' },
  ADVANCE_GIVEN: { label: 'Advance Given', icon: '🏦', color: '#8b5cf6' },
  REFUND: { label: 'Refund', icon: '↩️', color: '#ef4444' },
  OTHER: { label: 'Other', icon: '📋', color: '#64748b' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  COMPLETED: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

interface Owner { id: string; ownerName: string }
interface Project { id: string; projectName: string }
interface Settlement { id: string; ownerId: string; periodStart: string; periodEnd: string; finalPayout: number }

interface Props {
  owners: Owner[]
  projects: Project[]
  settlements: Settlement[]
}

export default function TransactionForm({ owners, projects, settlements }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  const [type, setType] = useState<TransactionType>('PARTY_PAYMENT' as TransactionType)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [projectId, setProjectId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [settlementId, setSettlementId] = useState('')

  function resetForm() {
    setAmount(''); setDescription(''); setReferenceNo('')
    setProjectId(''); setOwnerId(''); setSettlementId('')
    setDate(new Date().toISOString().split('T')[0])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    startTransition(async () => {
      try {
        await createTransaction({
          date,
          type: type as TransactionType,
          amount: parseFloat(amount),
          description: description || undefined,
          referenceNo: referenceNo || undefined,
          projectId: projectId || undefined,
          ownerId: ownerId || undefined,
          settlementId: settlementId || undefined,
        })
        resetForm()
        setShowForm(false)
      } catch (err: any) {
        alert(err.message || 'Failed to create transaction')
      }
    })
  }

  const isIncoming = type === 'PARTY_PAYMENT'
  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.OTHER

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(!showForm)}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {showForm ? '✕ Close' : '+ New Transaction'}
      </button>

      {showForm && (
        <div className="card" style={{ marginTop: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'rgba(245,158,11,0.1)', padding: '5px 8px', borderRadius: 8 }}>💳</span>
            Record Transaction
          </div>

          <form onSubmit={handleSubmit}>
            {/* Transaction Type Chips */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: 11, marginBottom: 8, display: 'block' }}>Transaction Type</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key as TransactionType)}
                    style={{
                      padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                      background: type === key ? cfg.color : 'rgba(255,255,255,0.06)',
                      color: type === key ? '#fff' : 'var(--color-text-secondary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  style={{ fontSize: 16, fontWeight: 700 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Reference No. (UTR/Cheque)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="UTR / Cheque No"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 12 }}>
              {(type === 'PARTY_PAYMENT' || type === 'OTHER') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Project</label>
                  <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">— Select Project —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.projectName}</option>
                    ))}
                  </select>
                </div>
              )}

              {(type === 'OWNER_PAYMENT' || type === 'ADVANCE_GIVEN' || type === 'OTHER') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Owner</label>
                  <select className="form-select" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                    <option value="">— Select Owner —</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.ownerName}</option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'OWNER_PAYMENT' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Settlement (optional)</label>
                  <select className="form-select" value={settlementId} onChange={(e) => setSettlementId(e.target.value)}>
                    <option value="">— No settlement —</option>
                    {settlements
                      .filter(s => !ownerId || s.ownerId === ownerId)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          ₹{Math.round(s.finalPayout).toLocaleString('en-IN')} — {new Date(s.periodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {new Date(s.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Description / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending || !amount}
                style={{ padding: '10px 24px' }}
              >
                {isPending ? 'Saving...' : `💳 Record ${typeConfig.label}`}
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
