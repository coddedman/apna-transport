'use client'

import { updateVehicle } from '@/lib/actions/vehicles'
import { useState } from 'react'
import Modal from './Modal'
import toast from 'react-hot-toast'

interface EditVehicleButtonProps {
  vehicle: { id: string; plateNo: string; ownerId: string; projectId: string | null }
  owners: { id: string; ownerName: string }[]
  projects: { id: string; projectName: string }[]
}

export default function EditVehicleButton({ vehicle, owners, projects }: EditVehicleButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    toast.promise(
      updateVehicle(vehicle.id, formData),
      {
        loading: 'Updating vehicle...',
        success: () => {
          setIsOpen(false)
          return 'Vehicle updated!'
        },
        error: (err) => err.message || 'Failed to update',
      }
    ).finally(() => setLoading(false))
  }

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setIsOpen(true)}
        style={{ fontSize: '12px', padding: '4px 8px' }}
        title={`Edit ${vehicle.plateNo}`}
      >
        ✏️
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Edit ${vehicle.plateNo}`}>
        <form action={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Plate Number</label>
            <input className="form-input" value={vehicle.plateNo} disabled style={{ opacity: 0.6 }} />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Plate number cannot be changed.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Owner</label>
            <select name="ownerId" className="form-select" defaultValue={vehicle.ownerId}>
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.ownerName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Project</label>
            <select name="projectId" className="form-select" defaultValue={vehicle.projectId || ''}>
              <option value="">No project assigned</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
