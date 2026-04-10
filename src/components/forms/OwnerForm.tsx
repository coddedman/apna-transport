'use client'

import { createOwner } from '@/lib/actions/owners'
import { useState } from 'react'

export default function OwnerForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await createOwner(formData)
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
        <label className="form-label">Owner Name</label>
        <input 
          name="ownerName" 
          type="text" 
          className="form-input" 
          placeholder="e.g. Ramesh Kumar" 
          required 
        />
      </div>
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input 
          name="phone" 
          type="tel" 
          className="form-input" 
          placeholder="e.g. +91 98765 43210" 
          required 
        />
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '16px 0 0 0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Owner'}
        </button>
      </div>
    </form>
  )
}
