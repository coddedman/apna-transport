export default function TripsPage() {
  const trips = [
    { id: 1, date: '2026-04-10', vehicle: 'HR-55-AB-1234', project: 'Manesar Bypass', weight: 22.5, rate: 500, amount: 11250, driver: 'Mohan' },
    { id: 2, date: '2026-04-10', vehicle: 'HR-55-CD-5678', project: 'Gurugram Metro', weight: 18.0, rate: 450, amount: 8100, driver: 'Raju' },
    { id: 3, date: '2026-04-10', vehicle: 'DL-01-EF-9012', project: 'Dwarka Expressway', weight: 25.0, rate: 600, amount: 15000, driver: 'Sunil' },
    { id: 4, date: '2026-04-09', vehicle: 'HR-55-GH-3456', project: 'Manesar Bypass', weight: 20.0, rate: 500, amount: 10000, driver: 'Mohan' },
    { id: 5, date: '2026-04-09', vehicle: 'DL-01-IJ-7890', project: 'Kundli-Sonipat', weight: 24.0, rate: 520, amount: 12480, driver: 'Arjun' },
    { id: 6, date: '2026-04-09', vehicle: 'DL-01-MN-6789', project: 'Dwarka Expressway', weight: 21.5, rate: 600, amount: 12900, driver: 'Vikram' },
    { id: 7, date: '2026-04-08', vehicle: 'HR-55-OP-0123', project: 'Gurugram Metro', weight: 19.0, rate: 450, amount: 8550, driver: 'Raju' },
    { id: 8, date: '2026-04-08', vehicle: 'HR-55-AB-1234', project: 'Manesar Bypass', weight: 23.0, rate: 500, amount: 11500, driver: 'Mohan' },
    { id: 9, date: '2026-04-08', vehicle: 'DL-01-EF-9012', project: 'Kundli-Sonipat', weight: 22.0, rate: 520, amount: 11440, driver: 'Sunil' },
    { id: 10, date: '2026-04-07', vehicle: 'HR-55-CD-5678', project: 'Manesar Bypass', weight: 20.5, rate: 500, amount: 10250, driver: 'Raju' },
  ]

  const totalWeight = trips.reduce((a, t) => a + t.weight, 0)
  const totalAmount = trips.reduce((a, t) => a + t.amount, 0)

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Trip Logger</h1>
            <p className="page-subtitle">Daily trip entries with automated freight calculation</p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">+ Log New Trip</button>
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">🛣️</div>
            </div>
            <div className="stat-card-value">{trips.length}</div>
            <div className="stat-card-label">Trips (This Week)</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">⚖️</div>
            </div>
            <div className="stat-card-value">{totalWeight.toFixed(1)} T</div>
            <div className="stat-card-label">Total Weight</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">💰</div>
            </div>
            <div className="stat-card-value">₹{(totalAmount / 100000).toFixed(1)}L</div>
            <div className="stat-card-label">Total Freight</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">📊</div>
            </div>
            <div className="stat-card-value">₹{Math.round(totalAmount / trips.length).toLocaleString()}</div>
            <div className="stat-card-label">Avg per Trip</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" className="form-input" style={{ width: 'auto', maxWidth: '160px' }} defaultValue="2026-04-07" />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>to</span>
              <input type="date" className="form-input" style={{ width: 'auto', maxWidth: '160px' }} defaultValue="2026-04-10" />
              <select className="form-select" style={{ width: 'auto', maxWidth: '180px' }}>
                <option>All Vehicles</option>
                <option>HR-55-AB-1234</option>
                <option>HR-55-CD-5678</option>
                <option>DL-01-EF-9012</option>
              </select>
              <select className="form-select" style={{ width: 'auto', maxWidth: '180px' }}>
                <option>All Projects</option>
                <option>Manesar Bypass</option>
                <option>Gurugram Metro</option>
                <option>Dwarka Expressway</option>
              </select>
              <button className="btn btn-secondary btn-sm">Apply Filters</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Trip Records</span>
            <button className="btn btn-secondary btn-sm">📥 Export CSV</button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle No.</th>
                  <th>Project</th>
                  <th>Driver</th>
                  <th>Weight (T)</th>
                  <th>Rate/T</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.date}</td>
                    <td><strong>{trip.vehicle}</strong></td>
                    <td>{trip.project}</td>
                    <td>{trip.driver}</td>
                    <td style={{ fontWeight: 600 }}>{trip.weight}</td>
                    <td>₹{trip.rate}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>₹{trip.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Totals</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalWeight.toFixed(1)}</td>
                  <td>—</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>₹{totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
