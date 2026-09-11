'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Designation, CostBucket } from '@prisma/client'
import Modal from '@/components/Modal'
import toast from 'react-hot-toast'
import { createEmployee } from '@/lib/actions/employees'

const DESIGNATIONS: { value: Designation; label: string; bucket: CostBucket }[] = [
  { value: 'DRIVER', label: 'Driver', bucket: 'VEHICLE' },
  { value: 'MECHANIC', label: 'Mechanic', bucket: 'VEHICLE' },
  { value: 'FIELD_MANAGER', label: 'Field Manager', bucket: 'PROJECT' },
  { value: 'WEIGHBRIDGE_OPERATOR', label: 'Weighbridge Op.', bucket: 'PROJECT' },
  { value: 'ACCOUNTANT', label: 'Accountant', bucket: 'OVERHEAD' },
  { value: 'DISPATCHER', label: 'Dispatcher', bucket: 'OVERHEAD' },
  { value: 'HR_ADMIN', label: 'HR / Admin', bucket: 'OVERHEAD' },
  { value: 'OTHER', label: 'Other', bucket: 'OVERHEAD' },
]

const BUCKETS: { value: CostBucket; label: string }[] = [
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'OVERHEAD', label: 'Overhead' },
]

export default function AddEmployeeButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [designation, setDesignation] = useState<Designation>('DRIVER')
  const [assignedTo, setAssignedTo] = useState('')
  // Defaults to the bucket implied by the designation, but stays overridable.
  const [costBucket, setCostBucket] = useState<CostBucket>('VEHICLE')
  const [salary, setSalary] = useState('')

  function reset() {
    setName(''); setPhone(''); setDesignation('DRIVER')
    setAssignedTo(''); setCostBucket('VEHICLE'); setSalary(''); setError(null)
  }

  function pickDesignation(d: Designation) {
    setDesignation(d)
    const match = DESIGNATIONS.find(x => x.value === d)
    if (match) setCostBucket(match.bucket)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createEmployee({
        name,
        phone: phone || undefined,
        designation,
        assignedTo: assignedTo || undefined,
        costBucket,
        salary: parseFloat(salary) || 0,
      })
      toast.success('Employee added')
      reset()
      setIsOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add employee'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
        Add Employee
      </button>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); reset() }} title="Add Employee">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sunil Yadav"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Designation</label>
              <select className="form-select" value={designation} onChange={e => pickDesignation(e.target.value as Designation)}>
                {DESIGNATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cost Bucket</label>
              <select className="form-select" value={costBucket} onChange={e => setCostBucket(e.target.value as CostBucket)}>
                {BUCKETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Assigned To <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>— optional</span>
              </label>
              <input
                className="form-input"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                placeholder="Vehicle no., site or Head office"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Salary / month (₹)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="100"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                placeholder="18000"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>— optional</span>
            </label>
            <input
              className="form-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98350 12345"
            />
          </div>

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 16 }}>{error}</p>
          )}

          <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !name || !salary}>
              {loading ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
