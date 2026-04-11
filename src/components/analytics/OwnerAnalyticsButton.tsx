'use client'

import { useState } from 'react'
import Modal from '../Modal'

interface OwnerAnalyticsProps {
  owner: any
}

export default function OwnerAnalyticsButton({ owner }: OwnerAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calcs
  const vehicles = owner.vehicles || []
  let totalTrips = 0
  let totalRevenue = 0
  let totalExpenses = 0
  
  vehicles.forEach((v: any) => {
    totalTrips += v.trips?.length || 0
    totalRevenue += v.trips?.reduce((acc: number, t: any) => acc + t.totalAmount, 0) || 0
    totalExpenses += v.expenses?.reduce((acc: number, e: any) => acc + e.amount, 0) || 0
  })

  const settlements = owner.settlements || []
  const settledAmount = settlements
    .filter((s: any) => s.status === 'SETTLED')
    .reduce((a: number, s: any) => a + s.finalPayout, 0)

  // Group by Project
  const projectStats: Record<string, { name: string, revenue: number, expenses: number, trips: number }> = {}

  vehicles.forEach((v: any) => {
    v.trips?.forEach((t: any) => {
      const pId = t.projectId
      const pName = t.project?.projectName || 'General'
      if (!projectStats[pId]) projectStats[pId] = { name: pName, revenue: 0, expenses: 0, trips: 0 }
      projectStats[pId].revenue += t.totalAmount
      projectStats[pId].trips += 1
    })
    v.expenses?.forEach((e: any) => {
      const pId = e.projectId || 'none'
      const pName = e.project?.projectName || 'General'
      if (!projectStats[pId]) projectStats[pId] = { name: pName, revenue: 0, expenses: 0, trips: 0 }
      projectStats[pId].expenses += e.amount
    })
  })

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary btn-sm"
        title="View Analytics"
        style={{ fontSize: '11px', padding: '4px 8px' }}
      >
        📊 Analytics
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${owner.ownerName} — Performance Analytics`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div className="stat-card accent" style={{ padding: '16px' }}>
            <div className="stat-card-label">Total Revenue</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card danger" style={{ padding: '16px' }}>
            <div className="stat-card-label">Total Expenses</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card success" style={{ padding: '16px' }}>
            <div className="stat-card-label">Net Profit</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>₹{(totalRevenue - totalExpenses).toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card info" style={{ padding: '16px' }}>
            <div className="stat-card-label">Vehicles / Trips</div>
            <div className="stat-card-value" style={{ fontSize: '20px' }}>{vehicles.length} / {totalTrips}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Performance by Project</h3>
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
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No project data found</td></tr>
              ) : (
                Object.values(projectStats).map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ textAlign: 'right' }}>{p.trips}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>₹{p.revenue.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{p.expenses.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(p.revenue - p.expenses).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Performance by Vehicle</h3>
        <div className="data-table-wrapper" style={{ marginBottom: '24px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th style={{ textAlign: 'right' }}>Trips</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Expenses</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v: any) => {
                const rev = v.trips?.reduce((a: number, t: any) => a + t.totalAmount, 0) || 0
                const exp = v.expenses?.reduce((a: number, e: any) => a + e.amount, 0) || 0
                return (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.plateNo}</td>
                    <td style={{ textAlign: 'right' }}>{v.trips?.length || 0}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>₹{rev.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{exp.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(rev - exp).toLocaleString()}</td>
                  </tr>
                )
              })}
              {vehicles.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No vehicles found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-footer" style={{ padding: '0', border: 'none' }}>
          <button className="btn btn-primary" onClick={() => setIsOpen(false)} style={{ width: '100%', justifyContent: 'center' }}>
            Close Analytics
          </button>
        </div>
      </Modal>
    </>
  )
}
