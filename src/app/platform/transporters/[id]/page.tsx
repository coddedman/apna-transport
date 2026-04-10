import { getTransporterDetails } from '@/lib/actions/platform'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TransporterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const transporter = await getTransporterDetails(id)

  if (!transporter) {
    notFound()
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 800, color: '#fff',
            }}>
              {transporter.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="page-title">{transporter.name}</h1>
              <p className="page-subtitle">
                {transporter.registration || 'No registration'} · Joined {new Date(transporter.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="page-header-right">
          <Link href="/platform/transporters" className="btn btn-secondary">← Back</Link>
        </div>
      </header>

      <div className="page-body">
        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">👥</div>
            </div>
            <div className="stat-card-value">{transporter._count.users}</div>
            <div className="stat-card-label">Users</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">📁</div>
            </div>
            <div className="stat-card-value">{transporter._count.projects}</div>
            <div className="stat-card-label">Projects</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">👤</div>
            </div>
            <div className="stat-card-value">{transporter._count.owners}</div>
            <div className="stat-card-label">Vehicle Owners</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Users */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Users</span>
              <span className="badge info">{transporter.users.length} members</span>
            </div>
            <div className="card-body">
              {transporter.users.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No users registered.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {transporter.users.map((user) => (
                    <div key={user.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '7px',
                          background: user.role === 'ORG_ADMIN'
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 700, color: '#fff',
                        }}>
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{user.email}</span>
                      </div>
                      <span className={`badge ${user.role === 'ORG_ADMIN' ? 'active' : 'info'}`}
                        style={{ fontSize: '11px' }}
                      >
                        {user.role === 'ORG_ADMIN' ? 'Admin' : 'Manager'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Projects</span>
              <span className="badge info">{transporter.projects.length} active</span>
            </div>
            <div className="card-body">
              {transporter.projects.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No projects created yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {transporter.projects.map((project) => (
                    <div key={project.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{project.projectName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>📍 {project.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Owners */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Vehicle Owners</span>
            <span className="badge info">{transporter.owners.length} owners</span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Owner Name</th>
                  <th>Phone</th>
                  <th>Vehicles</th>
                </tr>
              </thead>
              <tbody>
                {transporter.owners.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                      No vehicle owners registered.
                    </td>
                  </tr>
                ) : (
                  transporter.owners.map((owner) => (
                    <tr key={owner.id}>
                      <td><strong>{owner.ownerName}</strong></td>
                      <td>{owner.phone}</td>
                      <td>
                        <span className="badge info">{owner._count.vehicles} vehicles</span>
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
