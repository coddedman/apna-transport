'use client'

import { agingLabels, agingBucketFor, outstandingFor, totalPayableFor, incentiveTotal, money } from '@/lib/finance/receivables'
import { useState, useTransition } from 'react'
import BillForm from './BillForm'
import PaymentForm from './PaymentForm'
import OverallPaymentForm from './OverallPaymentForm'
import EditBillModal from './EditBillModal'
import ExportCSVButton from '@/components/ExportCSVButton'
import { deletePartyBill } from '@/lib/actions/receivables'

interface Project { id: string; projectName: string; partyRate: number }

interface Payment {
  id: string
  date: Date | string
  amount: number
  referenceNo: string | null
  remarks: string | null
  createdAt: Date | string
}

interface OverallPartyPayment {
  id: string
  date: Date | string
  amount: number
  description: string | null
  referenceNo: string | null
  project: { id: string; projectName: string } | null
  createdAt: Date | string
}

interface Bill {
  tripLinked?: boolean
  trips?: { id: string; date: Date | string; weight: number; partyFreightAmount: number; vehicle: { plateNo: string } }[]
  id: string
  billNo: string
  projectId: string
  project: { id: string; projectName: string }
  periodStart: Date | string
  periodEnd: Date | string
  totalTrips: number
  totalWeight: number
  billAmount: number
  incentive?: number
  billType?: string
  receivedAmount: number
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  submittedAt: Date | string | null
  dueDate: Date | string | null
  remarks: string | null
  payments: Payment[]
  createdAt: Date | string
}

interface Summary {
  totalBilled: number
  totalBaseBilled?: number
  totalIncentives?: number
  totalReceived: number
  totalPending: number
  totalBills: number
  pendingBills: number
  partialBills: number
  paidBills: number
  overdueBills: number
}

interface ProjectPending {
  projectId: string
  projectName: string
  billed: number
  received: number
  pending: number
  count: number
}

interface Props {
  unbilledWork: { legacyCount: number; projects: { projectId: string; projectName: string; totalTrips: number; totalWeight: number; billAmount: number; periodStart: string; periodEnd: string }[] }
  bills: Bill[]
  summary: Summary
  projectWise: ProjectPending[]
  projects: Project[]
  overallPayments?: OverallPartyPayment[]
}

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtShort = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

const statusConfig: Record<string, { label: string; emoji: string; bg: string; border: string; color: string }> = {
  PENDING: { label: 'Pending', emoji: '🟡', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
  PARTIAL: { label: 'Partial', emoji: '🟠', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', color: '#f97316' },
  PAID: { label: 'Paid', emoji: '🟢', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#10b981' },
  OVERDUE: { label: 'Overdue', emoji: '🔴', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#ef4444' },
}

const card: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 20,
  padding: 24,
  marginBottom: 24,
}

export default function BillTracker({ bills, summary, projectWise, projects, unbilledWork, overallPayments = [] }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [agingFilter, setAgingFilter] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showOverallPayments, setShowOverallPayments] = useState(true)

  const filteredBills = bills.filter(b => {
    if (filterProject && b.projectId !== filterProject) return false
    if (filterStatus && b.status !== filterStatus) return false
    if (search && !`${b.billNo} ${b.project.projectName}`.toLowerCase().includes(search.toLowerCase().trim())) return false
    if (agingFilter !== null && (outstandingFor(b) === 0 || agingBucketFor(b) !== agingFilter)) return false
    return true
  })

  const filteredOverallPayments = overallPayments.filter(p => {
    if (filterProject && p.project?.id !== filterProject) return false
    return true
  })

  const totalOverallPaymentsSum = filteredOverallPayments.reduce((s, p) => s + p.amount, 0)

  // Overall lump-sum payments reference summary string
  const overallPaymentsSummaryStr = overallPayments.length > 0
    ? overallPayments.map(p => `${new Date(p.date).toLocaleDateString('en-IN')}: ₹${Math.round(p.amount).toLocaleString('en-IN')}${p.referenceNo ? ` [Ref: ${p.referenceNo}]` : ''}${p.description ? ` (${p.description})` : ''}`).join(' ; ')
    : 'None'

  function handleDelete(billId: string) {
    if (!confirm('Delete this unpaid invoice? Its linked trips will become available for billing again.')) return
    setDeletingId(billId)
    startTransition(async () => {
      try {
        await deletePartyBill(billId)
      } catch (err: any) {
        alert(err.message)
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div>
      {/* ═══ SUMMARY CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total Billed (Base + Incentive)',
            value: fmt(summary.totalBilled),
            color: '#f59e0b',
            sub: summary.totalIncentives && summary.totalIncentives > 0
              ? `Base: ${fmt(summary.totalBaseBilled || 0)} + Incentive: ${fmt(summary.totalIncentives)}`
              : `${summary.totalBills} bills`,
            icon: '📄'
          },
          { label: 'Collected against invoices', value: fmt(summary.totalReceived), color: '#10b981', sub: `${summary.paidBills} fully settled`, icon: '✅' },
          { label: 'Remaining Receivable (To Collect)', value: fmt(summary.totalPending), color: '#22d3ee', sub: summary.totalPending > 0 ? 'Net remaining amount to collect' : 'Fully collected', icon: '⏳' },
          { label: 'Overdue Bills', value: summary.overdueBills > 0 ? String(summary.overdueBills) : '0', color: summary.overdueBills > 0 ? '#ef4444' : '#64748b', sub: summary.overdueBills > 0 ? 'needs attention' : 'all clear', icon: summary.overdueBills > 0 ? '🔴' : '🟢' },
        ].map(c => (
          <div key={c.label} style={{
            background: 'var(--color-bg-card)',
            border: `1px solid ${c.color}22`,
            borderRadius: 16,
            padding: '20px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -10, right: -10, fontSize: 48, opacity: 0.06,
            }}>{c.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: c.color, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <section className="card" style={{ padding: 20, marginBottom: 24 }} aria-label="Receivables aging">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div><h2 style={{ fontSize: 14, fontWeight: 700 }}>Receivables Aging</h2><p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Outstanding balances by days past due · select a bucket to view invoices</p></div>
          {agingFilter !== null && <button className="btn btn-secondary btn-sm" onClick={() => setAgingFilter(null)}>Clear aging filter</button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          {agingLabels.map((label, index) => {
            const bucket = bills.filter(b => (!filterProject || b.projectId === filterProject) && outstandingFor(b) > 0 && agingBucketFor(b) === index)
            const amount = bucket.reduce((sum, b) => sum + outstandingFor(b), 0)
            return <button key={label} aria-pressed={agingFilter === index} onClick={() => { setAgingFilter(agingFilter === index ? null : index); setFilterStatus('') }} style={{ padding: 16, borderRadius: 12, textAlign: 'left', cursor: 'pointer', border: `1px solid ${agingFilter === index ? 'var(--color-accent)' : 'var(--color-border)'}`, background: agingFilter === index ? 'var(--color-accent-subtle)' : 'var(--color-bg-secondary)' }}>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
              <strong style={{ display: 'block', fontSize: 22, margin: '6px 0', color: index === 3 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{fmt(amount)}</strong>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{bucket.length} invoices</span>
            </button>
          })}
        </div>
      </section>

      <section className="card" style={{ padding: 20, marginBottom: 24 }} aria-label="Unbilled work">
        <h2 style={{ fontSize: 14, fontWeight: 700 }}>Unbilled Work</h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '8px 0 16px' }}>Trips available to invoice · {fmt(unbilledWork.projects.reduce((sum, project) => sum + project.billAmount, 0))} freight</p>
        {unbilledWork.legacyCount > 0 && <p style={{ padding: 12, borderRadius: 8, background: 'var(--color-warning-subtle)', color: 'var(--color-warning)', fontSize: 12, marginBottom: 16 }}>{unbilledWork.legacyCount} historical freight invoices have no trip links. Trips within their project and billing periods are held for reconciliation and excluded here.</p>}
        {unbilledWork.projects.length === 0 ? <p style={{ fontSize: 13 }}>No eligible unbilled trips.</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left' }}>Project</th><th>Trips</th><th>Weight (MT)</th><th>Freight</th><th>Action</th></tr></thead><tbody>{unbilledWork.projects.map(project => <tr key={project.projectId} style={{ borderTop: '1px solid var(--color-border)' }}><td style={{ padding: '14px 0' }}>{project.projectName}</td><td style={{ textAlign: 'center' }}>{project.totalTrips}</td><td style={{ textAlign: 'center' }}>{project.totalWeight}</td><td style={{ textAlign: 'center' }}>{fmt(project.billAmount)}</td><td style={{ textAlign: 'center' }}><BillForm projects={projects} initial={project} label="Build invoice" /></td></tr>)}</tbody></table></div>}
      </section>

      {/* ═══ ACTIONS: RECORD OVERALL PAYMENT & RECORD BILL & UNIFIED SINGLE EXPORT ═══ */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <OverallPaymentForm
          projects={projects}
          projectWise={projectWise}
          totalPending={summary.totalPending}
        />
        <BillForm projects={projects} />
        
        {/* STREAMLINED CSV EXPORT BUTTON */}
        <ExportCSVButton
          data={(() => {
            // Bill rows
            const rows = filteredBills.map(b => {
              const incRate = b.incentive || 0
              const weight = b.totalWeight || 0
              const baseRate = weight > 0 ? Math.round((b.billAmount / weight) * 100) / 100 : 0
              const incTotal = incentiveTotal(incRate, weight)
              const totalPayable = totalPayableFor(b)

              return {
                billNo: b.billNo,
                project: b.project.projectName,
                billType: b.billType === 'TOLL' ? 'Toll' : 'Freight',
                weight: b.billType === 'TOLL' ? '—' : (weight > 0 ? weight.toFixed(2) : '—'),
                baseRate: b.billType === 'TOLL' ? '—' : (baseRate > 0 ? `₹${baseRate}` : '—'),
                incentiveRate: b.billType === 'TOLL' ? '—' : (incRate > 0 ? `₹${incRate}` : '—'),
                baseAmount: b.billAmount,
                incentiveAmount: incTotal,
                totalBill: totalPayable,
                paymentReceived: b.payments.map(p => `${fmtDate(p.date)}: ${fmt(p.amount)}${p.referenceNo ? ` [${p.referenceNo}]` : ''}`).join(' ; '),
                totalReceived: b.receivedAmount as any,
                pending: outstandingFor(b) as any,
                status: b.status,
              }
            })

            // Calculate totals
            const totalBillSum = money(rows.reduce((s, r) => s + (typeof r.totalBill === 'number' ? r.totalBill : 0), 0))
            const totalReceivedSum = money(filteredBills.reduce((sum, bill) => sum + bill.receivedAmount, 0))
            const totalPendingSum = money(filteredBills.reduce((sum, bill) => sum + outstandingFor(bill), 0))

            // Add a blank separator row, then overall payment rows
            rows.push({
              billNo: '', project: '', billType: '', weight: '', baseRate: '', incentiveRate: '',
              baseAmount: '' as any, incentiveAmount: '' as any, totalBill: '' as any,
              paymentReceived: '', totalReceived: '', pending: '', status: '' as any,
            })

            // Summary row
            rows.push({
              billNo: '--- SUMMARY ---', project: '', billType: '', weight: '', baseRate: '', incentiveRate: '',
              baseAmount: '' as any, incentiveAmount: '' as any,
              totalBill: totalBillSum as any,
              paymentReceived: 'Payments allocated to filtered invoices',
              totalReceived: totalReceivedSum as any,
              pending: totalPendingSum as any,
              status: '' as any,
            })

            return rows
          })()}
          filename="receivables_report"
          columns={[
            { key: 'billNo', label: 'Bill No' },
            { key: 'project', label: 'Project' },
            { key: 'billType', label: 'Type' },
            { key: 'weight', label: 'Weight (MT)' },
            { key: 'baseRate', label: 'Base Rate (₹/MT)' },
            { key: 'incentiveRate', label: 'Incentive Rate (₹/MT)' },
            { key: 'baseAmount', label: 'Base Amount (₹)' },
            { key: 'incentiveAmount', label: 'Incentive Amount (₹)' },
            { key: 'totalBill', label: 'Total Bill (₹)' },
            { key: 'paymentReceived', label: 'Payment Received (Date & Amount)' },
            { key: 'totalReceived', label: 'Total Received (₹)' },
            { key: 'pending', label: 'Pending (₹)' },
            { key: 'status', label: 'Status' },
          ]}
        />
      </div>

      {/* ═══ FILTER BAR ═══ */}
      <div style={{
        ...card,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <input className="form-input" type="search" aria-label="Search invoice number or project" placeholder="Search invoice or project…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 240 }} />
        <select
          className="form-select"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          style={{ maxWidth: 220, fontSize: 12, padding: '8px 12px' }}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.projectName}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg-secondary)', padding: 4, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          {[
            { key: '', label: 'All' },
            { key: 'PENDING', label: '🟡 Pending' },
            { key: 'PARTIAL', label: '🟠 Partial' },
            { key: 'PAID', label: '🟢 Paid' },
            { key: 'OVERDUE', label: '🔴 Overdue' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 7,
                border: 'none', cursor: 'pointer',
                background: filterStatus === s.key ? '#8b5cf6' : 'transparent',
                color: filterStatus === s.key ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowOverallPayments(!showOverallPayments)}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(16,185,129,0.3)',
            background: showOverallPayments ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.06)',
            color: '#10b981',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          💳 {showOverallPayments ? 'Hide Overall Receipts' : `View Lump-Sum Receipts (${overallPayments.length})`}
        </button>

        <span style={{ fontSize: 11, color: '#64748b' }}>
          Showing {filteredBills.length} of {bills.length} bills
        </span>
      </div>

      {/* ═══ OVERALL LUMP-SUM PAYMENTS LOG CARD (TOGGLEABLE) ═══ */}
      {showOverallPayments && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'rgba(16,185,129,0.1)', padding: '5px 8px', borderRadius: 8 }}>🏦</span>
              Overall Lump-Sum Received Payments Log ({filteredOverallPayments.length})
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>
              Total Received: {fmt(totalOverallPaymentsSum)}
            </div>
          </div>

          {filteredOverallPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 12 }}>
              No overall payments recorded yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Date</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Project</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Amount Received</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Reference / UTR</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Description / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredOverallPayments.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', color: '#94a3b8' }}>{fmtDate(p.date)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', color: '#e2e8f0', fontWeight: 600 }}>{p.project?.projectName || 'All Projects'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', color: '#10b981', fontWeight: 800, fontSize: 14, textAlign: 'right' }}>{fmt(p.amount)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', color: '#8b5cf6', fontSize: 11 }}>{p.referenceNo || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', color: '#94a3b8', fontSize: 11 }}>{p.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700, color: '#94a3b8' }}>Total Lump-Sum Received</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#10b981', fontWeight: 900, fontSize: 15 }}>{fmt(totalOverallPaymentsSum)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* ═══ BILL LIST ═══ */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(139,92,246,0.1)', padding: '5px 8px', borderRadius: 8 }}>📋</span>
          Submitted Bills ({filteredBills.length})
        </div>

        {filteredBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📄</div>
            <div style={{ fontSize: 14 }}>No bills found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Record your first bill using the form above</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredBills.map(bill => {
              const sc = statusConfig[bill.status] || statusConfig.PENDING
              const isExpanded = expandedBill === bill.id
              const incRate = bill.incentive || 0
              const totalIncAmt = bill.totalWeight > 0 ? (incRate * bill.totalWeight) : incRate
              const totalPayable = Math.round(bill.billAmount + totalIncAmt)
              const pendingAmt = outstandingFor(bill)

              return (
                <div key={bill.id} style={{
                  background: isExpanded ? 'var(--color-bg-secondary)' : 'transparent',
                  borderRadius: 14,
                  border: isExpanded ? '1px solid rgba(139,92,246,0.15)' : '1px solid transparent',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}>
                  {/* Bill Row */}
                  <div
                    onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 110px 90px 90px 85px 85px',
                      gap: 8,
                      alignItems: 'center',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    {/* Bill Info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{bill.billNo}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                        }}>
                          {sc.emoji} {sc.label}
                        </span>
                        {bill.billType === 'TOLL' && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee',
                          }}>
                            🛣️ Toll Bill
                          </span>
                        )}
                        {incRate > 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981',
                          }}>
                            +{bill.totalWeight > 0 ? `₹${incRate}/MT (${fmt(totalIncAmt)})` : fmt(incRate)} Incentive
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {bill.project.projectName} · {fmtShort(bill.periodStart)}–{fmtShort(bill.periodEnd)}
                        {bill.billType === 'TOLL' ? <span> · Fixed Toll Bill</span> : bill.totalTrips > 0 ? <span> · {bill.totalTrips} trips</span> : null}
                      </div>
                      {bill.payments && bill.payments.length > 0 && (
                        <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 10 }}>💳 Paid:</span>
                          {bill.payments.map((p, idx) => (
                            <span key={p.id || idx} style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 6px', borderRadius: 6, fontSize: 10, color: '#10b981' }}>
                              {fmtShort(p.date)}: <strong>{fmt(p.amount)}</strong>{p.referenceNo ? ` [Ref: ${p.referenceNo}]` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bill Amount */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>{fmt(totalPayable)}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        {incRate > 0 ? `Base ${fmt(bill.billAmount)}` : 'Billed'}
                      </div>
                    </div>

                    {/* Received */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{fmt(bill.receivedAmount)}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        {bill.payments && bill.payments.length === 1 ? (
                          <span style={{ color: '#10b981' }}>on {fmtShort(bill.payments[0].date)}</span>
                        ) : bill.payments && bill.payments.length > 1 ? (
                          <span style={{ color: '#10b981' }}>{bill.payments.length} payments</span>
                        ) : (
                          'Received'
                        )}
                      </div>
                    </div>

                    {/* Pending */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: pendingAmt > 0 ? '#f97316' : '#10b981' }}>
                        {fmt(pendingAmt)}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Remaining</div>
                    </div>

                    {/* Due Date */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: bill.status === 'OVERDUE' ? '#ef4444' : '#64748b' }}>
                        {bill.dueDate ? fmtDate(bill.dueDate) : '—'}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div style={{ textAlign: 'center', display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingBill(bill) }}
                        style={{
                          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                          borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#a78bfa',
                          fontSize: 11, fontWeight: 600,
                        }}
                        title="Edit Bill"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(bill.id) }}
                        disabled={deletingId === bill.id}
                        style={{
                          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                          borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#ef4444',
                          fontSize: 11, fontWeight: 600,
                        }}
                        title="Delete Bill"
                      >
                        {deletingId === bill.id ? '...' : '🗑'}
                      </button>
                    </div>

                    {/* Expand icon */}
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', gridColumn: '-1', display: 'none' }}>
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Expanded Payment Section */}
                  {isExpanded && (
                    <div style={{ padding: '16px 20px' }}>
                      {bill.tripLinked && <div style={{ marginBottom: 16 }}><strong style={{ fontSize: 13 }}>Linked trips ({bill.trips?.length || 0})</strong><ul style={{ marginTop: 8, fontSize: 12, listStyle: 'none' }}>{bill.trips?.map(trip => <li key={trip.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>{fmtDate(trip.date)} · {trip.vehicle.plateNo} · {trip.weight} MT · {fmt(trip.partyFreightAmount)}</li>)}</ul></div>}
                      {!bill.tripLinked && bill.billType !== 'TOLL' && <p style={{ fontSize: 12, color: 'var(--color-warning)', marginBottom: 12 }}>Historical invoice — trip allocation needs review.</p>}
                      {/* Bill Details */}
                      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                        {incRate > 0 && (
                          <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                            Base Billed: {fmt(bill.billAmount)} + Incentive: {bill.totalWeight > 0 ? `${bill.totalWeight} MT × ₹${incRate}/MT = ${fmt(totalIncAmt)}` : fmt(incRate)} ➔ Total: {fmt(totalPayable)}
                          </div>
                        )}
                        {bill.submittedAt && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Submitted: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{fmtDate(bill.submittedAt)}</span>
                          </div>
                        )}
                        {bill.totalWeight > 0 && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Weight: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{bill.totalWeight.toFixed(2)} MT</span>
                          </div>
                        )}
                        {bill.remarks && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Remarks: <span style={{ color: '#94a3b8' }}>{bill.remarks}</span>
                          </div>
                        )}
                      </div>

                      {/* Payment Form + History */}
                      <PaymentForm
                        billId={bill.id}
                        payments={bill.payments}
                        billAmount={totalPayable}
                        receivedAmount={bill.receivedAmount}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          isOpen={!!editingBill}
          onClose={() => setEditingBill(null)}
        />
      )}
    </div>
  )
}
