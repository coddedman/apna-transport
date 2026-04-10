import { getPlatformStats, getTransporters } from '@/lib/actions/platform'
import Link from 'next/link'

export default async function PlatformDashboard() {
  const [stats, transporters] = await Promise.all([
    getPlatformStats(),
    getTransporters(),
  ])

  const statCards = [
    { label: 'Transporters', value: stats.transporterCount, icon: '🏢', color: 'purple' },
    { label: 'Total Users', value: stats.userCount, icon: '👥', color: 'accent' },
    { label: 'Active Projects', value: stats.projectCount, icon: '📁', color: 'info' },
    { label: 'Fleet Size', value: stats.vehicleCount, icon: '🚛', color: 'success' },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Platform Overview</h1>
            <p className="page-subtitle">Manage all transporters and their operations</p>
          </div>
        </div>
        <div className="page-header-right">
          <Link href="/platform/onboard" className="btn btn-primary" style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          }}>
            + Onboard Transporter
          </Link>
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {statCards.map((stat) => (
            <div key={stat.label} className={`stat-card ${stat.color}`}>
              <div className="stat-card-header">
                <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Transporters Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Transporters</span>
            <Link href="/platform/transporters" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Registration</th>
                  <th>Users</th>
                  <th>Projects</th>
                  <th>Owners</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transporters.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      No transporters onboarded yet. Click "Onboard Transporter" to get started.
                    </td>
                  </tr>
                ) : (
                  transporters.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>
                            {t.name.substring(0, 2).toUpperCase()}
                          </div>
                          <strong>{t.name}</strong>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>
                        {t.registration || '—'}
                      </td>
                      <td>
                        <span className="badge info">{t._count.users} users</span>
                      </td>
                      <td>{t._count.projects}</td>
                      <td>{t._count.owners}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <Link
                          href={`/platform/transporters/${t.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
