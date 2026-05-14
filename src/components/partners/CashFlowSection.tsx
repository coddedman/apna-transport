'use client'

import { useState, useTransition } from 'react'
import { addCashFlow, deleteCashFlow } from '@/lib/actions/cashflow'
import toast from 'react-hot-toast'

type Flow = { id: string; date: Date; direction: string; amount: number; category: string; description: string | null }

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

const IN_CATEGORIES = ['Party Payment', 'Loan Received', 'Investment', 'Refund', 'Other Income']
const OUT_CATEGORIES = ['Owner Payment', 'Loan Repayment', 'EMI', 'Office Rent', 'Salary', 'Fuel Bulk', 'Tyre', 'Insurance', 'RTO/Permit', 'Partner Payout', 'Other Expense']

const card: React.CSSProperties = {
  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
  borderRadius: 14, padding: 20,
}

interface Props { flows: Flow[] }

export default function CashFlowSection({ flows: init }: Props) {
  const [isPending, start] = useTransition()
  const [flows] = useState(init)
  const [tab, setTab] = useState<'ALL' | 'CASH_IN' | 'CASH_OUT'>('ALL')

  // Form
  const [direction, setDirection] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN')
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', category: IN_CATEGORIES[0], description: '' })

  const totalIn = flows.filter(f => f.direction === 'CASH_IN').reduce((a, f) => a + f.amount, 0)
  const totalOut = flows.filter(f => f.direction === 'CASH_OUT').reduce((a, f) => a + f.amount, 0)
  const balance = totalIn - totalOut

  const filtered = tab === 'ALL' ? flows : flows.filter(f => f.direction === tab)

  function handleDirectionChange(d: 'CASH_IN' | 'CASH_OUT') {
    setDirection(d)
    setForm(f => ({ ...f, category: d === 'CASH_IN' ? IN_CATEGORIES[0] : OUT_CATEGORIES[0] }))
  }

  function handleAdd() {
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter valid amount')
    start(async () => {
      try {
        await addCashFlow({ date: form.date, direction, amount: parseFloat(form.amount), category: form.category, description: form.description || undefined })
        toast.success(direction === 'CASH_IN' ? 'Cash In recorded' : 'Cash Out recorded')
        setForm(f => ({ ...f, amount: '', description: '' }))
        window.location.reload()
      } catch (e: any) { toast.error(e.message) }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    start(async () => {
      try { await deleteCashFlow(id); toast.success('Deleted'); window.location.reload() }
      catch (e: any) { toast.error(e.message) }
    })
  }

  const tabBtn = (t: typeof tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
        border: tab === t ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border)',
        background: tab === t ? 'rgba(245,158,11,0.08)' : 'transparent',
        color: tab === t ? '#f59e0b' : 'var(--color-text-muted)',
      }}
    >{label}</button>
  )

  return (
    <div style={card}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Company Cash Flow</div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{fmt(totalIn)}</div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Total Cash In</div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>{fmt(totalOut)}</div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Total Cash Out</div>
        </div>
        <div style={{ background: balance >= 0 ? 'rgba(34,211,238,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${balance >= 0 ? 'rgba(34,211,238,0.12)' : 'rgba(239,68,68,0.12)'}`, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: balance >= 0 ? '#22d3ee' : '#ef4444' }}>{fmt(balance)}</div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Net Balance</div>
        </div>
      </div>

      {/* Add entry form */}
      <div style={{ background: 'var(--color-bg-primary)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>+ Log Cash Entry</div>

        {/* Direction toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['CASH_IN', 'CASH_OUT'] as const).map(d => (
            <button key={d} onClick={() => handleDirectionChange(d)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
              border: direction === d ? 'none' : '1px solid var(--color-border)',
              background: direction === d
                ? d === 'CASH_IN' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'
                : 'transparent',
              color: direction === d
                ? d === 'CASH_IN' ? '#10b981' : '#ef4444'
                : 'var(--color-text-muted)',
            }}>
              {d === 'CASH_IN' ? '↓ Cash In (Money Received)' : '↑ Cash Out (Money Paid)'}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" min={0} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter amount" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {(direction === 'CASH_IN' ? IN_CATEGORIES : OUT_CATEGORIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Note (optional)" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} disabled={isPending} style={{ marginTop: 8, fontSize: 12 }}>
          {isPending ? '...' : direction === 'CASH_IN' ? '↓ Record Cash In' : '↑ Record Cash Out'}
        </button>
      </div>

      {/* Filter tabs + list */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {tabBtn('ALL', `All (${flows.length})`)}
        {tabBtn('CASH_IN', `Cash In (${flows.filter(f => f.direction === 'CASH_IN').length})`)}
        {tabBtn('CASH_OUT', `Cash Out (${flows.filter(f => f.direction === 'CASH_OUT').length})`)}
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontSize: 13 }}>No entries yet</div>
        ) : (
          filtered.map(f => {
            const isIn = f.direction === 'CASH_IN'
            return (
              <div key={f.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900,
                    background: isIn ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: isIn ? '#10b981' : '#ef4444',
                  }}>
                    {isIn ? '↓' : '↑'}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{f.category}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                      {new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      {f.description && ` · ${f.description}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: isIn ? '#10b981' : '#ef4444' }}>
                    {isIn ? '+' : '-'}{fmt(f.amount)}
                  </span>
                  <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)' }}>🗑️</button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
