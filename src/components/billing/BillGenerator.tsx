'use client'

import { useState, useTransition } from 'react'
import { generateBill, setVehicleRateOverride, setOwnerRateOverride, BillSummary } from '@/lib/actions/billing'
import toast from 'react-hot-toast'
import BillOutput from './BillOutput'

interface Owner { id: string; ownerName: string; ownerRateOverride: number | null; vehicles: { id: string; plateNo: string; ownerRateOverride: number | null; project: { ownerRate: number } | null }[] }
interface Vehicle { id: string; plateNo: string; ownerRateOverride: number | null; owner: { id: string; ownerName: string; ownerRateOverride: number | null }; project: { ownerRate: number; partyRate: number } | null }

interface Props { vehicles: Vehicle[]; owners: Owner[]; projectDefaultOwnerRate: number }

const DEDUCT_OPTS = [
  { key: 'FUEL', label: '⛽ Fuel' }, { key: 'TOLL', label: '🛣️ Toll' },
  { key: 'MAINTENANCE', label: '🔧 Maintenance' }, { key: 'DRIVER_ADVANCE', label: '👤 Driver Advance' },
  { key: 'CASH_PAYMENT', label: '💵 Cash Payment' }, { key: 'OWNER_ADVANCE', label: '🏦 Owner Advance', hint: 'via Owners page' },
]

function getWeeks() {
  return Array.from({ length: 8 }, (_, i) => {
    const end = new Date(); end.setDate(end.getDate() - i * 7)
    const start = new Date(end); start.setDate(end.getDate() - 6)
    return { label: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  })
}

function getMonths() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return { label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), start: d.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  })
}

const card: React.CSSProperties = { background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28, marginBottom: 28 }
const sectionTitle = (emoji: string, text: string) => (
  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ background: 'rgba(245,158,11,0.1)', padding: '5px 8px', borderRadius: 8 }}>{emoji}</span>{text}
  </div>
)

export default function BillGenerator({ vehicles, owners, projectDefaultOwnerRate }: Props) {
  const [isPending, startTransition] = useTransition()
  const weeks = getWeeks(); const months = getMonths()

  const [ownerRates, setOwnerRates] = useState<Record<string, string>>(Object.fromEntries(owners.map(o => [o.id, String(o.ownerRateOverride ?? '')])))
  const [vehicleRates, setVehicleRates] = useState<Record<string, string>>(Object.fromEntries(vehicles.map(v => [v.id, String(v.ownerRateOverride ?? '')])))
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'custom' | 'till_date'>('weekly')
  const [selectedWeek, setSelectedWeek] = useState(weeks[0])
  const [selectedMonth, setSelectedMonth] = useState(months[0])
  const [customStart, setCustomStart] = useState('')
  const [tillDate, setTillDate] = useState(new Date().toISOString().split('T')[0])
  const [customEnd, setCustomEnd] = useState('')
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [deductibles, setDeductibles] = useState<string[]>(['TOLL', 'OWNER_ADVANCE'])
  const [bill, setBill] = useState<BillSummary | null>(null)

  async function saveOwnerRate(id: string) {
    setSaving(p => ({ ...p, [id]: true }))
    try { await setOwnerRateOverride(id, ownerRates[id] === '' ? null : parseFloat(ownerRates[id])); toast.success('Saved') }
    catch (e: any) { toast.error(e.message) } finally { setSaving(p => ({ ...p, [id]: false })) }
  }

  async function saveVehicleRate(id: string) {
    setSaving(p => ({ ...p, ['v' + id]: true }))
    try { await setVehicleRateOverride(id, vehicleRates[id] === '' ? null : parseFloat(vehicleRates[id])); toast.success('Saved') }
    catch (e: any) { toast.error(e.message) } finally { setSaving(p => ({ ...p, ['v' + id]: false })) }
  }

  function handleGenerate() {
    let start = '', end = ''
    if (periodType === 'weekly') { start = selectedWeek.start; end = selectedWeek.end }
    else if (periodType === 'monthly') { start = selectedMonth.start; end = selectedMonth.end }
    else if (periodType === 'custom') { start = customStart; end = customEnd }
    else if (periodType === 'till_date') { start = ''; end = tillDate }

    if (periodType !== 'till_date' && (!start || !end)) return toast.error('Select a period')
    if (periodType === 'till_date' && !end) return toast.error('Select a date')

    startTransition(async () => {
      try {
        const result = await generateBill(
          { type: periodType, startDate: start, endDate: end },
          selectedVehicles.length ? selectedVehicles : undefined,
          deductibles
        )
        setBill(result)
        toast.success(`Bill generated — ${result.vehicles.length} vehicles`)
      } catch (e: any) { toast.error(e.message) }
    })
  }

  return (
    <div>
      {/* ── RATE CONFIG ── */}
      <div style={card}>
        {sectionTitle('⚙️', 'Rate Configuration')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>Owner-level Rate Override</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {owners.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0b1120', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{o.ownerName}</div><div style={{ fontSize: 11, color: '#64748b' }}>{o.vehicles.length} vehicle(s)</div></div>
                  <input type="number" className="form-input" placeholder={`₹${projectDefaultOwnerRate}`} value={ownerRates[o.id] ?? ''} min={0} onChange={e => setOwnerRates(p => ({ ...p, [o.id]: e.target.value }))} style={{ width: 90, fontSize: 13, padding: '8px 10px', textAlign: 'right' }} />
                  <button className="btn btn-primary btn-sm" onClick={() => saveOwnerRate(o.id)} disabled={saving[o.id]}>{saving[o.id] ? '...' : 'Save'}</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>Vehicle-level Override <span style={{ color: '#8b5cf6', fontSize: 11 }}>(highest priority)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {vehicles.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0b1120', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{v.plateNo}</div><div style={{ fontSize: 11, color: '#64748b' }}>{v.owner.ownerName}</div></div>
                  <input type="number" className="form-input" placeholder="Override" value={vehicleRates[v.id] ?? ''} min={0} onChange={e => setVehicleRates(p => ({ ...p, [v.id]: e.target.value }))} style={{ width: 80, fontSize: 13, padding: '8px 10px', textAlign: 'right' }} />
                  <button className="btn btn-primary btn-sm" onClick={() => saveVehicleRate(v.id)} disabled={saving['v' + v.id]}>{saving['v' + v.id] ? '...' : 'Save'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BILL PARAMS ── */}
      <div style={card}>
        {sectionTitle('📊', 'Bill Parameters')}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 28, marginBottom: 24 }}>
          {/* Period */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>1. Period</div>
            <div style={{ display: 'flex', gap: 4, background: '#0b1120', padding: 5, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
              {(['weekly', 'monthly', 'custom', 'till_date'] as const).map(t => (
                <button key={t} onClick={() => setPeriodType(t)} style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: periodType === t ? '#f59e0b' : 'transparent', color: periodType === t ? '#000' : '#94a3b8', transition: 'all 0.2s' }}>
                  {t === 'till_date' ? 'Till Date' : t}
                </button>
              ))}
            </div>
            {periodType === 'weekly' && <select className="form-select" value={selectedWeek.start} onChange={e => setSelectedWeek(weeks.find(w => w.start === e.target.value) || weeks[0])}>{weeks.map(w => <option key={w.start} value={w.start}>{w.label}</option>)}</select>}
            {periodType === 'monthly' && <select className="form-select" value={selectedMonth.start} onChange={e => setSelectedMonth(months.find(m => m.start === e.target.value) || months[0])}>{months.map(m => <option key={m.start} value={m.start}>{m.label}</option>)}</select>}
            {periodType === 'custom' && <div style={{ display: 'flex', gap: 8 }}><input type="date" className="form-input" style={{ flex: 1 }} value={customStart} onChange={e => setCustomStart(e.target.value)} /><input type="date" className="form-input" style={{ flex: 1 }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></div>}
            {periodType === 'till_date' && (
              <div>
                <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 6 }}>All records from start up to selected date</div>
                <input type="date" className="form-input" value={tillDate} onChange={e => setTillDate(e.target.value)} />
              </div>
            )}
          </div>

          {/* Vehicles */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>2. Vehicles {selectedVehicles.length > 0 && <span style={{ color: '#f59e0b' }}>({selectedVehicles.length})</span>}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', background: '#0b1120', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <input type="checkbox" checked={selectedVehicles.length === 0} onChange={() => setSelectedVehicles([])} style={{ accentColor: '#f59e0b' }} /><strong>All Vehicles</strong>
              </label>
              {vehicles.map(v => (
                <label key={v.id} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedVehicles.includes(v.id)} onChange={e => setSelectedVehicles(p => e.target.checked ? [...p, v.id] : p.filter(i => i !== v.id))} style={{ accentColor: '#f59e0b' }} />
                  {v.plateNo} <span style={{ color: '#64748b', fontSize: 11 }}>{v.owner.ownerName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Deductibles */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>3. Deduct from Settlement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#0b1120', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              {DEDUCT_OPTS.map(({ key, label, hint }) => (
                <label key={key} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 8px', borderRadius: 6, background: deductibles.includes(key) ? 'rgba(239,68,68,0.08)' : 'transparent', border: `1px solid ${deductibles.includes(key) ? 'rgba(239,68,68,0.2)' : 'transparent'}` }}>
                  <input type="checkbox" checked={deductibles.includes(key)} onChange={e => setDeductibles(p => e.target.checked ? [...p, key] : p.filter(t => t !== key))} style={{ accentColor: '#ef4444' }} />
                  <span style={{ color: deductibles.includes(key) ? '#ef4444' : '#94a3b8', fontWeight: deductibles.includes(key) ? 700 : 400 }}>{label}</span>
                  {hint && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', fontWeight: 600 }}>{hint}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isPending} style={{ fontSize: 15, padding: '14px 40px', fontWeight: 800, borderRadius: 30 }}>
            {isPending ? '⏳ Generating...' : '🧾 Generate Settlement Bill'}
          </button>
        </div>
      </div>

      {/* ── OUTPUT ── */}
      {bill && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Settlement Invoice</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{bill.period.label}</div>
            </div>
          </div>
          <BillOutput bill={bill} />
        </div>
      )}
    </div>
  )
}
