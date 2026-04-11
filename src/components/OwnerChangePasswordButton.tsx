'use client'

import { useState } from 'react'
import Modal from './Modal'
import { changePassword } from '@/lib/actions/auth'

export default function OwnerChangePasswordButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await changePassword(formData)
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-secondary btn-sm" onClick={() => setIsOpen(true)}>
        🔑 Change Password
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setSuccess(false); setError(null) }}
        title="Change Your Password"
      >
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <p style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '16px' }}>
              Password updated successfully!
            </p>
          </div>
        ) : (
          <form action={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                name="newPassword"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter your new password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
            )}

            <div className="modal-footer" style={{ padding: '16px 0 0 0', border: 'none' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
