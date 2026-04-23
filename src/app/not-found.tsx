import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg-body)',
      color: 'var(--color-text-primary)',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔍</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Page Not Found</h1>
      <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '32px', maxWidth: '400px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="btn btn-primary"
        style={{ padding: '12px 28px', textDecoration: 'none' }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  )
}
