'use client'

import { useState, useTransition, useRef } from 'react'
import { generateBill, setVehicleRateOverride, setOwnerRateOverride, BillSummary } from '@/lib/actions/billing'
import toast from 'react-hot-toast'

interface Owner { id: string; ownerName: string; ownerRateOverride: number | null; vehicles: { id: string; plateNo: string; ownerRateOverride: number | null; project: { ownerRate: number } | null }[] }
interface Vehicle { id: string; plateNo: string; ownerRateOverride: number | null; owner: { id: string; ownerName: string; ownerRateOverride: number | null }; project: { ownerRate: number; partyRate: number } | null }

interface Props {
  vehicles: Vehicle[]
  owners: Owner[]
  projectDefaultOwnerRate: number
  projectPartyRate?: number
}

const EXP_LABELS: Record<string, string> = {
  FUEL: '⛽ Fuel', TOLL: '🛣️ Toll', MAINTENANCE: '🔧 Maintenance',
  DRIVER_ADVANCE: '👤 Driver Advance', OWNER_ADVANCE: '🏦 Owner Advance', CASH_PAYMENT: '💵 Cash Payment',
}
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

function getEffectiveRate(v: Vehicle, projectDefault: number) {
  return v.ownerRateOverride ?? v.owner?.ownerRateOverride ?? v.project?.ownerRate ?? projectDefault
}

function getWeeks() {
  const weeks = []
  const now = new Date()
  for (let i = 0; i < 8; i++) {
    const end = new Date(now); end.setDate(now.getDate() - i * 7)
    const start = new Date(end); start.setDate(end.getDate() - 6)
    const lbl = `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    weeks.push({ label: lbl, start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] })
  }
  return weeks
}

function getMonths() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    months.push({ label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), start: d.toISOString().split('T')[0], end: end.toISOString().split('T')[0] })
  }
  return months
}

const premiumCard: React.CSSProperties = { 
  background: 'var(--color-bg-secondary)', 
  border: '1px solid rgba(255,255,255,0.05)', 
  borderRadius: 20, 
  padding: 32, 
  marginBottom: 32,
  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
}

export default function BillGenerator({ vehicles, owners, projectDefaultOwnerRate }: Props) {
  const [isPending, startTransition] = useTransition()
  const printRef = useRef<HTMLDivElement>(null)
  const weeks = getWeeks()
  const months = getMonths()

  // Rate overrides state (local edits before save)
  const [ownerRates, setOwnerRates] = useState<Record<string, string>>(Object.fromEntries(owners.map(o => [o.id, String(o.ownerRateOverride ?? '')])))
  const [vehicleRates, setVehicleRates] = useState<Record<string, string>>(Object.fromEntries(vehicles.map(v => [v.id, String(v.ownerRateOverride ?? '')])))
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // Bill config
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'custom'>('weekly')
  const [selectedWeek, setSelectedWeek] = useState(weeks[0])
  const [selectedMonth, setSelectedMonth] = useState(months[0])
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [deductibles, setDeductibles] = useState<string[]>(['TOLL', 'OWNER_ADVANCE'])
  const [bill, setBill] = useState<BillSummary | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [billView, setBillView] = useState<'vehicle' | 'owner'>('owner')

  async function saveOwnerRate(id: string) {
    setSaving(p => ({ ...p, [id]: true }))
    try {
      const val = ownerRates[id] === '' ? null : parseFloat(ownerRates[id])
      await setOwnerRateOverride(id, val)
      toast.success('Owner rate saved')
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(p => ({ ...p, [id]: false })) }
  }

  async function saveVehicleRate(id: string) {
    setSaving(p => ({ ...p, ['v' + id]: true }))
    try {
      const val = vehicleRates[id] === '' ? null : parseFloat(vehicleRates[id])
      await setVehicleRateOverride(id, val)
      toast.success('Vehicle rate saved')
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(p => ({ ...p, ['v' + id]: false })) }
  }

  function handleGenerate() {
    let start = '', end = ''
    if (periodType === 'weekly') { start = selectedWeek.start; end = selectedWeek.end }
    else if (periodType === 'monthly') { start = selectedMonth.start; end = selectedMonth.end }
    else { start = customStart; end = customEnd }
    if (!start || !end) return toast.error('Select a period')
    startTransition(async () => {
      try {
        const result = await generateBill({ type: periodType, startDate: start, endDate: end }, selectedVehicles.length ? selectedVehicles : undefined, deductibles)
        setBill(result)
        toast.success(`Bill generated — ${result.vehicles.length} vehicles`)
      } catch (e: any) { toast.error(e.message) }
    })
  }

  function handlePrint() {
    const w = window.open('', '_blank')
    if (!w || !printRef.current) return
    w.document.write(`<html><head><title>Bill – ${bill?.period.label}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#111;}
      table{width:100%;border-collapse:collapse;margin-bottom:12px;}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}
      th{background:#f8f9fa;font-weight:bold;}
      .right{text-align:right;}
      .invoice-box { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-bottom: 24px; page-break-inside: avoid; }
      .text-green { color: #059669; }
      .text-red { color: #dc2626; }
      .text-orange { color: #d97706; }
      h4 { margin: 0 0 10px 0; color: #555; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    </style>
    </head><body>${printRef.current.innerHTML}</body></html>`)
    w.document.close(); w.print()
  }

  const renderExpandedVehicle = (v: any) => (
    <div style={{ padding: '24px 32px', background: 'var(--color-bg-primary)', borderTop: '1px solid var(--color-border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, marginBottom: 24 }}>
        
        {/* Earnings Section */}
        <div>
          <h4 style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#3b82f6' }}>🟢</span> 1. TRIP EARNINGS
          </h4>
          <table className="data-table" style={{ fontSize: 12, width: '100%' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Inv/LR</th>
                <th style={{ textAlign: 'right' }}>Weight</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Payout</th>
              </tr>
            </thead>
            <tbody>
              {v.trips.map((t: any) => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{t.invoiceNo || t.lrNo || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.weight.toFixed(2)} MT</td>
                  <td style={{ textAlign: 'right', color: '#8b5cf6' }}>₹{t.appliedOwnerRate}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>{fmt(t.ownerPayout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: 12, padding: '12px', background: 'rgba(245,158,11,0.05)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginRight: 12 }}>TOTAL EARNINGS:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>{fmt(v.grossPayout)}</span>
          </div>
        </div>

        {/* Deductions & Payments Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {v.deductions.items.length > 0 ? (
            <div>
              <h4 style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#ef4444' }}>🔴</span> 2. DEDUCTIONS
              </h4>
              
              {/* Gross Summary of Deductions */}
              <div style={{ background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(239,68,68,0.1)', paddingBottom: 6 }}>Category Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {v.deductions.fuel > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Fuel</span><span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>−{fmt(v.deductions.fuel)}</span></div>}
                  {v.deductions.toll > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Toll</span><span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>−{fmt(v.deductions.toll)}</span></div>}
                  {v.deductions.maintenance > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Maintenance</span><span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>−{fmt(v.deductions.maintenance)}</span></div>}
                  {v.deductions.driverAdvance > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Driver Adv.</span><span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>−{fmt(v.deductions.driverAdvance)}</span></div>}
                  {v.deductions.ownerAdvance > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Owner Adv.</span><span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>−{fmt(v.deductions.ownerAdvance)}</span></div>}
                  {v.deductions.other > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Cash / Other</span><span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>−{fmt(v.deductions.other)}</span></div>}
                </div>
              </div>

              {/* Detailed Item List */}
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Further Details</div>
              <div style={{ background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 10, padding: 12 }}>
                {v.deductions.items.map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: i < v.deductions.items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <span style={{ color: 'var(--color-text-muted)', width: 80 }}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span style={{ fontWeight: 600, flex: 1 }}>{item.label}</span>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>−{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginRight: 12 }}>TOTAL DEDUCTIONS:</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#ef4444' }}>−{fmt(v.deductions.total)}</span>
              </div>
            </div>
          ) : (
            <div>
              <h4 style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#ef4444' }}>🔴</span> 2. DEDUCTIONS
              </h4>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>No deductions for this period.</div>
            </div>
          )}

          {v.paidItems && v.paidItems.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#f97316' }}>🟠</span> 3. ALREADY PAID (ADVANCES)
              </h4>

              {/* Gross Summary of Paid Items */}
              <div style={{ background: 'rgba(249,115,22,0.02)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#f97316', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(249,115,22,0.1)', paddingBottom: 6 }}>Category Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {v.paidItems.filter((p: any) => p.type === 'OWNER_ADVANCE').reduce((s: number, p: any) => s + p.amount, 0) > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Owner Adv.</span><span style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>−{fmt(v.paidItems.filter((p: any) => p.type === 'OWNER_ADVANCE').reduce((s: number, p: any) => s + p.amount, 0))}</span></div>}
                  {v.paidItems.filter((p: any) => p.type === 'CASH_PAYMENT').reduce((s: number, p: any) => s + p.amount, 0) > 0 && <div><span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Cash / Other</span><span style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>−{fmt(v.paidItems.filter((p: any) => p.type === 'CASH_PAYMENT').reduce((s: number, p: any) => s + p.amount, 0))}</span></div>}
                </div>
              </div>

              {/* Detailed Item List */}
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Further Details</div>
              <div style={{ background: 'rgba(249,115,22,0.02)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: 10, padding: 12 }}>
                {v.paidItems.map((p: any, pi: number) => (
                  <div key={pi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: pi < v.paidItems.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <span style={{ color: 'var(--color-text-muted)', width: 80 }}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span style={{ fontWeight: 600, flex: 1 }}>{p.label}</span>
                    <span style={{ color: '#f97316', fontWeight: 700 }}>−{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginRight: 12 }}>TOTAL PAID:</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#f97316' }}>−{fmt(v.previouslyPaid)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>NET SETTLEMENT</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{fmt(v.netSettlement)}</div>
          </div>
          {v.previouslyPaid > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>LESS: ALREADY PAID</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>−{fmt(v.previouslyPaid)}</div>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#22d3ee', fontWeight: 700, marginBottom: 4 }}>FINAL BALANCE DUE</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: v.balanceDue < 0 ? '#ef4444' : '#22d3ee' }}>{fmt(v.balanceDue)}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ background: 'var(--color-accent)', color: '#000', padding: '8px 12px', borderRadius: 10, boxShadow: '0 4px 12px rgba(226,232,240,0.15)' }}>🧾</span>
          Settlement & Bill Generator
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 15 }}>
          Configure custom freight rates and generate detailed settlement reports with precise operational tracking.
        </p>
      </div>

      {/* ── RATE CONFIGURATION ── */}
      <div style={premiumCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>⚙️ Rate Configuration</div>
          <div style={{ fontSize: 13, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '6px 14px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(59,130,246,0.2)' }}>
            Global Default: ₹{projectDefaultOwnerRate}/MT
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Owner rates */}
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 16, padding: 20, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(245,158,11,0.1)', padding: '6px', borderRadius: 8 }}>🧑</span> Owner-level Override
              <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.05)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>Applies to all their vehicles</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
              {owners.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg-secondary)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{o.ownerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{o.vehicles.length} vehicle(s)</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="number" className="form-input" placeholder={`₹${projectDefaultOwnerRate}`}
                      value={ownerRates[o.id] ?? ''} min={0} step={1}
                      onChange={e => setOwnerRates(p => ({ ...p, [o.id]: e.target.value }))}
                      style={{ width: 100, fontSize: 14, padding: '10px 12px', textAlign: 'right', borderRadius: 8 }} />
                    <button className="btn btn-primary" onClick={() => saveOwnerRate(o.id)} disabled={saving[o.id]} style={{ padding: '10px 16px', fontSize: 13, minWidth: 70, borderRadius: 8 }}>
                      {saving[o.id] ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle rates */}
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 16, padding: 20, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(139,92,246,0.1)', padding: '6px', borderRadius: 8 }}>🚛</span> Vehicle-level Override
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', background: 'rgba(139,92,246,0.05)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(139,92,246,0.2)' }}>Highest Priority</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
              {vehicles.map(v => {
                const effective = getEffectiveRate(v, projectDefaultOwnerRate)
                const source = v.ownerRateOverride != null ? 'vehicle' : v.owner?.ownerRateOverride != null ? 'owner' : 'project'
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg-secondary)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{v.plateNo}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{v.owner.ownerName}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 14, fontWeight: 700, background: source === 'vehicle' ? 'rgba(139,92,246,0.15)' : source === 'owner' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)', color: source === 'vehicle' ? '#8b5cf6' : source === 'owner' ? '#f59e0b' : '#94a3b8' }}>
                        Active: ₹{effective}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="number" className="form-input" placeholder="Override"
                          value={vehicleRates[v.id] ?? ''} min={0} step={1}
                          onChange={e => setVehicleRates(p => ({ ...p, [v.id]: e.target.value }))}
                          style={{ width: 90, fontSize: 13, padding: '8px 10px', textAlign: 'right', borderRadius: 8 }} />
                        <button className="btn btn-primary" onClick={() => saveVehicleRate(v.id)} disabled={saving['v' + v.id]} style={{ padding: '8px 14px', fontSize: 13, minWidth: 64, borderRadius: 8 }}>
                          {saving['v' + v.id] ? '...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── BILL CONFIG ── */}
      <div style={premiumCard}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'rgba(16,185,129,0.1)', padding: '6px', borderRadius: 8 }}>📊</span> Bill Parameters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginBottom: 32 }}>

          {/* Period */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12, letterSpacing: '0.5px' }}>1. Select Period</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: 'var(--color-bg-primary)', padding: 6, borderRadius: 10, border: '1px solid var(--color-border)' }}>
              {(['weekly', 'monthly', 'custom'] as const).map(t => (
                <button key={t} onClick={() => setPeriodType(t)} style={{ flex: 1, padding: '10px 6px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: periodType === t ? 'var(--color-accent)' : 'transparent', color: periodType === t ? '#000' : 'var(--color-text-primary)', transition: 'all 0.2s', boxShadow: periodType === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>{t}</button>
              ))}
            </div>
            {periodType === 'weekly' && <select className="form-select" style={{ fontSize: 14, width: '100%', padding: '12px' }} value={selectedWeek.start} onChange={e => setSelectedWeek(weeks.find(w => w.start === e.target.value) || weeks[0])}>{weeks.map(w => <option key={w.start} value={w.start}>{w.label}</option>)}</select>}
            {periodType === 'monthly' && <select className="form-select" style={{ fontSize: 14, width: '100%', padding: '12px' }} value={selectedMonth.start} onChange={e => setSelectedMonth(months.find(m => m.start === e.target.value) || months[0])}>{months.map(m => <option key={m.start} value={m.start}>{m.label}</option>)}</select>}
            {periodType === 'custom' && <div style={{ display: 'flex', gap: 12 }}><input type="date" className="form-input" style={{ fontSize: 14, flex: 1 }} value={customStart} onChange={e => setCustomStart(e.target.value)} /><input type="date" className="form-input" style={{ fontSize: 14, flex: 1 }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></div>}
          </div>

          {/* Vehicle filter */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12, letterSpacing: '0.5px' }}>2. Filter Vehicles {selectedVehicles.length > 0 && <span style={{ color: 'var(--color-accent)' }}>({selectedVehicles.length})</span>}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto', background: 'var(--color-bg-primary)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', paddingBottom: 10, borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
                <input type="checkbox" checked={selectedVehicles.length === 0} onChange={() => setSelectedVehicles([])} style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }} />
                <strong>All Vehicles</strong>
              </label>
              {vehicles.map(v => (
                <label key={v.id} style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedVehicles.includes(v.id)} onChange={e => setSelectedVehicles(p => e.target.checked ? [...p, v.id] : p.filter(i => i !== v.id))} style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }} />
                  {v.plateNo} <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{v.owner.ownerName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Deductibles */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12, letterSpacing: '0.5px' }}>
              3. Deduct from Settlement
              <span style={{ display: 'block', fontSize: 10, color: '#f59e0b', marginTop: 4, fontWeight: 500, textTransform: 'none' }}>Unchecked advances will move to "Already Paid"</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--color-bg-primary)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border)' }}>
              {Object.entries(EXP_LABELS).map(([type, label]) => (
                <label key={type} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: deductibles.includes(type) ? 'rgba(239,68,68,0.1)' : 'transparent', padding: '8px 10px', borderRadius: 8, transition: 'all 0.2s', border: `1px solid ${deductibles.includes(type) ? 'rgba(239,68,68,0.2)' : 'transparent'}` }}>
                  <input type="checkbox" checked={deductibles.includes(type)} style={{ width: 16, height: 16, accentColor: '#ef4444' }} onChange={e => setDeductibles(p => e.target.checked ? [...p, type] : p.filter(t => t !== type))} />
                  <span style={{ color: deductibles.includes(type) ? '#ef4444' : 'var(--color-text-primary)', fontWeight: deductibles.includes(type) ? 700 : 500 }}>{label.split(' ')[1]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isPending} style={{ fontSize: 16, padding: '16px 48px', fontWeight: 800, borderRadius: 30, boxShadow: '0 8px 24px rgba(226,232,240,0.2)' }}>
            {isPending ? '⏳ Compiling Data...' : '🧾 Generate Settlement Bill'}
          </button>
        </div>
      </div>

      {/* ── BILL OUTPUT ── */}
      {bill && (
        <div style={premiumCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 4px 12px rgba(226,232,240,0.2)' }}>📄</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Settlement Invoice</div>
                <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>{bill.period.label} ({bill.period.start} → {bill.period.end}) · {bill.vehicles.length} vehicles</div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 12 }}>
              <span>🖨️</span> Print / Export PDF
            </button>
          </div>

          {/* Grand total Sequence */}
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 16, padding: '28px 32px', marginBottom: 40, border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: 1.5 }}>OVERALL SETTLEMENT SUMMARY</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', background: 'var(--color-bg-secondary)', padding: '6px 16px', borderRadius: 20 }}>{bill.grandTotal.trips} Trips · {bill.grandTotal.weight.toFixed(1)} MT</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-secondary)', borderRadius: 16, padding: '24px 40px' }}>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>Gross Payout</div>
                 <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b' }}>{fmt(bill.grandTotal.grossPayout)}</div>
              </div>
              <div style={{ fontSize: 28, color: 'var(--color-text-muted)', opacity: 0.5, fontWeight: 300 }}>−</div>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>Deductions</div>
                 <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444' }}>{fmt(bill.grandTotal.totalDeductions)}</div>
              </div>
              <div style={{ fontSize: 28, color: 'var(--color-text-muted)', opacity: 0.5, fontWeight: 300 }}>=</div>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>Net Settlement</div>
                 <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981' }}>{fmt(bill.grandTotal.netSettlement)}</div>
              </div>
              <div style={{ fontSize: 28, color: 'var(--color-text-muted)', opacity: 0.5, fontWeight: 300 }}>−</div>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>Already Paid</div>
                 <div style={{ fontSize: 26, fontWeight: 900, color: '#f97316' }}>{fmt(bill.grandTotal.totalPreviouslyPaid)}</div>
              </div>
              <div style={{ width: 2, height: 60, background: 'var(--color-border)', margin: '0 16px' }}></div>
              <div style={{ textAlign: 'right', background: 'rgba(34,211,238,0.05)', padding: '16px 24px', borderRadius: 12, border: '1px solid rgba(34,211,238,0.2)' }}>
                 <div style={{ fontSize: 12, color: '#22d3ee', fontWeight: 800, marginBottom: 6, letterSpacing: 1 }}>TOTAL BALANCE DUE</div>
                 <div style={{ fontSize: 32, fontWeight: 900, color: bill.grandTotal.totalBalanceDue < 0 ? '#ef4444' : '#22d3ee' }}>{fmt(bill.grandTotal.totalBalanceDue)}</div>
              </div>
            </div>
          </div>

          {/* Per-vehicle */}
          <div ref={printRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: 1 }}>DETAILED BREAKDOWN</div>
              <div style={{ display: 'flex', background: 'var(--color-bg-primary)', borderRadius: 10, padding: 4, gap: 4, border: '1px solid var(--color-border)' }}>
                {(['owner', 'vehicle'] as const).map(v => (
                  <button key={v} onClick={() => setBillView(v)} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', background: billView === v ? 'var(--color-accent)' : 'transparent', color: billView === v ? '#000' : 'var(--color-text-primary)', transition: 'all 0.2s' }}>{v === 'owner' ? '🧑 By Owner' : '🚛 By Vehicle'}</button>
                ))}
              </div>
            </div>
            
            {/* Owner Summary View */}
            <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: 8 }}>
            {billView === 'owner' && bill.ownerSummaries.map(os => (
              <div key={os.ownerId} style={{ border: '1px solid var(--color-border)', borderRadius: 16, marginBottom: 24, overflow: 'hidden', background: 'var(--color-bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', background: 'rgba(139,92,246,0.05)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧑</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>{os.ownerName}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>{os.vehicles.length} vehicle(s) · {os.vehicles.reduce((a, v) => a + v.totalTrips, 0)} trips</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Gross</div><div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>{fmt(os.totalGross)}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Deductions</div><div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>−{fmt(os.totalDeductions)}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Net</div><div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{fmt(os.totalNet)}</div></div>
                    <div style={{ width: 1, height: 40, background: 'var(--color-border)' }} />
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Already Paid</div><div style={{ fontSize: 16, fontWeight: 800, color: '#f97316' }}>−{fmt(os.totalPreviouslyPaid)}</div></div>
                    <div style={{ textAlign: 'right', padding: '10px 16px', background: 'rgba(34,211,238,0.1)', borderRadius: 12, border: '1px solid rgba(34,211,238,0.3)' }}>
                      <div style={{ fontSize: 11, color: '#22d3ee', fontWeight: 800, letterSpacing: 0.5 }}>BALANCE DUE</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: os.totalBalanceDue < 0 ? '#ef4444' : '#22d3ee' }}>{fmt(os.totalBalanceDue)}</div>
                    </div>
                  </div>
                </div>
                {os.vehicles.map((v: any) => (
                  <div key={v.vehicleId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', cursor: 'pointer', background: expanded === v.vehicleId ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'all 0.2s' }} onClick={() => setExpanded(expanded === v.vehicleId ? null : v.vehicleId)}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 900 }}>🚛 {v.plateNo}</span>
                        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 700 }}>₹{v.effectiveOwnerRate}/MT</span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{v.totalTrips} trips · {v.totalWeight.toFixed(1)} MT</span>
                      </div>
                      <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(v.grossPayout)}</span>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>−{fmt(v.deductions.total)}</span>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>{fmt(v.netSettlement)}</span>
                        {v.previouslyPaid > 0 && <span style={{ color: '#f97316', fontWeight: 600 }}>−{fmt(v.previouslyPaid)}</span>}
                        <span style={{ color: v.balanceDue < 0 ? '#ef4444' : '#22d3ee', fontWeight: 900, minWidth: 100, textAlign: 'right' }}>{fmt(v.balanceDue)} due</span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 12, width: 16, textAlign: 'center' }}>{expanded === v.vehicleId ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {expanded === v.vehicleId && renderExpandedVehicle(v)}
                  </div>
                ))}
              </div>
            ))}
            </div>

            {/* Vehicle view */}
            <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: 8 }}>
            {billView === 'vehicle' && bill.vehicles.map((v: any) => (
              <div key={v.vehicleId} style={{ border: '1px solid var(--color-border)', borderRadius: 16, marginBottom: 16, overflow: 'hidden', background: 'var(--color-bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', cursor: 'pointer', background: expanded === v.vehicleId ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'all 0.2s' }} onClick={() => setExpanded(expanded === v.vehicleId ? null : v.vehicleId)}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 900 }}>🚛 {v.plateNo}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{v.ownerName}</span>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 700 }}>₹{v.effectiveOwnerRate}/MT</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(v.grossPayout)}</span>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>−{fmt(v.deductions.total)}</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>{fmt(v.netSettlement)}</span>
                    {v.previouslyPaid > 0 && <span style={{ color: '#f97316', fontWeight: 600 }}>−{fmt(v.previouslyPaid)}</span>}
                    <span style={{ fontWeight: 900, color: v.balanceDue < 0 ? '#ef4444' : '#22d3ee', minWidth: 100, textAlign: 'right' }}>{fmt(v.balanceDue)} due</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 12, width: 16, textAlign: 'center' }}>{expanded === v.vehicleId ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expanded === v.vehicleId && renderExpandedVehicle(v)}
              </div>
            ))}
            </div>
            {bill.vehicles.length === 0 && <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)', background: 'var(--color-bg-primary)', borderRadius: 16, border: '1px dashed var(--color-border)', fontSize: 16, fontWeight: 600 }}>No trips found for this period.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
