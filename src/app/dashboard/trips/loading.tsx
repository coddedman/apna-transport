export default function TripsLoading() {
  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <div className="skeleton" style={{ width: '120px', height: '24px', marginBottom: '6px' }} />
            <div className="skeleton" style={{ width: '280px', height: '14px' }} />
          </div>
        </div>
      </header>

      <div className="page-body">
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card" style={{ minHeight: '100px' }}>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '60px', height: '22px', marginBottom: '6px' }} />
              <div className="skeleton" style={{ width: '80px', height: '12px' }} />
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ padding: '14px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ width: '140px', height: '36px', borderRadius: '6px' }} />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="skeleton" style={{ width: '120px', height: '16px' }} />
            <div className="skeleton" style={{ width: '100px', height: '30px', borderRadius: '6px' }} />
          </div>
          <div style={{ padding: '16px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ width: '100%', height: '44px', marginBottom: '8px', borderRadius: '6px' }} />
            ))}
          </div>
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
