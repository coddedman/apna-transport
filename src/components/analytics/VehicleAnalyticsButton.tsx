'use client'

import { useState } from 'react'
import Modal from '../Modal'

interface VehicleAnalyticsProps {
  vehicle: any
}

export default function VehicleAnalyticsButton({ vehicle }: VehicleAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculations
  const trips = vehicle.trips || []
  const expenses = vehicle.expenses || []
  
  const totalRevenue = trips.reduce((acc: number, t: any) => acc + t.ownerFreightAmount, 0)
  const totalExpenses = expenses.reduce((acc: number, e: any) => acc + e.amount, 0)
  const profit = totalRevenue - totalExpenses

  // Group by Project
  const projectStats: Record<string, { name: string, revenue: number, expenses: number, tripsCount: number }> = {}

  trips.forEach((t: any) => {
    const pId = t.projectId
    const pName = t.project?.projectName || 'General'
    if (!projectStats[pId]) projectStats[pId] = { name: pName, revenue: 0, expenses: 0, tripsCount: 0 }
    projectStats[pId].revenue += t.ownerFreightAmount
    projectStats[pId].tripsCount += 1
  })

  expenses.forEach((e: any) => {
    const pId = e.projectId || 'none'
    const pName = e.project?.projectName || 'General'
    if (!projectStats[pId]) projectStats[pId] = { name: pName, revenue: 0, expenses: 0, tripsCount: 0 }
    projectStats[pId].expenses += e.amount
  })

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary btn-sm"
        title="View Analytics"
        style={{ fontSize: '11px', padding: '4px 8px' }}
      >
        📊 Stats
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${vehicle.plateNo} — Operational Stats`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div className="stat-card accent" style={{ padding: '16px' }}>
            <div className="stat-card-label">Revenue</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card danger" style={{ padding: '16px' }}>
            <div className="stat-card-label">Expenses</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
          </div>
          <div className={`stat-card ${profit >= 0 ? 'success' : 'danger'}`} style={{ padding: '16px' }}>
            <div className="stat-card-label">Net Profit</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{profit.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card info" style={{ padding: '16px' }}>
            <div className="stat-card-label">Total Trips</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>{trips.length}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Project-wise Analysis</h3>
        <div className="data-table-wrapper" style={{ marginBottom: '24px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th style={{ textAlign: 'right' }}>Trips</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Expenses</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(projectStats).length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No data available</td></tr>
              ) : (
                Object.values(projectStats).map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ textAlign: 'right' }}>{p.tripsCount}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>₹{p.revenue.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{p.expenses.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(p.revenue - p.expenses).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-primary" onClick={() => setIsOpen(false)} style={{ width: '100%', justifyContent: 'center' }}>
            Close
          </button>
        </div>
      </Modal>
    </>
  )
}
