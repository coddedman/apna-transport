'use client'

import { createVehicle } from '@/lib/actions/vehicles'
import { useState } from 'react'

interface VehicleFormProps {
  owners: { id: string, ownerName: string }[]
  projects: { id: string, projectName: string }[]
  onSuccess: () => void
}

export default function VehicleForm({ owners, projects, onSuccess }: VehicleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await createVehicle(formData)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Vehicle Plate Number</label>
        <input 
          name="plateNo" 
          type="text" 
          className="form-input" 
          placeholder="e.g. HR-55-AB-1234" 
          required 
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Assign Owner</label>
          <select name="ownerId" className="form-select" required defaultValue="">
            <option value="" disabled>Select an owner</option>
            {owners.map(o => (
              <option key={o.id} value={o.id}>{o.ownerName}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Active Project (Optional)</label>
          <select name="projectId" className="form-select" defaultValue="">
            <option value="">No Project assigned</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>
      </div>
      
      {owners.length === 0 && (
        <p style={{ fontSize: '11px', color: 'var(--color-accent)', marginBottom: '16px' }}>
          ⚠️ No owners found. Please add an owner first.
        </p>
      )}
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || owners.length === 0}>
          {loading ? 'Registering...' : 'Register Vehicle'}
        </button>
      </div>
    </form>
  )
}
