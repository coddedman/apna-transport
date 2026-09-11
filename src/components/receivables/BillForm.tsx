'use client'

import { useState, useTransition } from 'react'
import Modal from '@/components/Modal'
import { createPartyBill, calculateBillFromTrips } from '@/lib/actions/receivables'
import { summarizeTrips } from '@/lib/finance/tripBilling'
import { money } from '@/lib/finance/receivables'
import toast from 'react-hot-toast'

interface Project { id: string; projectName: string; partyRate: number }
type Trip = Awaited<ReturnType<typeof calculateBillFromTrips>>['trips'][number]
interface Props {
  projects: Project[]
  initial?: { projectId: string; periodStart: string; periodEnd: string }
  label?: string
}
const fmt = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function BillForm({ projects, initial, label = '+ Record Bill' }: Props) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [billNo, setBillNo] = useState('')
  const [billType, setBillType] = useState<'FREIGHT' | 'TOLL'>('FREIGHT')
  const [projectId, setProjectId] = useState(initial?.projectId || '')
  const [start, setStart] = useState(initial?.periodStart || '')
  const [end, setEnd] = useState(initial?.periodEnd || '')
  const [trips, setTrips] = useState<Trip[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [incentive, setIncentive] = useState('')
  const [amount, setAmount] = useState('')
  const [due, setDue] = useState('')
  const [submitted, setSubmitted] = useState(new Date().toISOString().slice(0, 10))
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const totals = summarizeTrips(trips.filter(trip => selected.includes(trip.id)))
  const total = billType === 'FREIGHT' ? money(totals.billAmount + totals.totalWeight * (Number(incentive) || 0)) : Number(amount) || 0
  function invalidate() { setTrips([]); setSelected([]); setLoaded(false); setError('') }
  function reset() {
    setBillNo(''); setBillType('FREIGHT'); setProjectId(initial?.projectId || ''); setStart(initial?.periodStart || ''); setEnd(initial?.periodEnd || '')
    invalidate(); setIncentive(''); setAmount(''); setDue(''); setRemarks(''); setSubmitted(new Date().toISOString().slice(0, 10))
  }
  function load() {
    setError('')
    startTransition(async () => {
      try {
        const result = await calculateBillFromTrips(projectId, start, end)
        setTrips(result.trips); setSelected(result.trips.map(trip => trip.id)); setLoaded(true)
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not load trips') }
    })
  }
  function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    startTransition(async () => {
      try {
        await createPartyBill({ billNo: billNo.trim(), billType, projectId, periodStart: start, periodEnd: end,
          tripIds: billType === 'FREIGHT' ? selected : [],
          ...(billType === 'FREIGHT' ? totals : { billAmount: Number(amount), totalTrips: 0, totalWeight: 0 }),
          incentive: billType === 'FREIGHT' ? Number(incentive) || 0 : 0,
          submittedAt: submitted || undefined, dueDate: due || undefined, remarks: remarks || undefined })
        toast.success('Invoice saved'); reset(); setOpen(false)
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not save invoice') }
    })
  }
  return <>
    <button className="btn btn-primary" onClick={() => { reset(); setOpen(true) }}>{label}</button>
    <Modal isOpen={open} onClose={() => { if (!pending) setOpen(false) }} title="Create Client Invoice" maxWidth="860px">
      <form onSubmit={submit}>
        {error && <p role="alert" style={{ padding: 12, marginBottom: 16, background: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 8 }}>{error}</p>}
        <fieldset disabled={pending} style={{ border: 0, padding: 0, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
            <label className="form-group"><span className="form-label">Invoice number *</span><input className="form-input" value={billNo} onChange={e => setBillNo(e.target.value)} required /></label>
            <label className="form-group"><span className="form-label">Type</span><select className="form-select" value={billType} onChange={e => { setBillType(e.target.value as 'FREIGHT' | 'TOLL'); invalidate() }}><option value="FREIGHT">Freight · linked trips</option><option value="TOLL">Toll</option></select></label>
            <label className="form-group"><span className="form-label">Project *</span><select className="form-select" value={projectId} onChange={e => { setProjectId(e.target.value); invalidate() }} required><option value="">Select project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.projectName}</option>)}</select></label>
            <label className="form-group"><span className="form-label">Period start *</span><input type="date" className="form-input" value={start} onChange={e => { setStart(e.target.value); invalidate() }} required /></label>
            <label className="form-group"><span className="form-label">Period end *</span><input type="date" className="form-input" value={end} min={start} onChange={e => { setEnd(e.target.value); invalidate() }} required /></label>
          </div>
          {billType === 'FREIGHT' ? <section style={{ margin: '16px 0' }}>
            <button type="button" className="btn btn-secondary" onClick={load} disabled={!projectId || !start || !end || start > end}>{pending ? 'Loading…' : 'Load unbilled trips'}</button>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: '10px 0' }}>Choose trips to include. Rates and freight totals come from the trip records. Trips covered by historical unlinked invoices are held for review.</p>
            {loaded && !trips.length && <p role="status">No eligible unbilled trips in this period.</p>}
            {trips.length > 0 && <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr><th style={{ padding: 10 }}><input type="checkbox" aria-label="Select all trips" checked={selected.length === trips.length} onChange={e => setSelected(e.target.checked ? trips.map(trip => trip.id) : [])} /></th><th>Date</th><th>Vehicle / LR</th><th>Weight (MT)</th><th>Freight</th></tr></thead>
                <tbody>{trips.map(trip => <tr key={trip.id} style={{ borderTop: '1px solid var(--color-border)' }}><td style={{ padding: 10 }}><input type="checkbox" aria-label={`Select ${trip.vehicle.plateNo} ${trip.lrNo || trip.id}`} checked={selected.includes(trip.id)} onChange={e => setSelected(e.target.checked ? [...selected, trip.id] : selected.filter(id => id !== trip.id))} /></td><td>{new Date(trip.date).toLocaleDateString('en-IN')}</td><td>{trip.vehicle.plateNo}<br />{trip.lrNo || trip.invoiceNo || '—'}</td><td>{trip.weight}</td><td>{fmt(trip.partyFreightAmount)}</td></tr>)}</tbody>
              </table>
            </div>}
            <p style={{ marginTop: 12, fontWeight: 600 }}>{totals.totalTrips} trips · {totals.totalWeight} MT · Freight {fmt(totals.billAmount)}</p>
            <label className="form-group" style={{ marginTop: 14 }}><span className="form-label">Incentive (₹/MT)</span><input type="number" min="0" step="0.01" className="form-input" value={incentive} onChange={e => setIncentive(e.target.value)} /></label>
          </section> : <label className="form-group"><span className="form-label">Toll amount *</span><input type="number" className="form-input" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></label>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
            <label className="form-group"><span className="form-label">Submitted on</span><input type="date" className="form-input" value={submitted} onChange={e => setSubmitted(e.target.value)} /></label>
            <label className="form-group"><span className="form-label">Due date</span><input type="date" className="form-input" value={due} onChange={e => setDue(e.target.value)} /></label>
          </div>
          <label className="form-group"><span className="form-label">Remarks</span><input className="form-input" value={remarks} onChange={e => setRemarks(e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}><strong>Total: {fmt(total)}</strong><button className="btn btn-primary" type="submit" disabled={pending || (billType === 'FREIGHT' && !selected.length)}>{pending ? 'Please wait…' : 'Save invoice'}</button></div>
        </fieldset>
      </form>
    </Modal>
  </>
}
