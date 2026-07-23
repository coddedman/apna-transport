export default function Loading() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ height: 28, width: 200, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
        <div style={{ height: 16, width: 350, background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginTop: 8 }} />
      </div>
      <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading tally...
      </div>
    </div>
  )
}
