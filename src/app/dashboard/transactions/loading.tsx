export default function Loading() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ height: 28, width: 200, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
        <div style={{ height: 16, width: 300, background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginTop: 8 }} />
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card" style={{ opacity: 0.5 }}>
            <div style={{ height: 32, width: 100, background: 'rgba(255,255,255,0.06)', borderRadius: 8, margin: '12px auto' }} />
            <div style={{ height: 14, width: 120, background: 'rgba(255,255,255,0.04)', borderRadius: 6, margin: '8px auto' }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 20, padding: 30, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading transactions...
      </div>
    </div>
  )
}
