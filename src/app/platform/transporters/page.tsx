import { getTransporters } from '@/lib/actions/platform'
import Link from 'next/link'

export default async function TransportersListPage() {
  const transporters = await getTransporters()

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">All Transporters</h1>
            <p className="page-subtitle">{transporters.length} registered companies on the platform</p>
          </div>
        </div>
        <div className="page-header-right">
          <Link href="/platform/onboard" className="btn btn-primary" style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          }}>
            + Onboard New
          </Link>
        </div>
      </header>

      <div className="page-body">
        {transporters.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏢</div>
              <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>No Transporters Yet</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>Get started by onboarding your first transport company.</p>
              <Link href="/platform/onboard" className="btn btn-primary" style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}>
                + Onboard Transporter
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {transporters.map((t) => (
              <Link
                key={t.id}
                href={`/platform/transporters/${t.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card" style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div className="card-body">
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 800, color: '#fff', flexShrink: 0,
                      }}>
                        {t.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {t.registration || 'No registration'}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#8b5cf6' }}>
                          {t._count.users}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Users
                        </div>
                      </div>
                      <div style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6' }}>
                          {t._count.projects}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Projects
                        </div>
                      </div>
                      <div style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#22c55e' }}>
                          {t._count.owners}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Owners
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <span>
                        Joined {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span style={{ color: '#8b5cf6', fontWeight: 600 }}>View →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
