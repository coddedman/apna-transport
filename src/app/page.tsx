import Link from 'next/link'

export const metadata = {
  title: 'Hyva Transport — Fleet Management Platform',
  description: 'Multi-tenant fleet management platform for transport companies. Manage vehicles, log trips, track expenses, and settle owners.',
}

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '-200px',
        right: '-200px',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-accent-subtle) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-300px',
        left: '-100px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '18px',
        background: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        fontWeight: 900,
        color: '#fff',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-md)',
      }}>
        HT
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '42px',
        fontWeight: 900,
        color: 'var(--color-text-primary)',
        letterSpacing: '-0.04em',
        textAlign: 'center',
        marginBottom: '12px',
        lineHeight: 1.1,
      }}>
        Hyva Transport
      </h1>

      <p style={{
        fontSize: '18px',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
        maxWidth: '520px',
        lineHeight: 1.6,
        marginBottom: '40px',
      }}>
        Multi-tenant fleet management platform for transport companies.
        Manage vehicles, log trips, track expenses, and settle owners — all in one place.
      </p>

      {/* Feature pills */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: '44px',
      }}>
        {['🚛 Fleet Tracking', '⚖️ Weight-Based Billing', '💰 Auto Settlements', '📊 Analytics'].map((f) => (
          <span key={f} style={{
            padding: '8px 16px',
            borderRadius: '100px',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 32px',
          borderRadius: '12px',
          background: 'var(--color-accent)',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        Get Started →
      </Link>

      <p style={{
        marginTop: '20px',
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
      }}>
        Version 0.1.0 · Built with Next.js + Prisma
      </p>
    </div>
  )
}
