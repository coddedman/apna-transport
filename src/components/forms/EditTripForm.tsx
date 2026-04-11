'use client'

import { updateTrip } from '@/lib/actions/trips'
import { useState } from 'react'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

interface EditTripFormProps {
  trip: any
  vehicles: { id: string, plateNo: string }[]
  projects: { id: string, projectName: string }[]
  onSuccess: () => void
}

export default function EditTripForm({ trip, vehicles, projects, onSuccess }: EditTripFormProps) {
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [weight, setWeight] = useState(trip.weight.toString())

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setGlobalLoading(true)
    setError(null)
    
    toast.promise(
      updateTrip(trip.id, formData),
      {
        loading: 'Updating trip...',
        success: () => {
          onSuccess()
          return 'Trip updated successfully!'
        },
        error: (err) => {
          setError(err.message || 'Something went wrong')
          return err.message || 'Failed to update trip'
        }
      }
    ).finally(() => {
      setLoading(false)
      setGlobalLoading(false)
    })
  }

  // Parse existing date to YYYY-MM-DD
  const tripDateObj = new Date(trip.rawDate || trip.date)
  const dateString = tripDateObj.toISOString().split('T')[0]
  const timeString = tripDateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

  return (
    <form action={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Trip Date</label>
          <input 
            name="date" 
            type="date" 
            className="form-input" 
            defaultValue={dateString}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Trip Time</label>
          <input 
            name="time" 
            type="time" 
            className="form-input" 
            defaultValue={timeString}
            required 
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Vehicle</label>
          <select name="vehicleId" className="form-select" required defaultValue={trip.vehicleId}>
            <option value="" disabled>Select vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plateNo}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Project Site</label>
          <select name="projectId" className="form-select" required defaultValue={trip.projectId}>
            <option value="" disabled>Select project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Weight (Metric Tons)</label>
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
        <div className="form-group">
          <label className="form-label">Owner Payout Rate (₹ / Ton)</label>
          <input 
            name="partyRate" 
            type="number" 
            step="0.01"
            className="form-input" 
            placeholder="0.00" 
            defaultValue={trip.partyRate}
            required 
          />
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Revenue rate is fixed per Project.
          </p>
        </div>
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || vehicles.length === 0 || projects.length === 0}>
          {loading ? 'Updating...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
