import Link from 'next/link'

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1120 0%, #111827 50%, #0b1120 100%)',
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
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
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
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        fontWeight: 900,
        color: '#0b1120',
        marginBottom: '28px',
        boxShadow: '0 0 60px rgba(245,158,11,0.2)',
      }}>
        HT
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '42px',
        fontWeight: 900,
        color: '#f1f5f9',
        letterSpacing: '-0.04em',
        textAlign: 'center',
        marginBottom: '12px',
        lineHeight: 1.1,
      }}>
        Hyva Transport
      </h1>

      <p style={{
        fontSize: '18px',
        color: '#64748b',
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
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '13px',
            color: '#94a3b8',
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
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#0b1120',
          fontSize: '15px',
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: '0 0 30px rgba(245,158,11,0.2)',
        }}
      >
        Get Started →
      </Link>

      <p style={{
        marginTop: '20px',
        fontSize: '12px',
        color: '#475569',
      }}>
        Version 0.1.0 · Built with Next.js + Prisma
      </p>
    </div>
  )
}
