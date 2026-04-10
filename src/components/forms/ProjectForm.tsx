'use client'

import { createProject } from '@/lib/actions/projects'
import { useState } from 'react'

export default function ProjectForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await createProject(formData)
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
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '16px 0 0 0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
