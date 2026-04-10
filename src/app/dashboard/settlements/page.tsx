import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function SettlementsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId

  if (!transporterId) return <div>Unauthorized</div>

  const ownersData = await prisma.owner.findMany({
    where: { transporterId },
    include: {
      vehicles: {
        include: {
          trips: true,
          expenses: true
        }
      }
    }
  })

  // Prepare dynamic settlements array based on DB records per owner
  const settlements = ownersData.map(o => {
    let revenue = 0
    let fuel = 0
    let advances = 0
    let maintenance = 0
    let tolls = 0
    let tripsCount = 0

    o.vehicles.forEach(v => {
      tripsCount += v.trips.length
      revenue += v.trips.reduce((acc, t) => acc + t.totalAmount, 0)
      
      v.expenses.forEach(e => {
        if (e.type === 'FUEL') fuel += e.amount
        else if (e.type === 'DRIVER_ADVANCE') advances += e.amount
        else if (e.type === 'MAINTENANCE') maintenance += e.amount
        else if (e.type === 'TOLL') tolls += e.amount
        // OTHER excluded or mapped separately if needed
      })
    })

    return {
      id: o.id,
      owner: o.ownerName,
      period: 'All Time (Active)',
      vehicles: o.vehicles.length,
      trips: tripsCount,
      revenue,
      fuel,
      advances,
      maintenance,
      tolls,
      status: revenue > 0 || tripsCount > 0 ? 'pending' : 'no_activity'
    }
  }).filter(s => s.status !== 'no_activity') // Only show those with activity

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
        {settlements.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '50px' }}>
            No trip or expense activity found to generate settlements.
          </div>
        ) : (
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
                          ₹{s.revenue.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Fuel</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{s.fuel.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Advances</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{s.advances.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Maintenance</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{s.maintenance.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tolls & Others</p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          -₹{s.tolls.toLocaleString('en-IN')}
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
                          ₹{payout.toLocaleString('en-IN')}
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
        )}
      </div>
    </>
  )
}
