'use client'

import { createOwner } from '@/lib/actions/owners'
import { useState } from 'react'

export default function OwnerForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState('')

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let pwd = ''
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    setGeneratedPassword(pwd)
  }

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

      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.12)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            🔑 Portal Login Credentials
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Owner must change password on first login
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Login Email</label>
          <input 
            name="email" 
            type="email" 
            className="form-input" 
            placeholder="e.g. owner@example.com" 
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: '0' }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Default Password
            <button 
              type="button" 
              onClick={generatePassword}
              style={{ 
                fontSize: '11px', 
                color: 'var(--color-accent)', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Generate Random
            </button>
          </label>
          <input 
            name="password" 
            type="text" 
            className="form-input" 
            placeholder="Temporary password" 
            value={generatedPassword}
            onChange={(e) => setGeneratedPassword(e.target.value)}
            required
            minLength={6}
          />
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Share this password with the owner. They'll be asked to change it on first login.
          </p>
        </div>
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '16px 0 0 0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Register Owner'}
        </button>
      </div>
    </form>
  )
}
