export default function DashboardLoading() {
  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header skeleton */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, padding: '16px 20px',
        background: 'var(--color-bg-card)', borderRadius: 14,
        border: '1px solid var(--color-border)',
      }}>
        <div>
          <div className="skeleton skeleton-text xl" style={{ width: 200, marginBottom: 8 }} />
          <div className="skeleton skeleton-text sm" style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`skeleton skeleton-delay-${i}`} style={{ width: 70, height: 32, borderRadius: 8 }} />
          ))}
        </div>
      </div>

      {/* Tab navigation skeleton */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto' }}>
        {[1,2,3,4,5,6,7,8,9].map(i => (
          <div key={i} className={`skeleton skeleton-delay-${i % 5}`} style={{ width: 90, height: 36, borderRadius: 10, flexShrink: 0 }} />
        ))}
      </div>

      {/* KPI Grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="skeleton-kpi">
            <div className={`skeleton skeleton-circle skeleton-delay-${i}`} />
            <div style={{ flex: 1 }}>
              <div className={`skeleton skeleton-text xl skeleton-delay-${i}`} style={{ width: '60%' }} />
              <div className={`skeleton skeleton-text sm skeleton-delay-${i}`} style={{ width: '40%', marginBottom: 0 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Revenue chart placeholder */}
        <div className="skeleton-card" style={{ minHeight: 280 }}>
          <div className="skeleton skeleton-text lg skeleton-delay-1" style={{ width: '40%', marginBottom: 20 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200, padding: '0 10px' }}>
            {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
              <div key={i} className={`skeleton skeleton-delay-${(i % 5) + 1}`} style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0' }} />
            ))}
          </div>
        </div>

        {/* Donut/breakdown placeholder */}
        <div className="skeleton-card" style={{ minHeight: 280 }}>
          <div className="skeleton skeleton-text lg skeleton-delay-2" style={{ width: '50%', marginBottom: 20 }} />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
            <div className="skeleton skeleton-delay-3" style={{ width: 140, height: 140, borderRadius: '50%' }} />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="skeleton-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="skeleton skeleton-text lg skeleton-delay-1" style={{ width: '30%' }} />
          <div className="skeleton skeleton-delay-2" style={{ width: 80, height: 28, borderRadius: 8 }} />
        </div>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`skeleton skeleton-text sm skeleton-delay-${i}`} style={{ width: '80%' }} />
          ))}
        </div>
        {/* Table rows */}
        {[1,2,3,4,5,6].map(row => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 10, paddingBottom: 10, borderBottom: row < 6 ? '1px solid var(--color-border)' : 'none' }}>
            {[1,2,3,4,5].map(col => (
              <div key={col} className={`skeleton skeleton-text md skeleton-delay-${(row + col) % 5}`} style={{ width: `${60 + (col * 5)}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
