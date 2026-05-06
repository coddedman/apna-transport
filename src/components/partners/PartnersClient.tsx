'use client'

import { useState, useTransition } from 'react'
import { upsertPartner, deletePartner, addCompanyExpense, deleteCompanyExpense } from '@/lib/actions/partners'
import toast from 'react-hot-toast'

type Partner = { id: string; name: string; phone: string | null; equityPct: number; investedAmount: number }
type CompanyExp = { id: string; date: Date; amount: number; type: string; description: string | null }

const EXP_TYPES = ['SALARY', 'RENT', 'INSURANCE', 'EMI', 'OFFICE', 'PARTNER_PAYOUT', 'OTHER']
const EXP_ICONS: Record<string, string> = {
  SALARY: '👷', RENT: '🏢', INSURANCE: '🛡️', EMI: '🏦', OFFICE: '💻', PARTNER_PAYOUT: '🤝', OTHER: '💸'
}
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const card: React.CSSProperties = {
  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
  borderRadius: 14, padding: 20, marginBottom: 16,
}

interface Props {
  partners: Partner[]
  expenses: CompanyExp[]
  netProfit: number // from analytics — transporter's profit before partner distribution
}

export default function PartnersClient({ partners: init, expenses: initExp, netProfit }: Props) {
  const [isPending, start] = useTransition()
  const [partners, setPartners] = useState(init)
  const [expenses, setExpenses] = useState(initExp)

  // Partner form
  const [pForm, setPForm] = useState({ id: '', name: '', phone: '', equityPct: '', investedAmount: '' })
  const [editingP, setEditingP] = useState(false)

  // Expense form
  const [eForm, setEForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', type: 'SALARY', description: '' })

  const totalEquity = partners.reduce((a, p) => a + p.equityPct, 0)
  const totalInvested = partners.reduce((a, p) => a + p.investedAmount, 0)
  const totalOverhead = expenses.reduce((a, e) => a + e.amount, 0)
  const partnerPayouts = expenses.filter(e => e.type === 'PARTNER_PAYOUT').reduce((a, e) => a + e.amount, 0)
  const netAfterOverhead = netProfit - totalOverhead

  function handleEditPartner(p: Partner) {
    setPForm({ id: p.id, name: p.name, phone: p.phone || '', equityPct: String(p.equityPct), investedAmount: String(p.investedAmount) })
    setEditingP(true)
  }

  function handleSavePartner() {
    if (!pForm.name || !pForm.equityPct) return toast.error('Name and equity % required')
    start(async () => {
      try {
        await upsertPartner({ id: pForm.id || undefined, name: pForm.name, phone: pForm.phone || undefined, equityPct: parseFloat(pForm.equityPct), investedAmount: parseFloat(pForm.investedAmount || '0') })
        toast.success(pForm.id ? 'Partner updated' : 'Partner added')
        setPForm({ id: '', name: '', phone: '', equityPct: '', investedAmount: '' })
        setEditingP(false)
        // Refresh is handled by revalidatePath; for optimistic UI:
        window.location.reload()
      } catch (e: any) { toast.error(e.message) }
    })
  }

  function handleDeletePartner(id: string, name: string) {
    if (!confirm(`Remove ${name} as a partner?`)) return
    start(async () => {
      try { await deletePartner(id); toast.success('Partner removed'); window.location.reload() }
      catch (e: any) { toast.error(e.message) }
    })
  }

  function handleAddExpense() {
    if (!eForm.amount || parseFloat(eForm.amount) <= 0) return toast.error('Enter a valid amount')
    start(async () => {
      try {
        await addCompanyExpense({ date: eForm.date, amount: parseFloat(eForm.amount), type: eForm.type, description: eForm.description || undefined })
        toast.success('Expense recorded')
        setEForm(f => ({ ...f, amount: '', description: '' }))
        window.location.reload()
      } catch (e: any) { toast.error(e.message) }
    })
  }

  function handleDeleteExpense(id: string) {
    start(async () => {
      try { await deleteCompanyExpense(id); toast.success('Deleted'); window.location.reload() }
      catch (e: any) { toast.error(e.message) }
    })
  }

  return (
    <div>
      {/* ── KPI Summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Partners', val: String(partners.length), color: '#8b5cf6' },
          { label: 'Total Invested', val: fmt(totalInvested), color: '#3b82f6' },
          { label: 'Equity Allocated', val: `${totalEquity.toFixed(1)}%`, color: totalEquity > 100 ? '#ef4444' : '#f59e0b' },
          { label: 'Overhead Expenses', val: fmt(totalOverhead), color: '#ef4444' },
          { label: 'Net After Overhead', val: fmt(netAfterOverhead), color: netAfterOverhead >= 0 ? '#10b981' : '#ef4444' },
        ].map(k => (
          <div key={k.label} style={{ ...card, marginBottom: 0, textAlign: 'center', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── LEFT: Partners ── */}
        <div>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🤝 Business Partners</div>

            {/* Equity ring visual */}
            {partners.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {partners.map((p, i) => {
                  const colors = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']
                  const color = colors[i % colors.length]
                  const share = netAfterOverhead > 0 ? (p.equityPct / 100) * netAfterOverhead : 0
                  return (
                    <div key={p.id} style={{ flex: 1, minWidth: 140, background: 'var(--color-bg-primary)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${color}40` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                          {p.phone && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{p.phone}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => handleEditPartner(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>✏️</button>
                          <button onClick={() => handleDeletePartner(p.id, p.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color }}>{p.equityPct}%</div>
                          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>EQUITY</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{fmt(p.investedAmount)}</div>
                          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>INVESTED</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{fmt(share)}</div>
                          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>SHARE (est.)</div>
                        </div>
                      </div>
                      {/* Equity bar */}
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 10 }}>
                        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${Math.min(p.equityPct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add / Edit form */}
            <div style={{ background: 'var(--color-bg-primary)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{editingP ? '✏️ Edit Partner' : '➕ Add Partner'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} placeholder="Partner name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={pForm.phone} onChange={e => setPForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number" />
                </div>
                <div className="form-group">
                  <label className="form-label">Equity % *</label>
                  <input className="form-input" type="number" min={0} max={100} step={0.1} value={pForm.equityPct} onChange={e => setPForm(f => ({ ...f, equityPct: e.target.value }))} placeholder="e.g. 30" />
                </div>
                <div className="form-group">
                  <label className="form-label">Invested Amount (₹)</label>
                  <input className="form-input" type="number" min={0} value={pForm.investedAmount} onChange={e => setPForm(f => ({ ...f, investedAmount: e.target.value }))} placeholder="e.g. 500000" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleSavePartner} disabled={isPending} style={{ fontSize: 12 }}>
                  {isPending ? '...' : editingP ? 'Update' : 'Add Partner'}
                </button>
                {editingP && <button className="btn btn-secondary" onClick={() => { setEditingP(false); setPForm({ id: '', name: '', phone: '', equityPct: '', investedAmount: '' }) }} style={{ fontSize: 12 }}>Cancel</button>}
              </div>
              {totalEquity > 100 && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠️ Total equity {totalEquity}% exceeds 100%</div>}
            </div>

            {/* Profit distribution preview */}
            {partners.length > 0 && netAfterOverhead > 0 && (
              <div style={{ marginTop: 14, padding: 12, background: 'rgba(16,185,129,0.06)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>💰 Profit Distribution (All Time)</div>
                {partners.map((p, i) => {
                  const colors = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']
                  const share = (p.equityPct / 100) * netAfterOverhead
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: colors[i % colors.length] }}>{p.name} ({p.equityPct}%)</span>
                      <strong>{fmt(share)}</strong>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                  <span>Remaining (Your Share)</span>
                  <span>{fmt(netAfterOverhead - (totalEquity / 100) * netAfterOverhead)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Company Expenses ── */}
        <div>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏢 Company Overhead Expenses</div>

            {/* Add expense form */}
            <div style={{ background: 'var(--color-bg-primary)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>➕ Log Expense</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={eForm.date} onChange={e => setEForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" min={0} value={eForm.amount} onChange={e => setEForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={eForm.type} onChange={e => setEForm(f => ({ ...f, type: e.target.value }))}>
                    {EXP_TYPES.map(t => <option key={t} value={t}>{EXP_ICONS[t]} {t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={eForm.description} onChange={e => setEForm(f => ({ ...f, description: e.target.value }))} placeholder="Note (optional)" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAddExpense} disabled={isPending} style={{ marginTop: 8, fontSize: 12 }}>
                {isPending ? '...' : '💾 Save Expense'}
              </button>
            </div>

            {/* Expense type summary */}
            {expenses.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {EXP_TYPES.map(t => {
                  const total = expenses.filter(e => e.type === t).reduce((a, e) => a + e.amount, 0)
                  if (!total) return null
                  return (
                    <div key={t} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                      <span>{EXP_ICONS[t]}</span> <strong>{fmt(total)}</strong> <span style={{ color: 'var(--color-text-muted)' }}>{t}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Expense list */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {expenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No overhead expenses logged yet</div>
              ) : (
                expenses.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: 'var(--color-bg-primary)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 18 }}>{EXP_ICONS[e.type] || '💸'}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{e.type.replace('_', ' ')}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                          {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          {e.description && ` · ${e.description}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{fmt(e.amount)}</span>
                      <button onClick={() => handleDeleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)' }}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
