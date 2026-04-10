'use client'

import { useState } from 'react'
import { registerTransporter } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    try {
      await registerTransporter(formData)
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className="login-container" style={{ maxWidth: '440px' }}>
        <div className="login-logo">
          <div className="login-logo-icon">HT</div>
        </div>

        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">Register your transport company</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error"><span>⚠️</span> {error}</div>}

          <div className="form-group">
            <label className="form-label">Transport Company Name</label>
            <input name="name" type="text" className="form-input" placeholder="e.g. Skyline Logistics" required />
          </div>

          <div className="form-group">
            <label className="form-label">GST / Registration No.</label>
            <input name="registration" type="text" className="form-input" placeholder="GSTIN-12345..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input name="email" type="email" className="form-input" placeholder="admin@skyline.com" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-input" placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Finalize Registration →'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link href="/login" style={{ color: 'var(--color-accent)' }}>Sign In</Link></p>
        </div>
      </div>
    </div>
  )
}
