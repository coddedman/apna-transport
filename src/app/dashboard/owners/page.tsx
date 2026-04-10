export default function OwnersPage() {
  const owners = [
    { id: 1, name: 'Ramesh Kumar', phone: '+91 98765 43210', vehicles: 8, bank: 'SBI ****4521', status: 'active', pending: '₹1,24,000' },
    { id: 2, name: 'Suresh Yadav', phone: '+91 87654 32109', vehicles: 5, bank: 'HDFC ****7834', status: 'active', pending: '₹87,500' },
    { id: 3, name: 'Ajay Singh', phone: '+91 76543 21098', vehicles: 12, bank: 'ICICI ****2190', status: 'active', pending: '₹2,10,000' },
    { id: 4, name: 'Vikram Sharma', phone: '+91 65432 10987', vehicles: 3, bank: 'PNB ****6743', status: 'inactive', pending: '₹0' },
    { id: 5, name: 'Deepak Chauhan', phone: '+91 54321 09876', vehicles: 6, bank: 'BOB ****9012', status: 'active', pending: '₹56,200' },
    { id: 6, name: 'Manoj Gupta', phone: '+91 43210 98765', vehicles: 4, bank: 'Axis ****3456', status: 'active', pending: '₹72,800' },
  ]

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Vehicle Owners</h1>
            <p className="page-subtitle">Manage 3rd party vehicle owners and their details</p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">+ Add Owner</button>
        </div>
      </header>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-card-header">
              <div className="stat-card-icon accent">👤</div>
            </div>
            <div className="stat-card-value">6</div>
            <div className="stat-card-label">Total Owners</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div className="stat-card-icon success">✅</div>
            </div>
            <div className="stat-card-value">5</div>
            <div className="stat-card-label">Active Owners</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div className="stat-card-icon info">🚛</div>
            </div>
            <div className="stat-card-value">38</div>
            <div className="stat-card-label">Total Vehicles</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon purple">💸</div>
            </div>
            <div className="stat-card-value">₹5.5L</div>
            <div className="stat-card-label">Pending Payouts</div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Owners</span>
            <button className="btn btn-secondary btn-sm">🔍 Search</button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Owner Name</th>
                  <th>Contact</th>
                  <th>Vehicles</th>
                  <th>Bank Account</th>
                  <th>Pending Payout</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner.id}>
                    <td><strong>{owner.name}</strong></td>
                    <td>{owner.phone}</td>
                    <td>{owner.vehicles} trucks</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{owner.bank}</td>
                    <td style={{ color: owner.pending !== '₹0' ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                      {owner.pending}
                    </td>
                    <td>
                      <span className={`badge ${owner.status}`}>
                        {owner.status === 'active' ? '● Active' : '○ Inactive'}
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
