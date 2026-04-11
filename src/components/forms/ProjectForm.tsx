'use client'

import { createProject } from '@/lib/actions/projects'
import { useState } from 'react'
import { useLoading } from '@/lib/context/LoadingContext'
import toast from 'react-hot-toast'

export default function ProjectForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setGlobalLoading(true)
    setError(null)
    
    toast.promise(
      createProject(formData),
      {
        loading: 'Creating project...',
        success: () => {
          onSuccess()
          return 'Project created successfully!'
        },
        error: (err) => {
          setError(err.message || 'Something went wrong')
          return err.message || 'Failed to create project'
        }
      }
    ).finally(() => {
      setLoading(false)
      setGlobalLoading(false)
    })
  }

  return (
    <form action={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Project Name</label>
        <input 
          name="projectName" 
          type="text" 
          className="form-input" 
          placeholder="e.g. Manesar Bypass" 
          required 
        />
      </div>
      <div className="form-group">
        <label className="form-label">Location</label>
        <input 
          name="location" 
          type="text" 
          className="form-input" 
          placeholder="e.g. Manesar, Haryana" 
          required 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Project Revenue Rate (₹ / Ton)</label>
        <input 
          name="ownerRate" 
          type="number" 
          step="0.01"
          className="form-input" 
          placeholder="0.00" 
          required 
        />
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Fixed rate received from the Project Company.
        </p>
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '16px 0 0 0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
