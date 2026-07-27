'use client'

import { useState, useTransition } from 'react'
import { deleteSettlement, updateSettlement } from '@/lib/actions/settlements'
import { generateBill, BillSummary } from '@/lib/actions/billing'
import Modal from './Modal'
import BillOutput from './billing/BillOutput'
import toast from 'react-hot-toast'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

interface Settlement {
  id: string
  ownerId: string
  periodStart: Date
  periodEnd: Date
  totalRevenue: number
  totalFuel: number
  totalAdvances: number
  totalMaint: number
  totalTolls: number
  totalOther: number
  finalPayout: number
  tripsCount: number
  status: string
  settledAt: Date | null
  createdAt: Date
  owner: { ownerName: string; vehicles: { id: string; plateNo?: string }[] }
}

interface Props { settlement: Settlement }

export default function SettlementActions({ settlement: s }: Props) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Edit form state
  const [rev, setRev] = useState(s.totalRevenue)
  const [fuel, setFuel] = useState(s.totalFuel)
  const [adv, setAdv] = useState(s.totalAdvances)
  const [maint, setMaint] = useState(s.totalMaint)
  const [tolls, setTolls] = useState(s.totalTolls)
  const [other, setOther] = useState(s.totalOther)
  const [saving, setSaving] = useState(false)

  // Generated bill state
  const [generatedBill, setGeneratedBill] = useState<BillSummary | null>(null)

  const operationalDed = fuel + maint + tolls + other
  const net = rev - operationalDed
  const balanceDue = net - adv
  const isTillDate = new Date(s.periodStart).getFullYear() <= 2000

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this settlement? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteSettlement(s.id)
      toast.success('Settlement deleted')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
    setDeleting(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateSettlement(s.id, { totalRevenue: rev, totalFuel: fuel, totalAdvances: adv, totalMaint: maint, totalTolls: tolls, totalOther: other })
      toast.success('Settlement updated')
      setEditOpen(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    }
    setSaving(false)
  }

  function handleGenerateBill() {
    const vehicleIds = s.owner.vehicles.map(v => v.id)
    const periodStart = new Date(s.periodStart).toISOString().split('T')[0]
    const periodEnd = new Date(s.periodEnd).toISOString().split('T')[0]
    const periodType = isTillDate ? 'till_date' as const : 'custom' as const

    // Infer which expense types were included as deductions in the settlement
    const deductibles: string[] = []
    if (s.totalFuel > 0) deductibles.push('FUEL')
    if (s.totalTolls > 0) deductibles.push('TOLL')
    if (s.totalMaint > 0) deductibles.push('MAINTENANCE')
    if (s.totalOther > 0) { deductibles.push('DRIVER_ADVANCE'); deductibles.push('CASH_PAYMENT') }

    startTransition(async () => {
      try {
        const result = await generateBill(
          { type: periodType, startDate: periodStart, endDate: periodEnd },
          vehicleIds.length > 0 ? vehicleIds : undefined,
          deductibles
        )
        setGeneratedBill(result)
        setBillOpen(true)
        toast.success(`Bill generated — ${result.vehicles.length} vehicles, ${result.grandTotal.trips} trips`)
      } catch (e: any) {
        toast.error(e.message || 'Failed to generate bill')
      }
    })
  }

  const btnBase: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, border: '1px solid', whiteSpace: 'nowrap' }

  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleGenerateBill} disabled={isPending} style={{ ...btnBase, background: 'rgba(245,158,11,0.08)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
          {isPending ? '⏳ Generating...' : '📄 Bill'}
        </button>
        <button onClick={() => setReviewOpen(true)} style={{ ...btnBase, background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.2)' }}>
          📋 Review
        </button>
        <button onClick={() => setEditOpen(true)} style={{ ...btnBase, background: 'rgba(59,130,246,0.08)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }}>
          ✏️ Edit
        </button>
        <button onClick={handleDelete} disabled={deleting} style={{ ...btnBase, background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
          {deleting ? '⏳' : '🗑️'} Delete
        </button>
      </div>

      {/* ── Bill Output Modal ── */}
      <Modal isOpen={billOpen} onClose={() => setBillOpen(false)} title={`Full Bill — ${s.owner.ownerName}`} maxWidth="1100px">
        {generatedBill ? (
          <BillOutput bill={generatedBill} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Generating...</div>
        )}
      </Modal>

      {/* ── Review Modal ── */}
      <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title={`Settlement Review — ${s.owner.ownerName}`}>
        <div style={{ fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Period</div>
              <div style={{ fontWeight: 700 }}>
                {isTillDate ? `Till ${fmtDate(s.periodEnd)}` : `${fmtDate(s.periodStart)} — ${fmtDate(s.periodEnd)}`}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
              <div style={{ fontWeight: 700, color: s.status === 'SETTLED' ? '#10b981' : '#f59e0b' }}>
                {s.status === 'SETTLED' ? '✓ Settled' : '◷ Pending'}
                {s.settledAt && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>on {fmtDate(s.settledAt)}</span>}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Financial Breakdown</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <tbody>
              {[
                { label: 'Owner Payout (Weight × Rate)', value: fmt(s.totalRevenue), color: '#f59e0b' },
                { label: 'Fuel Expenses', value: `−${fmt(s.totalFuel)}`, color: '#ef4444' },
                { label: 'Maintenance', value: `−${fmt(s.totalMaint)}`, color: '#ef4444' },
                { label: 'Tolls', value: `−${fmt(s.totalTolls)}`, color: '#ef4444' },
                { label: 'Other (Driver Advance, Cash)', value: `−${fmt(s.totalOther)}`, color: '#ef4444' },
              ].map(r => (
                <tr key={r.label}>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8' }}>{r.label}</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', color: r.color, fontWeight: 700 }}>{r.value}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700 }}>Net Settlement</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right', color: '#10b981', fontWeight: 800, fontSize: 15 }}>
                  {fmt(s.totalRevenue - s.totalFuel - s.totalMaint - s.totalTolls - s.totalOther)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8' }}>Advances Paid (All Time)</td>
                <td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', color: '#f97316', fontWeight: 700 }}>−{fmt(s.totalAdvances)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: s.finalPayout > 0 ? 'rgba(34,211,238,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${s.finalPayout > 0 ? 'rgba(34,211,238,0.15)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Balance Due</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: s.finalPayout > 0 ? '#22d3ee' : '#ef4444' }}>{fmt(s.finalPayout)}</span>
          </div>

          <div style={{ marginTop: 16, fontSize: 11, color: '#64748b' }}>
            <span>Created: {fmtDate(s.createdAt)}</span>
            <span style={{ margin: '0 8px' }}>·</span>
            <span>{s.tripsCount} trips</span>
            <span style={{ margin: '0 8px' }}>·</span>
            <span>{s.owner.vehicles.length} vehicle(s)</span>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`Edit Settlement — ${s.owner.ownerName}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: '#64748b', padding: '8px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 8 }}>
            ⚠️ Only edit if there&apos;s a data entry error. Changes will recalculate the Balance Due automatically.
          </div>

          {[
            { label: 'Owner Payout (₹)', val: rev, set: setRev, color: '#f59e0b' },
            { label: 'Fuel (₹)', val: fuel, set: setFuel, color: '#ef4444' },
            { label: 'Maintenance (₹)', val: maint, set: setMaint, color: '#ef4444' },
            { label: 'Tolls (₹)', val: tolls, set: setTolls, color: '#ef4444' },
            { label: 'Other (₹)', val: other, set: setOther, color: '#ef4444' },
            { label: 'Advances Paid (₹)', val: adv, set: setAdv, color: '#f97316' },
          ].map(f => (
            <div key={f.label} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, color: f.color }}>{f.label}</label>
              <input type="number" className="form-input" value={f.val} onChange={e => f.set(Number(e.target.value) || 0)} step="100" />
            </div>
          ))}

          {/* Live preview */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>Payout − Deductions = Net</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{fmt(rev)} − {fmt(operationalDed)} = {fmt(net)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>Net − Advances = Balance Due</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: balanceDue > 0 ? '#22d3ee' : '#ef4444' }}>{fmt(balanceDue)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setEditOpen(false)} style={{ padding: '8px 16px' }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '8px 20px' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
