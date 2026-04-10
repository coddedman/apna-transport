export default function ProjectsPage() {
  const projects = [
    { id: 1, name: 'Manesar Bypass', location: 'Manesar, Haryana', rate: '₹500/T', trips: 412, revenue: '₹8,24,000', status: 'active' },
    { id: 2, name: 'Gurugram Metro Phase 3', location: 'Sector 52, Gurugram', rate: '₹450/T', trips: 286, revenue: '₹5,72,000', status: 'active' },
    { id: 3, name: 'Dwarka Expressway', location: 'Dwarka, Delhi', rate: '₹600/T', trips: 198, revenue: '₹4,95,000', status: 'active' },
    { id: 4, name: 'Kundli-Sonipat Highway', location: 'Kundli, Haryana', rate: '₹520/T', trips: 164, revenue: '₹3,28,000', status: 'active' },
    { id: 5, name: 'Bahadurgarh Ring Road', location: 'Bahadurgarh, Haryana', rate: '₹480/T', trips: 98, revenue: '₹1,56,800', status: 'inactive' },
  ]

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
          <button className="btn btn-primary">+ Create Project</button>
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">📁</div>
            </div>
            <div className="stat-card-value">5</div>
            <div className="stat-card-label">Total Projects</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">✅</div>
            </div>
            <div className="stat-card-value">4</div>
            <div className="stat-card-label">Active Projects</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">🛣️</div>
            </div>
            <div className="stat-card-value">1,158</div>
            <div className="stat-card-label">Total Trips</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">💰</div>
            </div>
            <div className="stat-card-value">₹23.7L</div>
            <div className="stat-card-label">Total Revenue</div>
          </div>
        </div>

        {/* Project Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {projects.map((project) => (
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Rate</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)' }}>{project.rate}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Trips</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{project.trips}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Revenue</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>{project.revenue}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
