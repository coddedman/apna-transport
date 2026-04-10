'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      // Fetch session to check the user's role for correct redirect
      const session = await getSession()
      const role = (session?.user as any)?.role
      if (role === 'SUPER_ADMIN') {
        router.push('/platform')
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="login-page">
      {/* Background effects */}
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">HT</div>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to Hyva Transport Management</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@hyvatransport.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : null}
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="login-footer">
          <p style={{ marginBottom: '4px' }}>Super Admin: <strong>super@hyvatransport.com</strong> / <strong>SuperAdmin@123</strong></p>
          <p>Transporter: <strong>admin@hyvatransport.com</strong> / <strong>Admin@123</strong></p>
        </div>
      </div>
    </div>
  )
}
