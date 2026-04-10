'use client'

import { useState } from 'react'
import { onboardTransporter } from '@/lib/actions/platform'
import { useRouter } from 'next/navigation'

export default function OnboardTransporterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ name: string; email: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await onboardTransporter(formData)
      setSuccess({ name: result.transporterName, email: result.adminEmail })
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message || 'Failed to onboard transporter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Onboard New Transporter</h1>
            <p className="page-subtitle">Register a new transport company on the platform</p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <div style={{ maxWidth: '640px' }}>
          {/* Success Banner */}
          {success && (
            <div className="card" style={{
              marginBottom: '20px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              background: 'rgba(34, 197, 94, 0.08)',
            }}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🎉</span>
                  <strong style={{ color: 'var(--color-success)', fontSize: '15px' }}>
                    Transporter Onboarded Successfully!
                  </strong>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  <strong>{success.name}</strong> has been registered. Their admin can log in with <strong>{success.email}</strong> and the password you set.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setSuccess(null) }}
                  >
                    Onboard Another
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => router.push('/platform')}
                  >
                    Back to Overview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Company Details</span>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {error && (
                    <div className="login-error" style={{ margin: 0 }}>
                      <span>⚠️</span> {error}
                    </div>
                  )}

                  {/* Company Info */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '14px',
                    }}>
                      Company Information
                    </div>
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label className="form-label">Transport Company Name *</label>
                      <input
                        name="name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Skyline Transport Pvt. Ltd."
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">GST / Registration No.</label>
                      <input
                        name="registration"
                        type="text"
                        className="form-input"
                        placeholder="e.g. 29ABCDE1234F1ZK"
                      />
                    </div>
                  </div>

                  {/* Admin Credentials */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '14px',
                    }}>
                      Admin Account
                    </div>
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label className="form-label">Admin Email *</label>
                      <input
                        name="adminEmail"
                        type="email"
                        className="form-input"
                        placeholder="admin@skyline-transport.com"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Admin Password *</label>
                      <input
                        name="adminPassword"
                        type="password"
                        className="form-input"
                        placeholder="Minimum 8 characters"
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      justifyContent: 'center',
                      padding: '14px',
                    }}
                  >
                    {loading ? 'Creating...' : '🏢  Register Transporter'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
