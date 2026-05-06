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

const card: React.CSSProperties = { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, marginBottom: 16 }

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
      {/* ── RATE CONFIGURATION ── */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>⚙️ Rate Configuration
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 8 }}>
            Priority: Vehicle Rate → Owner Rate → Project Default (₹{projectDefaultOwnerRate}/MT)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Owner rates */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10 }}>🧑 Owner-level Rate (applies to all their vehicles)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {owners.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-primary)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{o.ownerName}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{o.vehicles.length} vehicle(s)</div>
                  </div>
                  <input type="number" className="form-input" placeholder={`₹${projectDefaultOwnerRate} (default)`}
                    value={ownerRates[o.id] ?? ''} min={0} step={1}
                    onChange={e => setOwnerRates(p => ({ ...p, [o.id]: e.target.value }))}
                    style={{ width: 110, fontSize: 13, padding: '6px 10px' }} />
                  <button className="btn btn-primary" onClick={() => saveOwnerRate(o.id)} disabled={saving[o.id]} style={{ padding: '6px 12px', fontSize: 12 }}>
                    {saving[o.id] ? '...' : 'Save'}
                  </button>
                  {ownerRates[o.id] && <span style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 700 }}>₹{ownerRates[o.id]}/MT</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle rates */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10 }}>🚛 Vehicle-level Rate (overrides owner rate)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {vehicles.map(v => {
                const effective = getEffectiveRate(v, projectDefaultOwnerRate)
                const source = v.ownerRateOverride != null ? 'vehicle' : v.owner?.ownerRateOverride != null ? 'owner' : 'project'
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-primary)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{v.plateNo}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{v.owner.ownerName}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, background: source === 'vehicle' ? 'rgba(139,92,246,0.12)' : source === 'owner' ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.1)', color: source === 'vehicle' ? '#8b5cf6' : source === 'owner' ? '#f59e0b' : '#64748b' }}>
                      ₹{effective} ({source})
                    </span>
                    <input type="number" className="form-input" placeholder="Override"
                      value={vehicleRates[v.id] ?? ''} min={0} step={1}
                      onChange={e => setVehicleRates(p => ({ ...p, [v.id]: e.target.value }))}
                      style={{ width: 90, fontSize: 13, padding: '6px 8px' }} />
                    <button className="btn btn-primary" onClick={() => saveVehicleRate(v.id)} disabled={saving['v' + v.id]} style={{ padding: '6px 10px', fontSize: 12 }}>
                      {saving['v' + v.id] ? '...' : 'Save'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── BILL CONFIG ── */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🧾 Generate Settlement Bill</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>

          {/* Period */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Period</label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {(['weekly', 'monthly', 'custom'] as const).map(t => (
                <button key={t} onClick={() => setPeriodType(t)} style={{ flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: periodType === t ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)', color: periodType === t ? '#000' : 'var(--color-text-muted)' }}>{t}</button>
              ))}
            </div>
            {periodType === 'weekly' && <select className="form-input" style={{ fontSize: 12 }} value={selectedWeek.start} onChange={e => setSelectedWeek(weeks.find(w => w.start === e.target.value) || weeks[0])}>{weeks.map(w => <option key={w.start} value={w.start}>{w.label}</option>)}</select>}
            {periodType === 'monthly' && <select className="form-input" style={{ fontSize: 12 }} value={selectedMonth.start} onChange={e => setSelectedMonth(months.find(m => m.start === e.target.value) || months[0])}>{months.map(m => <option key={m.start} value={m.start}>{m.label}</option>)}</select>}
            {periodType === 'custom' && <div style={{ display: 'flex', gap: 6 }}><input type="date" className="form-input" style={{ fontSize: 12 }} value={customStart} onChange={e => setCustomStart(e.target.value)} /><input type="date" className="form-input" style={{ fontSize: 12 }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></div>}
          </div>

          {/* Vehicle filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Vehicles {selectedVehicles.length > 0 && `(${selectedVehicles.length})`}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 110, overflowY: 'auto' }}>
              <label style={{ fontSize: 11, display: 'flex', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selectedVehicles.length === 0} onChange={() => setSelectedVehicles([])} /><strong>All Vehicles</strong></label>
              {vehicles.map(v => <label key={v.id} style={{ fontSize: 11, display: 'flex', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selectedVehicles.includes(v.id)} onChange={e => setSelectedVehicles(p => e.target.checked ? [...p, v.id] : p.filter(i => i !== v.id))} />{v.plateNo} <span style={{ color: 'var(--color-text-muted)' }}>{v.owner.ownerName}</span></label>)}
            </div>
          </div>

          {/* Deductibles */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Deduct from Settlement</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(EXP_LABELS).map(([type, label]) => (
                <label key={type} style={{ fontSize: 11, display: 'flex', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={deductibles.includes(type)} style={{ accentColor: 'var(--color-accent)' }} onChange={e => setDeductibles(p => e.target.checked ? [...p, type] : p.filter(t => t !== type))} />
                  <span style={{ color: deductibles.includes(type) ? '#ef4444' : 'var(--color-text-secondary)', fontWeight: deductibles.includes(type) ? 700 : 400 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={isPending} style={{ fontSize: 14, padding: '10px 28px', fontWeight: 700 }}>
          {isPending ? '⏳ Generating...' : '🧾 Generate Bill'}
        </button>
      </div>

      {/* ── BILL OUTPUT ── */}
      {bill && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>📋 {bill.period.label}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{bill.period.start} → {bill.period.end} · {bill.vehicles.length} vehicles</div>
            </div>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ fontSize: 12 }}>🖨️ Print / PDF</button>
          </div>

          {/* Grand total */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Trips', val: String(bill.grandTotal.trips), color: '#3b82f6' },
              { label: 'Weight', val: `${bill.grandTotal.weight.toFixed(1)} MT`, color: '#8b5cf6' },
              { label: 'Gross Payout', val: fmt(bill.grandTotal.grossPayout), color: '#f59e0b' },
              { label: 'Deductions', val: fmt(bill.grandTotal.totalDeductions), color: '#ef4444' },
              { label: 'Net Settlement', val: fmt(bill.grandTotal.netSettlement), color: '#10b981' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--color-bg-primary)', border: `1px solid ${k.color}40`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: k.color }}>{k.val}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Per-vehicle */}
          <div ref={printRef}>
            {bill.vehicles.map(v => (
              <div key={v.vehicleId} style={{ border: '1px solid var(--color-border)', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--color-bg-primary)', cursor: 'pointer' }} onClick={() => setExpanded(expanded === v.vehicleId ? null : v.vehicleId)}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>🚛 {v.plateNo}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 8 }}>{v.ownerName}</span>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, background: v.effectiveRateSource === 'vehicle' ? 'rgba(139,92,246,0.12)' : v.effectiveRateSource === 'owner' ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.1)', color: v.effectiveRateSource === 'vehicle' ? '#8b5cf6' : v.effectiveRateSource === 'owner' ? '#f59e0b' : '#64748b' }}>
                      ₹{v.effectiveOwnerRate}/MT ({v.effectiveRateSource})
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{v.totalTrips} trips · {v.totalWeight.toFixed(1)} MT</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', fontSize: 11 }}>
                      <div style={{ color: '#f59e0b' }}>{fmt(v.grossPayout)} gross</div>
                      <div style={{ color: '#ef4444' }}>−{fmt(v.deductions.total)} deduct</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{fmt(v.netSettlement)}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Net Settlement</div>
                    </div>
                    <span style={{ color: 'var(--color-text-muted)' }}>{expanded === v.vehicleId ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === v.vehicleId && (
                  <div>
                    {/* Deduction breakdown */}
                    {v.deductions.total > 0 && (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '8px 16px', background: 'rgba(239,68,68,0.03)', borderBottom: '1px solid var(--color-border)', fontSize: 11 }}>
                        {[['⛽ Fuel', v.deductions.fuel], ['🛣️ Toll', v.deductions.toll], ['🔧 Maint.', v.deductions.maintenance], ['👤 Driver Adv', v.deductions.driverAdvance], ['🏦 Owner Adv', v.deductions.ownerAdvance], ['💵 Other', v.deductions.other]].filter(([, n]) => (n as number) > 0).map(([lbl, n]) => (
                          <span key={String(lbl)} style={{ color: '#ef4444' }}>{lbl}: <strong>{fmt(n as number)}</strong></span>
                        ))}
                      </div>
                    )}

                    {/* Trip table */}
                    <div className="data-table-wrapper" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      <table className="data-table">
                        <thead><tr><th>Date</th><th>Invoice</th><th>LR No</th><th style={{ textAlign: 'right' }}>Wt (MT)</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Payout</th></tr></thead>
                        <tbody>
                          {v.trips.map(t => (
                            <tr key={t.id}>
                              <td style={{ fontSize: 12 }}>{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                              <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.invoiceNo || '—'}</td>
                              <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.lrNo || '—'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.weight.toFixed(2)}</td>
                              <td style={{ textAlign: 'right', color: '#8b5cf6' }}>₹{t.appliedOwnerRate}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{fmt(t.ownerPayout)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ fontWeight: 700, background: 'var(--color-bg-primary)' }}>
                            <td colSpan={3}>Total</td>
                            <td style={{ textAlign: 'right' }}>{v.totalWeight.toFixed(2)} MT</td>
                            <td />
                            <td style={{ textAlign: 'right', color: '#f59e0b' }}>{fmt(v.grossPayout)}</td>
                          </tr>
                          {v.deductions.total > 0 && <tr><td colSpan={5} style={{ color: '#ef4444' }}>Deductions</td><td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>−{fmt(v.deductions.total)}</td></tr>}
                          <tr style={{ background: 'rgba(16,185,129,0.05)' }}>
                            <td colSpan={5} style={{ fontWeight: 800, color: '#10b981' }}>Net Settlement</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: 14 }}>{fmt(v.netSettlement)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {bill.vehicles.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No trips found for this period.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
