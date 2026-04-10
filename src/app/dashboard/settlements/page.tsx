export default function SettlementsPage() {
  const settlements = [
    {
      id: 1,
      owner: 'Ramesh Kumar',
      period: '01 Mar - 31 Mar 2026',
      vehicles: 8,
      trips: 64,
      revenue: 320000,
      fuel: 85000,
      advances: 32000,
      maintenance: 18000,
      tolls: 12000,
      status: 'pending',
    },
    {
      id: 2,
      owner: 'Suresh Yadav',
      period: '01 Mar - 31 Mar 2026',
      vehicles: 5,
      trips: 42,
      revenue: 189000,
      fuel: 52000,
      advances: 21000,
      maintenance: 8500,
      tolls: 6800,
      status: 'pending',
    },
    {
      id: 3,
      owner: 'Ajay Singh',
      period: '01 Mar - 31 Mar 2026',
      vehicles: 12,
      trips: 96,
      revenue: 480000,
      fuel: 128000,
      advances: 48000,
      maintenance: 24000,
      tolls: 18000,
      status: 'settled',
    },
    {
      id: 4,
      owner: 'Deepak Chauhan',
      period: '01 Mar - 31 Mar 2026',
      vehicles: 6,
      trips: 38,
      revenue: 171000,
      fuel: 45000,
      advances: 15200,
      maintenance: 0,
      tolls: 8500,
      status: 'pending',
    },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Settlements</h1>
            <p className="page-subtitle">Owner reconciliation and payout generation</p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">+ Generate Settlement</button>
        </div>
      </header>

      <div className="page-body">
        {/* Formula Banner */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Settlement Formula:</span>
              <code style={{
                background: 'rgba(245,158,11,.08)',
                border: '1px solid rgba(245,158,11,.2)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--color-accent)',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}>
                Final Payout = Σ(Trip Revenue) − Σ(Advances + Fuel + Deductions)
              </code>
            </div>
          </div>
        </div>

        {/* Settlement Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {settlements.map((s) => {
            const totalDeductions = s.fuel + s.advances + s.maintenance + s.tolls
            const payout = s.revenue - totalDeductions

            return (
              <div key={s.id} className="card animate-in">
                <div className="card-body" style={{ padding: '24px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {s.owner}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        📅 {s.period} · {s.vehicles} vehicles · {s.trips} trips
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={`badge ${s.status === 'settled' ? 'active' : 'fuel'}`}>
                        {s.status === 'settled' ? '✓ Settled' : '◷ Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '14px',
                    padding: '18px',
                    background: 'rgba(255,255,255,.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '16px',
                  }}>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Trip Revenue</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)', letterSpacing: '-0.02em' }}>
                        ₹{s.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Fuel</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                        -₹{s.fuel.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Advances</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                        -₹{s.advances.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Maintenance</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                        -₹{s.maintenance.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tolls</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                        -₹{s.tolls.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Final Payout */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: payout > 0 ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${payout > 0 ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'}`,
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                        FINAL PAYOUT
                      </p>
                      <p style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        color: payout > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                        letterSpacing: '-0.03em',
                      }}>
                        ₹{payout.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {s.status !== 'settled' && (
                        <button className="btn btn-primary btn-sm">Mark as Settled</button>
                      )}
                      <button className="btn btn-secondary btn-sm">📄 Export PDF</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
