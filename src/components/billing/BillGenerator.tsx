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

const card: React.CSSProperties = { 
  background: 'var(--color-bg-secondary)', 
  border: '1px solid var(--color-border)', 
  borderRadius: 16, 
  padding: 24, 
  marginBottom: 24,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
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
    <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{border:1px solid #ddd;padding:4px 6px}th{background:#f0f0f0}.right{text-align:right}</style>
    </head><body>${printRef.current.innerHTML}</body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: 'var(--color-accent)', color: '#000', padding: '6px 10px', borderRadius: 8 }}>🧾</span>
          Settlement & Bill Generator
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 14 }}>
          Configure custom freight rates and generate detailed settlement reports for vehicle owners.
        </p>
      </div>

      {/* ── RATE CONFIGURATION ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>⚙️ Custom Rate Configuration</div>
          <div style={{ fontSize: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: 20, fontWeight: 600 }}>
            Global Default: ₹{projectDefaultOwnerRate}/MT
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Owner rates */}
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 12, padding: 16, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🧑</span> Owner-level Override
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>Applies to all their vehicles</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 8 }}>
              {owners.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg-secondary)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{o.ownerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{o.vehicles.length} vehicle(s)</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="form-input" placeholder={`₹${projectDefaultOwnerRate}`}
                      value={ownerRates[o.id] ?? ''} min={0} step={1}
                      onChange={e => setOwnerRates(p => ({ ...p, [o.id]: e.target.value }))}
                      style={{ width: 90, fontSize: 14, padding: '8px 12px', textAlign: 'right' }} />
                    <button className="btn btn-primary" onClick={() => saveOwnerRate(o.id)} disabled={saving[o.id]} style={{ padding: '8px 14px', fontSize: 13, minWidth: 64 }}>
                      {saving[o.id] ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle rates */}
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 12, padding: 16, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🚛</span> Vehicle-level Override
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>Highest Priority</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 8 }}>
              {vehicles.map(v => {
                const effective = getEffectiveRate(v, projectDefaultOwnerRate)
                const source = v.ownerRateOverride != null ? 'vehicle' : v.owner?.ownerRateOverride != null ? 'owner' : 'project'
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg-secondary)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{v.plateNo}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{v.owner.ownerName}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 700, background: source === 'vehicle' ? 'rgba(139,92,246,0.15)' : source === 'owner' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)', color: source === 'vehicle' ? '#8b5cf6' : source === 'owner' ? '#f59e0b' : '#94a3b8' }}>
                        Active: ₹{effective}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="number" className="form-input" placeholder="Override"
                          value={vehicleRates[v.id] ?? ''} min={0} step={1}
                          onChange={e => setVehicleRates(p => ({ ...p, [v.id]: e.target.value }))}
                          style={{ width: 80, fontSize: 13, padding: '6px 10px', textAlign: 'right' }} />
                        <button className="btn btn-primary" onClick={() => saveVehicleRate(v.id)} disabled={saving['v' + v.id]} style={{ padding: '6px 12px', fontSize: 12, minWidth: 54 }}>
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
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>📊 Bill Parameters</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginBottom: 24 }}>

          {/* Period */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12, letterSpacing: '0.5px' }}>1. Select Period</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: 'var(--color-bg-primary)', padding: 4, borderRadius: 8 }}>
              {(['weekly', 'monthly', 'custom'] as const).map(t => (
                <button key={t} onClick={() => setPeriodType(t)} style={{ flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: periodType === t ? 'var(--color-accent)' : 'transparent', color: periodType === t ? '#000' : 'var(--color-text-primary)', transition: 'all 0.2s' }}>{t}</button>
              ))}
            </div>
            {periodType === 'weekly' && <select className="form-select" style={{ fontSize: 13, width: '100%', padding: '10px' }} value={selectedWeek.start} onChange={e => setSelectedWeek(weeks.find(w => w.start === e.target.value) || weeks[0])}>{weeks.map(w => <option key={w.start} value={w.start}>{w.label}</option>)}</select>}
            {periodType === 'monthly' && <select className="form-select" style={{ fontSize: 13, width: '100%', padding: '10px' }} value={selectedMonth.start} onChange={e => setSelectedMonth(months.find(m => m.start === e.target.value) || months[0])}>{months.map(m => <option key={m.start} value={m.start}>{m.label}</option>)}</select>}
            {periodType === 'custom' && <div style={{ display: 'flex', gap: 8 }}><input type="date" className="form-input" style={{ fontSize: 13, flex: 1 }} value={customStart} onChange={e => setCustomStart(e.target.value)} /><input type="date" className="form-input" style={{ fontSize: 13, flex: 1 }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></div>}
          </div>

          {/* Vehicle filter */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12, letterSpacing: '0.5px' }}>2. Filter Vehicles {selectedVehicles.length > 0 && <span style={{ color: 'var(--color-accent)' }}>({selectedVehicles.length})</span>}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto', background: 'var(--color-bg-primary)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingBottom: 8, borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
                <input type="checkbox" checked={selectedVehicles.length === 0} onChange={() => setSelectedVehicles([])} style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }} />
                <strong>All Vehicles</strong>
              </label>
              {vehicles.map(v => (
                <label key={v.id} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedVehicles.includes(v.id)} onChange={e => setSelectedVehicles(p => e.target.checked ? [...p, v.id] : p.filter(i => i !== v.id))} style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }} />
                  {v.plateNo} <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{v.owner.ownerName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Deductibles */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12, letterSpacing: '0.5px' }}>3. Deduct from Settlement</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--color-bg-primary)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)' }}>
              {Object.entries(EXP_LABELS).map(([type, label]) => (
                <label key={type} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: deductibles.includes(type) ? 'rgba(239,68,68,0.1)' : 'transparent', padding: '6px 8px', borderRadius: 6, transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={deductibles.includes(type)} style={{ width: 14, height: 14, accentColor: '#ef4444' }} onChange={e => setDeductibles(p => e.target.checked ? [...p, type] : p.filter(t => t !== type))} />
                  <span style={{ color: deductibles.includes(type) ? '#ef4444' : 'var(--color-text-primary)', fontWeight: deductibles.includes(type) ? 700 : 500 }}>{label.split(' ')[1]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isPending} style={{ fontSize: 16, padding: '14px 40px', fontWeight: 800, borderRadius: 30, boxShadow: '0 4px 14px 0 rgba(226,232,240,0.39)' }}>
            {isPending ? '⏳ Compiling Data...' : '🧾 Generate Settlement Bill'}
          </button>
        </div>
      </div>

      {/* ── BILL OUTPUT ── */}
      {bill && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📄</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>Settlement Invoice</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{bill.period.label} ({bill.period.start} → {bill.period.end}) · {bill.vehicles.length} vehicles</div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
              <span>🖨️</span> Print / Export PDF
            </button>
          </div>

          {/* Grand total */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Trips', val: String(bill.grandTotal.trips), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
              { label: 'Total Weight', val: `${bill.grandTotal.weight.toFixed(1)} MT`, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
              { label: 'Gross Payout', val: fmt(bill.grandTotal.grossPayout), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Total Deductions', val: `-${fmt(bill.grandTotal.totalDeductions)}`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Net Payable', val: fmt(bill.grandTotal.netSettlement), color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            ].map(k => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: '16px', textAlign: 'center', border: `1px solid ${k.color}30` }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.val}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 6, opacity: 0.8 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Per-vehicle */}
          <div ref={printRef}>
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body { background: white !important; color: black !important; margin: 0; padding: 20px; font-family: sans-serif; }
                .print-card { border: 1px solid #ddd !important; border-radius: 8px !important; margin-bottom: 20px !important; page-break-inside: avoid; }
                .print-header { background: #f8f9fa !important; -webkit-print-color-adjust: exact; padding: 12px 16px !important; }
                .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .print-table th, .print-table td { border: 1px solid #eee; padding: 8px; text-align: left; font-size: 11px; }
                .print-table th { background: #f8f9fa !important; font-weight: bold; }
                .text-right { text-align: right !important; }
                .text-green { color: #059669 !important; }
                .text-red { color: #dc2626 !important; }
              }
            `}} />
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--color-text-muted)' }}>VEHICLE BREAKDOWN</div>
            {bill.vehicles.map(v => (
              <div key={v.vehicleId} className="print-card" style={{ border: '1px solid var(--color-border)', borderRadius: 12, marginBottom: 16, overflow: 'hidden', background: 'var(--color-bg-primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setExpanded(expanded === v.vehicleId ? null : v.vehicleId)}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚛</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{v.plateNo}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{v.ownerName}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 700, background: v.effectiveRateSource === 'vehicle' ? 'rgba(139,92,246,0.1)' : v.effectiveRateSource === 'owner' ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)', color: v.effectiveRateSource === 'vehicle' ? '#8b5cf6' : v.effectiveRateSource === 'owner' ? '#f59e0b' : '#94a3b8', border: '1px solid currentColor' }}>
                      Rate: ₹{v.effectiveOwnerRate}/MT ({v.effectiveRateSource})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{v.totalTrips} trips</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{v.totalWeight.toFixed(1)} MT</span>
                    </div>
                    <div style={{ width: 1, height: 30, background: 'var(--color-border)' }} />
                    <div style={{ textAlign: 'right', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>{fmt(v.grossPayout)} Gross</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>−{fmt(v.deductions.total)} Deduct</span>
                    </div>
                    <div style={{ width: 1, height: 30, background: 'var(--color-border)' }} />
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>Net Payable</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{fmt(v.netSettlement)}</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', transition: 'transform 0.3s', transform: expanded === v.vehicleId ? 'rotate(180deg)' : 'none' }}>
                      ▼
                    </div>
                  </div>
                </div>

                {expanded === v.vehicleId && (
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    {/* Deduction breakdown */}
                    {v.deductions.total > 0 && (
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '12px 20px', background: 'rgba(239,68,68,0.03)', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
                        <span style={{ fontWeight: 800, color: '#ef4444', marginRight: 8 }}>Deductions:</span>
                        {[['⛽ Fuel', v.deductions.fuel], ['🛣️ Toll', v.deductions.toll], ['🔧 Maint.', v.deductions.maintenance], ['👤 Driver Adv', v.deductions.driverAdvance], ['🏦 Owner Adv', v.deductions.ownerAdvance], ['💵 Other', v.deductions.other]].filter(([, n]) => (n as number) > 0).map(([lbl, n]) => (
                          <span key={String(lbl)} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{lbl}: {fmt(n as number)}</span>
                        ))}
                      </div>
                    )}

                    {/* Trip table */}
                    <div className="data-table-wrapper" style={{ maxHeight: 400, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                      <table className="data-table print-table" style={{ marginTop: 16 }}>
                        <thead><tr><th>Date</th><th>Invoice No</th><th>LR No</th><th className="text-right" style={{ textAlign: 'right' }}>Weight (MT)</th><th className="text-right" style={{ textAlign: 'right' }}>Applied Rate</th><th className="text-right" style={{ textAlign: 'right' }}>Payout</th></tr></thead>
                        <tbody>
                          {v.trips.map(t => (
                            <tr key={t.id}>
                              <td style={{ fontSize: 13, fontWeight: 500 }}>{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t.invoiceNo || '—'}</td>
                              <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t.lrNo || '—'}</td>
                              <td className="text-right" style={{ textAlign: 'right', fontWeight: 700 }}>{t.weight.toFixed(2)}</td>
                              <td className="text-right" style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>₹{t.appliedOwnerRate}</td>
                              <td className="text-right" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-text-primary)' }}>{fmt(t.ownerPayout)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: 'var(--color-bg-secondary)' }}>
                            <td colSpan={3} style={{ fontWeight: 700, padding: '12px 8px' }}>Total Freight</td>
                            <td className="text-right" style={{ textAlign: 'right', fontWeight: 800, padding: '12px 8px' }}>{v.totalWeight.toFixed(2)} MT</td>
                            <td />
                            <td className="text-right" style={{ textAlign: 'right', fontWeight: 800, color: '#f59e0b', fontSize: 14, padding: '12px 8px' }}>{fmt(v.grossPayout)}</td>
                          </tr>
                          {v.deductions.total > 0 && <tr><td colSpan={5} className="text-red" style={{ color: '#ef4444', fontWeight: 700, padding: '12px 8px', borderTop: 'none' }}>Less: Total Deductions</td><td className="text-right text-red" style={{ textAlign: 'right', color: '#ef4444', fontWeight: 800, fontSize: 14, padding: '12px 8px', borderTop: 'none' }}>−{fmt(v.deductions.total)}</td></tr>}
                          <tr style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <td colSpan={5} className="text-green" style={{ fontWeight: 800, color: '#059669', padding: '16px 8px', fontSize: 14, borderTop: '2px solid #10b981' }}>NET SETTLEMENT PAYABLE</td>
                            <td className="text-right text-green" style={{ textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: 18, padding: '16px 8px', borderTop: '2px solid #10b981' }}>{fmt(v.netSettlement)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {bill.vehicles.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', background: 'var(--color-bg-primary)', borderRadius: 12, border: '1px dashed var(--color-border)' }}>No trips found for this period.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
