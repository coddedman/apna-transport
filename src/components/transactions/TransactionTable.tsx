'use client'

import { useState, useTransition } from 'react'
import { updateTransactionStatus, deleteTransaction } from '@/lib/actions/transactions'

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

interface Transaction {
  id: string
  date: string
  type: string
  status: string
  amount: number
  description: string | null
  referenceNo: string | null
  project: { id: string; projectName: string } | null
  owner: { id: string; ownerName: string } | null
  settlement: { id: string; periodStart: string; periodEnd: string; status: string } | null
}

interface Props {
  transactions: Transaction[]
}

export default function TransactionTable({ transactions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filtered = transactions.filter(t => {
    if (filter !== 'ALL' && t.type !== filter) return false
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
    return true
  })

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      try {
        await updateTransactionStatus(id, newStatus as any)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return
    startTransition(async () => {
      try {
        await deleteTransaction(id)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <span className="card-title">
          Transaction Records
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-accent)', marginLeft: 8 }}>
            ({filtered.length} of {transactions.length})
          </span>
        </span>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Type Filter */}
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', minWidth: 140 }}
          >
            <option value="ALL">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', minWidth: 120 }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="CANCELLED">❌ Cancelled</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="desktop-only-table">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Project / Owner</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 30 }}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map(t => {
                  const tc = TYPE_CONFIG[t.type] || TYPE_CONFIG.OTHER
                  const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING
                  return (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: tc.color }}>
                          {tc.icon} {tc.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, fontSize: 14, color: t.type === 'PARTY_PAYMENT' ? '#10b981' : '#f59e0b' }}>
                        {t.type === 'PARTY_PAYMENT' ? '+' : '-'}{fmt(t.amount)}
                      </td>
                      <td>
                        {t.referenceNo ? (
                          <code style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                            {t.referenceNo}
                          </code>
                        ) : '—'}
                      </td>
                      <td>
                        {t.project && <div style={{ fontSize: 12, fontWeight: 600 }}>📁 {t.project.projectName}</div>}
                        {t.owner && <div style={{ fontSize: 12, fontWeight: 600 }}>👤 {t.owner.ownerName}</div>}
                        {!t.project && !t.owner && <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.description || '—'}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          color: sc.color, background: sc.bg,
                        }}>
                          {sc.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {t.status === 'PENDING' && (
                            <button
                              className="btn btn-sm"
                              onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                              disabled={isPending}
                              title="Mark Completed"
                              style={{ fontSize: 11, padding: '4px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                            >
                              ✓
                            </button>
                          )}
                          {t.status !== 'CANCELLED' && (
                            <button
                              className="btn btn-sm"
                              onClick={() => handleStatusChange(t.id, 'CANCELLED')}
                              disabled={isPending}
                              title="Cancel"
                              style={{ fontSize: 11, padding: '4px 8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          )}
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDelete(t.id)}
                            disabled={isPending}
                            title="Delete"
                            style={{ fontSize: 11, padding: '4px 8px', background: 'rgba(239,68,68,0.05)', color: '#94a3b8', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only-cards">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 20px' }}>
            No transactions found.
          </div>
        ) : (
          <div className="mobile-card-list">
            {filtered.map(t => {
              const tc = TYPE_CONFIG[t.type] || TYPE_CONFIG.OTHER
              const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING
              return (
                <div key={t.id} className="mobile-record-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">
                      <span>{tc.icon}</span>
                      <span style={{ fontWeight: 700 }}>{tc.label}</span>
                    </div>
                    <span className="mobile-card-date">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-card-field">
                      <span className="mobile-card-field-label">Amount</span>
                      <span className="mobile-card-field-value" style={{ color: tc.color, fontWeight: 800, fontSize: 16 }}>
                        {t.type === 'PARTY_PAYMENT' ? '+' : '-'}{fmt(t.amount)}
                      </span>
                    </div>
                    {t.referenceNo && (
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Reference</span>
                        <span className="mobile-card-field-value">
                          <code style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                            {t.referenceNo}
                          </code>
                        </span>
                      </div>
                    )}
                    {t.project && (
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Project</span>
                        <span className="mobile-card-field-value">📁 {t.project.projectName}</span>
                      </div>
                    )}
                    {t.owner && (
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Owner</span>
                        <span className="mobile-card-field-value">👤 {t.owner.ownerName}</span>
                      </div>
                    )}
                    {t.description && (
                      <div className="mobile-card-field">
                        <span className="mobile-card-field-label">Notes</span>
                        <span className="mobile-card-field-value">{t.description}</span>
                      </div>
                    )}
                  </div>
                  <div className="mobile-card-footer">
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg }}>
                      {sc.label}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {t.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                          disabled={isPending}
                          style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          ✓ Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isPending}
                        style={{ fontSize: 12, padding: '4px 8px', background: 'rgba(239,68,68,0.05)', color: '#94a3b8', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
