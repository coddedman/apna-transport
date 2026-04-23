'use client'

import { createTrip } from '@/lib/actions/trips'
import { useState } from 'react'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

interface TripFormProps {
  vehicles: { id: string, plateNo: string }[]
  projects: { id: string, projectName: string }[]
  onSuccess: () => void
}

export default function TripForm({ vehicles, projects, onSuccess }: TripFormProps) {
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [weight, setWeight] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setGlobalLoading(true)
    setError(null)
    
    toast.promise(
      createTrip(formData),
      {
        loading: 'Logging trip...',
        success: () => {
          onSuccess()
          return 'Trip logged successfully!'
        },
        error: (err) => {
          setError(err.message || 'Something went wrong')
          return err.message || 'Failed to log trip'
        }
      }
    ).finally(() => {
      setLoading(false)
      setGlobalLoading(false)
    })
  }



  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Trip Date</label>
          <input 
            name="date" 
            type="date" 
            className="form-input" 
            defaultValue={today}
            max={today}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Trip Time</label>
          <input 
            name="time" 
            type="time" 
            className="form-input" 
            defaultValue={new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            required 
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">INVOICE NO. (Trip ID)</label>
          <input 
            name="invoiceNo" 
            type="text" 
            className="form-input" 
            placeholder="e.g. 0241117"
          />
        </div>
        <div className="form-group">
          <label className="form-label">LR NO. (Yellow Sl No)</label>
          <input 
            name="lrNo" 
            type="text" 
            className="form-input" 
            placeholder="e.g. 82351"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">VEHICLE NO.</label>
          <select name="vehicleId" className="form-select" required defaultValue="">
            <option value="" disabled>Select vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plateNo}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Project Site</label>
          <select name="projectId" className="form-select" required defaultValue="">
            <option value="" disabled>Select project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">NET WT (MT)</label>
          <input 
            name="weight" 
            type="number" 
            step="0.01"
            className="form-input" 
            placeholder="0.00" 
            required 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="form-group"></div>
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || vehicles.length === 0 || projects.length === 0}>
          {loading ? 'Logging...' : 'Log Trip Record'}
        </button>
      </div>
    </form>
  )
}
