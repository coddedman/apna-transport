'use client'

import { updateOwner } from '@/lib/actions/owners'
import { useState } from 'react'

import toast from 'react-hot-toast'

interface EditOwnerFormProps {
  owner: {
    id: string
    ownerName: string
    phone: string
    defaultPassword: string | null
    mustChangePassword: boolean | null
    user: { email: string } | null
  }
  onSuccess: () => void
}

export default function EditOwnerForm({ owner, onSuccess }: EditOwnerFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    toast.promise(
      updateOwner(formData),
      {
        loading: 'Saving changes...',
        success: () => {
          onSuccess()
          return 'Owner updated successfully!'
        },
        error: (err) => {
          setError(err.message || 'Something went wrong')
          return err.message || 'Failed to update owner'
        }
      }
    ).finally(() => setLoading(false))
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="ownerId" value={owner.id} />

      <div className="form-group">
        <label className="form-label">Owner Name</label>
        <input 
          name="ownerName" 
          type="text" 
          className="form-input" 
          defaultValue={owner.ownerName}
          required 
        />
      </div>
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input 
          name="phone" 
          type="tel" 
          className="form-input" 
          defaultValue={owner.phone}
          required 
        />
      </div>

      {/* Credential Section */}
      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.12)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            🔑 Login Credentials
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Login Email</label>
          <input 
            name="email" 
            type="email" 
            className="form-input" 
            defaultValue={owner.user?.email || ''}
            placeholder={owner.user ? '' : 'No login set — enter email to create one'}
          />
        </div>

        {/* Show current default password status */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Default Password:</span>
          {owner.defaultPassword ? (
            <code style={{ 
              fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', 
              background: 'rgba(245,158,11,0.08)', padding: '2px 8px', 
              borderRadius: '4px', letterSpacing: '1px',
            }}>
              {owner.defaultPassword}
            </code>
          ) : owner.user && owner.mustChangePassword === false ? (
            <span style={{ 
              fontSize: '12px', fontWeight: 600, color: 'var(--color-success)', fontStyle: 'italic' 
            }}>
              Owner has set their own password ✓
            </span>
          ) : owner.user && owner.mustChangePassword === true ? (
            <span style={{ 
              fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', fontStyle: 'italic' 
            }}>
              Not yet changed
            </span>
          ) : (
            <span style={{ 
              fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', fontStyle: 'italic' 
            }}>
              No login credentials
            </span>
          )}
        </div>

        {!showReset ? (
          <button 
            type="button" 
            onClick={() => setShowReset(true)}
            style={{
              fontSize: '12px', color: 'var(--color-danger)', background: 'none',
              border: '1px solid rgba(239,68,68,0.2)', padding: '6px 14px',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Reset Password
          </button>
        ) : (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password</label>
            <input 
              name="resetPassword" 
              type="text" 
              className="form-input" 
              placeholder="Enter new default password"
              minLength={6}
              required={!owner.user}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Owner will be asked to change this on their next login.
            </p>
          </div>
        )}
      </div>
      
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '16px' }}>{error}</p>}
      
      <div className="modal-footer" style={{ padding: '16px 0 0 0', border: 'none' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
