export default function VehiclesPage() {
  const vehicles = [
    { id: 1, plateNo: 'HR-55-AB-1234', owner: 'Ramesh Kumar', type: 'Hyva 16T', rc: '2027-03-15', fitness: '2026-11-20', trips: 142, status: 'active' },
    { id: 2, plateNo: 'HR-55-CD-5678', owner: 'Suresh Yadav', type: 'Hyva 20T', rc: '2027-06-22', fitness: '2026-09-10', trips: 98, status: 'active' },
    { id: 3, plateNo: 'DL-01-EF-9012', owner: 'Ajay Singh', type: 'Hyva 16T', rc: '2026-12-01', fitness: '2026-07-15', trips: 210, status: 'active' },
    { id: 4, plateNo: 'HR-55-GH-3456', owner: 'Ramesh Kumar', type: 'Hyva 25T', rc: '2028-01-30', fitness: '2027-02-28', trips: 64, status: 'active' },
    { id: 5, plateNo: 'DL-01-IJ-7890', owner: 'Deepak Chauhan', type: 'Hyva 20T', rc: '2027-09-18', fitness: '2026-08-05', trips: 176, status: 'active' },
    { id: 6, plateNo: 'HR-38-KL-2345', owner: 'Manoj Gupta', type: 'Hyva 16T', rc: '2026-08-10', fitness: '2026-05-20', trips: 0, status: 'inactive' },
    { id: 7, plateNo: 'DL-01-MN-6789', owner: 'Ajay Singh', type: 'Hyva 25T', rc: '2028-04-12', fitness: '2027-05-30', trips: 55, status: 'active' },
    { id: 8, plateNo: 'HR-55-OP-0123', owner: 'Suresh Yadav', type: 'Hyva 20T', rc: '2027-11-25', fitness: '2027-01-15', trips: 88, status: 'active' },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Vehicles</h1>
            <p className="page-subtitle">Fleet registry with RC & fitness tracking</p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">+ Register Vehicle</button>
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">🚛</div>
            </div>
            <div className="stat-card-value">8</div>
            <div className="stat-card-label">Total Vehicles</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">✅</div>
            </div>
            <div className="stat-card-value">7</div>
            <div className="stat-card-label">Active Fleet</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">🛣️</div>
            </div>
            <div className="stat-card-value">833</div>
            <div className="stat-card-label">Total Trips</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">⚠️</div>
            </div>
            <div className="stat-card-value">2</div>
            <div className="stat-card-label">Fitness Expiring Soon</div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Vehicles</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm">Filter by Owner</button>
              <button className="btn btn-secondary btn-sm">🔍 Search</button>
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle No.</th>
                  <th>Owner</th>
                  <th>Type</th>
                  <th>RC Expiry</th>
                  <th>Fitness Expiry</th>
                  <th>Trips</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.plateNo}</strong></td>
                    <td>{v.owner}</td>
                    <td>{v.type}</td>
                    <td>{v.rc}</td>
                    <td>
                      <span style={{
                        color: new Date(v.fitness) < new Date('2026-08-01') ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                        fontWeight: new Date(v.fitness) < new Date('2026-08-01') ? 600 : 400,
                      }}>
                        {v.fitness}
                      </span>
                    </td>
                    <td>{v.trips}</td>
                    <td>
                      <span className={`badge ${v.status}`}>
                        {v.status === 'active' ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
