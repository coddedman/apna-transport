export default function ProjectsLoading() {
  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <div className="skeleton" style={{ width: '90px', height: '24px', marginBottom: '6px' }} />
            <div className="skeleton" style={{ width: '240px', height: '14px' }} />
          </div>
        </div>
      </header>

      <div className="page-body">
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card" style={{ minHeight: '100px' }}>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '50px', height: '22px', marginBottom: '6px' }} />
              <div className="skeleton" style={{ width: '80px', height: '12px' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="card-body" style={{ padding: '22px' }}>
                <div className="skeleton" style={{ width: '160px', height: '18px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '120px', height: '12px', marginBottom: '18px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="skeleton" style={{ width: '70px', height: '10px', marginBottom: '4px' }} />
                    <div className="skeleton" style={{ width: '40px', height: '16px' }} />
                  </div>
                  <div>
                    <div className="skeleton" style={{ width: '80px', height: '10px', marginBottom: '4px' }} />
                    <div className="skeleton" style={{ width: '70px', height: '16px' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}
