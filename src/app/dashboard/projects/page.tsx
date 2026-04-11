import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AddProjectButton from '@/components/AddProjectButton'

export default async function ProjectsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const projectsData = await prisma.project.findMany({
    where: { transporterId },
    include: {
      trips: true
    }
  })

  // Calculate aggregates based on DB real trips
  const projects = projectsData.map(p => {
    const totalTrips = p.trips.length
    const totalRevenue = p.trips.reduce((acc, t) => acc + t.partyFreightAmount, 0)
    
    return {
      id: p.id,
      name: p.projectName,
      location: p.location,
      trips: totalTrips,
      revenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      status: 'active'
    }
  })

  const totalTripsOverall = projectsData.reduce((acc, p) => acc + p.trips.length, 0)
  const totalRevenueOverall = projectsData.reduce((acc, p) => 
    acc + p.trips.reduce((tAcc, t) => tAcc + t.partyFreightAmount, 0)
  , 0)

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">Manage project sites and hauling rates</p>
          </div>
        </div>
        <div className="page-header-right">
          <AddProjectButton />
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">📁</div>
            </div>
            <div className="stat-card-value">{projects.length}</div>
            <div className="stat-card-label">Total Projects</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">✅</div>
            </div>
            <div className="stat-card-value">{projects.filter(p => p.status === 'active').length}</div>
            <div className="stat-card-label">Active Projects</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">🛣️</div>
            </div>
            <div className="stat-card-value">{totalTripsOverall.toLocaleString()}</div>
            <div className="stat-card-label">Total Trips</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">💰</div>
            </div>
            <div className="stat-card-value">₹{totalRevenueOverall.toLocaleString('en-IN')}</div>
            <div className="stat-card-label">Total Revenue</div>
          </div>
        </div>

        {/* Project Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {projects.length === 0 ? (
            <div style={{ padding: '30px', color: 'var(--color-text-muted)' }}>No projects found. Create one to get started!</div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div className="card-body" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {project.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>📍 {project.location}</p>
                    </div>
                    <span className={`badge ${project.status}`}>
                      {project.status === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Trips Logged</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{project.trips}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Total Revenue</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>{project.revenue}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
