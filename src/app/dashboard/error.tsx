'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="page-body">
      <div className="card" style={{ textAlign: 'center', padding: '60px 30px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ padding: '10px 24px' }}
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  )
}
