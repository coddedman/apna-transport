export default function ExpensesPage() {
  const expenses = [
    { id: 1, date: '2026-04-10', vehicle: 'HR-55-AB-1234', type: 'FUEL', amount: 4500, description: 'Diesel - 60L', by: 'Mohan' },
    { id: 2, date: '2026-04-10', vehicle: 'HR-55-CD-5678', type: 'ADVANCE', amount: 2000, description: 'Driver daily advance', by: 'Raju' },
    { id: 3, date: '2026-04-09', vehicle: 'DL-01-EF-9012', type: 'FUEL', amount: 5200, description: 'Diesel - 70L', by: 'Sunil' },
    { id: 4, date: '2026-04-09', vehicle: 'HR-55-GH-3456', type: 'TOLL', amount: 850, description: 'KMP Expressway toll', by: 'Mohan' },
    { id: 5, date: '2026-04-09', vehicle: 'DL-01-IJ-7890', type: 'MAINTENANCE', amount: 12000, description: 'Brake pad replacement', by: 'Workshop ABC' },
    { id: 6, date: '2026-04-08', vehicle: 'HR-55-AB-1234', type: 'FUEL', amount: 3800, description: 'Diesel - 50L', by: 'Mohan' },
    { id: 7, date: '2026-04-08', vehicle: 'DL-01-MN-6789', type: 'ADVANCE', amount: 1500, description: 'Driver weekly advance', by: 'Vikram' },
    { id: 8, date: '2026-04-08', vehicle: 'HR-55-OP-0123', type: 'OTHER', amount: 600, description: 'Parking charges', by: 'Raju' },
    { id: 9, date: '2026-04-07', vehicle: 'HR-55-CD-5678', type: 'FUEL', amount: 4100, description: 'Diesel - 55L', by: 'Raju' },
    { id: 10, date: '2026-04-07', vehicle: 'DL-01-EF-9012', type: 'TOLL', amount: 1200, description: 'Delhi-Manesar toll', by: 'Sunil' },
  ]

  const typeColors: Record<string, string> = {
    FUEL: 'fuel',
    ADVANCE: 'advance',
    MAINTENANCE: 'maintenance',
    TOLL: 'toll',
    OTHER: 'other',
  }

  const totalByType = expenses.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + e.amount
      return acc
    },
    {} as Record<string, number>
  )

  const totalExpense = expenses.reduce((a, e) => a + e.amount, 0)

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Expenses</h1>
            <p className="page-subtitle">Track fuel, advances, maintenance, and tolls</p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">+ Log Expense</button>
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">⛽</div>
            </div>
            <div className="stat-card-value">₹{((totalByType.FUEL || 0) / 1000).toFixed(1)}K</div>
            <div className="stat-card-label">Fuel Expenses</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">💵</div>
            </div>
            <div className="stat-card-value">₹{((totalByType.ADVANCE || 0) / 1000).toFixed(1)}K</div>
            <div className="stat-card-label">Driver Advances</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">🔧</div>
            </div>
            <div className="stat-card-value">₹{((totalByType.MAINTENANCE || 0) / 1000).toFixed(1)}K</div>
            <div className="stat-card-label">Maintenance</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">🛤️</div>
            </div>
            <div className="stat-card-value">₹{((totalByType.TOLL || 0) / 1000).toFixed(1)}K</div>
            <div className="stat-card-label">Tolls</div>
          </div>
        </div>

        {/* Total Banner */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Total Expenses (This Week)
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-danger)', letterSpacing: '-0.03em' }}>
              ₹{totalExpense.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Expense Records</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="form-select" style={{ width: 'auto', maxWidth: '150px', padding: '6px 30px 6px 12px', fontSize: '12px' }}>
                <option>All Types</option>
                <option>Fuel</option>
                <option>Advance</option>
                <option>Maintenance</option>
                <option>Toll</option>
              </select>
              <button className="btn btn-secondary btn-sm">📥 Export</button>
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Logged By</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.date}</td>
                    <td><strong>{exp.vehicle}</strong></td>
                    <td>
                      <span className={`badge ${typeColors[exp.type]}`}>{exp.type}</span>
                    </td>
                    <td>{exp.description}</td>
                    <td>{exp.by}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>-₹{exp.amount.toLocaleString()}</td>
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
