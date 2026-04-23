export default function SettlementsLoading() {
  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <div className="skeleton" style={{ width: '120px', height: '24px', marginBottom: '6px' }} />
            <div className="skeleton" style={{ width: '260px', height: '14px' }} />
          </div>
        </div>
      </header>

      <div className="page-body">
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ padding: '18px 24px' }}>
            <div className="skeleton" style={{ width: '400px', height: '32px', borderRadius: '6px' }} />
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card" style={{ minHeight: '100px' }}>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '60px', height: '22px', marginBottom: '6px' }} />
              <div className="skeleton" style={{ width: '85px', height: '12px' }} />
            </div>
          ))}
        </div>

        {[1, 2].map(i => (
          <div key={i} className="card" style={{ marginBottom: '16px' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div className="skeleton" style={{ width: '180px', height: '20px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '320px', height: '14px', marginBottom: '20px' }} />
              <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '8px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
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
