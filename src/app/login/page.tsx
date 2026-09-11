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
    <div className="login-page v2-login">
      {/* Background effects */}
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className="v2-login-card">
      <section className="v2-login-showcase">
        <div className="v2-login-brand">Apna Transport <span>अपना ट्रांसपोर्ट · Operations OS</span></div>
        <div><div className="v2-eyebrow">Built for transport operators</div>
        <h2>Run every trip, vehicle and payment from one place.</h2>
        <p>A focused command center for fleet activity, owner settlements, client billing and project profitability.</p></div>
        <div className="v2-login-features"><span>Fleet & contracts</span><span>Trips & expenses</span><span>Billing & collections</span><span>Owner settlements</span></div>
        <p className="v2-login-note">One workspace. Your entire operation.</p>
      </section>
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">AT</div>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to your Apna Transport workspace</p>

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
              placeholder="name@company.com"
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
      </div>
      </div>
    </div>
  )
}
