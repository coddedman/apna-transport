import PageHeader from '@/components/PageHeader'
import { getPlatformStats, getTransporters, getTenantMetrics } from '@/lib/actions/platform'
import Link from 'next/link'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

function sinceLabel(date: Date | null) {
  if (!date) return { text: 'No activity', stale: true }
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (days <= 0) return { text: 'Today', stale: false }
  if (days === 1) return { text: 'Yesterday', stale: false }
  return { text: `${days}d ago`, stale: days > 14 }
}

export default async function PlatformDashboard() {
  const [stats, transporters, metrics] = await Promise.all([
    getPlatformStats(),
    getTransporters(),
    getTenantMetrics(),
  ])

  const platformRevenue = Object.values(metrics).reduce((s, m) => s + m.revenue, 0)
  const platformTrips = Object.values(metrics).reduce((s, m) => s + m.trips, 0)

  const statCards = [
    { label: 'Transporters', value: stats.transporterCount, icon: '🏢', color: 'purple' },
    { label: 'Total Billed', value: fmt(platformRevenue), icon: '💰', color: 'success' },
    { label: 'Total Trips', value: platformTrips.toLocaleString('en-IN'), icon: '📦', color: 'info' },
    { label: 'Fleet Size', value: stats.vehicleCount, icon: '🚛', color: 'accent' },
  ]

  return (
    <>
      <PageHeader title="Platform Overview" subtitle="Manage all transporters and their operations"><Link href="/platform/onboard" className="btn btn-primary">+ Onboard Transporter</Link></PageHeader>

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
                  <th>Fleet</th>
                  <th>Trips</th>
                  <th>Billed</th>
                  <th>Outstanding</th>
                  <th>Last Activity</th>
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
                  transporters.map((t) => {
                    const m = metrics[t.id]
                    const outstanding = m ? m.billed - m.received : 0
                    const activity = sinceLabel(m?.lastActivity ?? null)
                    return (
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
                            <div>
                              <strong>{t.name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                {t.registration || 'No registration'} · {t._count.users} users · {t._count.projects} projects
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{m?.vehicles ?? 0}</td>
                        <td>{(m?.trips ?? 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(m?.revenue ?? 0)}</td>
                        <td style={{ color: outstanding > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: outstanding > 0 ? 600 : 400 }}>
                          {fmt(outstanding)}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          <span className={`badge ${activity.stale ? 'inactive' : 'active'}`}>{activity.text}</span>
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
