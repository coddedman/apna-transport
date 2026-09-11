'use client'
import { useState } from 'react'
import type { BillSummary } from '@/lib/actions/billing'
import type { PdfMode } from '@/lib/billPdf'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const fmtD = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

interface Props { bill: BillSummary }

export default function BillOutput({ bill }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  async function handlePdf(mode: PdfMode, ownerName?: string) {
    const key = `${mode}-${ownerName ?? 'all'}`
    setPdfLoading(key)
    const { generateBillPdf } = await import('@/lib/billPdf')
    generateBillPdf(bill, ownerName, mode)
    setPdfLoading(null)
  }

  const PdfBtn = ({ mode, label, ownerName }: { mode: PdfMode; label: string; ownerName?: string }) => {
    const key = `${mode}-${ownerName ?? 'all'}`
    const colors: Record<PdfMode, string> = { full: '#f59e0b', trips: '#10b981', expenses: '#ef4444', advances: '#f97316' }
    const c = colors[mode]
    return (
      <button onClick={() => handlePdf(mode, ownerName)} disabled={pdfLoading === key}
        style={{ padding: '6px 12px', background: `${c}18`, color: c, border: `1px solid ${c}33`, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>
        {pdfLoading === key ? '⏳' : '📄'} {label}
      </button>
    )
  }

  return (
    <div>
      {/* ── Grand Total ── */}
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Overall Settlement</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{bill.period.label} · {bill.grandTotal.trips} trips · {bill.grandTotal.weight.toFixed(1)} MT</div>
          </div>
          <PdfBtn mode="full" label="Export All PDF" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'Gross Payout', value: fmt(bill.grandTotal.grossPayout), color: '#f59e0b' },
            { label: 'Deductions', value: fmt(bill.grandTotal.totalDeductions), color: '#ef4444' },
            { label: 'Net Settlement', value: fmt(bill.grandTotal.netSettlement), color: '#10b981' },
            { label: 'Advances Paid', value: fmt(bill.grandTotal.totalAdvancesPaid), color: '#f97316' },
            { label: 'Balance Due', value: fmt(bill.grandTotal.totalBalanceDue), color: bill.grandTotal.totalBalanceDue < 0 ? '#ef4444' : '#22d3ee' },
          ].map(b => (
            <div key={b.label} style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${b.color}22` }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{b.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: b.color }}>{b.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Per Owner ── */}
      {bill.ownerSummaries.map(owner => {
        const allAdvTotal = owner.ownerAdvanceItems.reduce((s, a) => s + a.amount, 0)

        return (
        <div key={owner.ownerId} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, marginBottom: 20, overflow: 'hidden' }}>

          {/* Owner Header */}
          <div style={{ padding: '16px 20px', background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧑</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{owner.ownerName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{owner.vehicles.length} vehicle(s) · {owner.vehicles.reduce((a, v) => a + v.totalTrips, 0)} trips</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <PdfBtn mode="full" label="Full" ownerName={owner.ownerName} />
                <PdfBtn mode="trips" label="Trips" ownerName={owner.ownerName} />
                <PdfBtn mode="expenses" label="Expenses" ownerName={owner.ownerName} />
                <PdfBtn mode="advances" label="Advances" ownerName={owner.ownerName} />
              </div>
            </div>

            {/* ── Step-by-step Balance Due Calculation ── */}
            <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                How Balance Due is Calculated
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {/* Step 1 */}
                  <tr>
                    <td style={{ padding: '6px 0', color: '#94a3b8', width: '50%' }}>
                      <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', textAlign: 'center', lineHeight: '22px', fontSize: 11, fontWeight: 800, marginRight: 8 }}>A</span>
                      Gross Payout (Weight × Rate)
                    </td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#f59e0b', fontWeight: 800, fontSize: 15 }}>{fmt(owner.totalGross)}</td>
                  </tr>
                  {/* Step 2 */}
                  <tr>
                    <td style={{ padding: '6px 0', color: '#94a3b8' }}>
                      <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.12)', color: '#ef4444', textAlign: 'center', lineHeight: '22px', fontSize: 11, fontWeight: 800, marginRight: 8 }}>B</span>
                      Deductions (Fuel, Toll, Maint, etc.)
                    </td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>−{fmt(owner.totalDeductions)}</td>
                  </tr>
                  {/* Step 3 — Net */}
                  <tr style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 0', color: '#e2e8f0', fontWeight: 700 }}>
                      <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981', textAlign: 'center', lineHeight: '22px', fontSize: 11, fontWeight: 800, marginRight: 8 }}>C</span>
                      Net Settlement (A − B)
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: '#10b981', fontWeight: 800, fontSize: 15 }}>{fmt(owner.totalNet)}</td>
                  </tr>
                  {/* Step 4 — Advances */}
                  <tr>
                    <td style={{ padding: '6px 0', color: '#94a3b8' }}>
                      <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: 'rgba(249,115,22,0.12)', color: '#f97316', textAlign: 'center', lineHeight: '22px', fontSize: 11, fontWeight: 800, marginRight: 8 }}>D</span>
                      Advances Already Paid (Unrecovered)
                      {allAdvTotal !== owner.ownerAdvanceTotal && (
                        <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                          (of {fmt(allAdvTotal)} total given, {fmt(allAdvTotal - owner.ownerAdvanceTotal)} was recovered in prior bills)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#f97316', fontWeight: 700 }}>−{fmt(owner.ownerAdvanceTotal)}</td>
                  </tr>
                  {/* Step 5 — Carry Forward */}
                  {owner.carryForwardBalance !== 0 && (
                    <tr>
                      <td style={{ padding: '6px 0', color: '#94a3b8' }}>
                        <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: owner.carryForwardBalance < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,211,238,0.12)', color: owner.carryForwardBalance < 0 ? '#ef4444' : '#22d3ee', textAlign: 'center', lineHeight: '22px', fontSize: 11, fontWeight: 800, marginRight: 8 }}>E</span>
                        {owner.carryForwardBalance < 0 ? 'Prior Debt Carried Forward (Owner Owes)' : 'Prior Credit Carried Forward (We Owe)'}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', color: owner.carryForwardBalance < 0 ? '#ef4444' : '#22d3ee', fontWeight: 700 }}>
                        {owner.carryForwardBalance < 0 ? `−${fmt(Math.abs(owner.carryForwardBalance))}` : `+${fmt(owner.carryForwardBalance)}`}
                      </td>
                    </tr>
                  )}
                  {/* Final — Balance Due */}
                  <tr style={{ borderTop: '2px solid rgba(34,211,238,0.3)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 800, fontSize: 14, color: owner.totalBalanceDue < 0 ? '#ef4444' : '#22d3ee' }}>
                      {owner.carryForwardBalance !== 0
                        ? `Balance Due (C − D + E)`
                        : `Balance Due (C − D)`
                      }
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 900, fontSize: 20, color: owner.totalBalanceDue < 0 ? '#ef4444' : '#22d3ee' }}>
                      {fmt(owner.totalBalanceDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Owner Advances Section (cumulative, all vehicles) */}
          {owner.ownerAdvanceItems.length > 0 && (
            <div style={{ padding: '12px 20px', background: 'rgba(249,115,22,0.04)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                🏦 Owner Advances — All Time Total: {fmt(allAdvTotal)}
                {allAdvTotal !== owner.ownerAdvanceTotal && (
                  <span style={{ color: '#64748b', fontWeight: 600, marginLeft: 8 }}>
                    · Unrecovered (applicable this bill): {fmt(owner.ownerAdvanceTotal)}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {owner.ownerAdvanceItems.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ color: '#94a3b8' }}>{fmtD(a.date)}</span>
                    <span style={{ color: '#f97316', fontWeight: 700, marginLeft: 8 }}>{fmt(a.amount)}</span>
                    {a.note && <span style={{ color: '#64748b', marginLeft: 6 }}>· {a.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles */}
          {owner.vehicles.map(v => (
            <div key={v.vehicleId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}
                onClick={() => setExpanded(expanded === v.vehicleId ? null : v.vehicleId)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>🚛 {v.plateNo}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#3b82f618', color: '#3b82f6' }}>₹{v.effectiveOwnerRate}/MT</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{v.totalTrips} trips · {v.totalWeight.toFixed(1)} MT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(v.grossPayout)}</span>
                  {v.deductions.total > 0 && <span style={{ color: '#ef4444' }}>−{fmt(v.deductions.total)}</span>}
                  <span style={{ color: '#10b981', fontWeight: 800 }}>{fmt(v.netSettlement)}</span>
                  <span style={{ color: '#64748b', fontSize: 11 }}>{expanded === v.vehicleId ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === v.vehicleId && (
                <div style={{ padding: 20, background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: v.deductions.items.length > 0 ? '1fr 1fr' : '1fr', gap: 20 }}>
                    {/* Trips */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>🟢 Trip Earnings</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead><tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Date</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Inv/LR</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Weight</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Payout</th>
                        </tr></thead>
                        <tbody>
                          {v.trips.map(t => (
                            <tr key={t.id}>
                              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#94a3b8' }}>{fmtD(t.date)}</td>
                              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#64748b' }}>{t.invoiceNo || t.lrNo || '—'}</td>
                              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#94a3b8', textAlign: 'right' }}>{t.weight.toFixed(2)} MT</td>
                              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#f59e0b', fontWeight: 700, textAlign: 'right' }}>{fmt(t.ownerPayout)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr>
                          <td colSpan={3} style={{ padding: '8px 12px', fontWeight: 700, color: '#94a3b8' }}>Total</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f59e0b', fontWeight: 800 }}>{fmt(v.grossPayout)}</td>
                        </tr></tfoot>
                      </table>
                    </div>

                    {/* Deductions */}
                    {v.deductions.items.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>🔴 Deductions</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead><tr>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Date</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Item</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid var(--color-border)' }}>Amount</th>
                          </tr></thead>
                          <tbody>
                            {v.deductions.items.map((d, i) => (
                              <tr key={i}>
                                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#94a3b8' }}>{fmtD(d.date)}</td>
                                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#94a3b8' }}>{d.label}{d.note && <span style={{ color: '#64748b' }}> · {d.note}</span>}</td>
                                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: '#ef4444', fontWeight: 700, textAlign: 'right' }}>−{fmt(d.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot><tr>
                            <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 700, color: '#94a3b8' }}>Total Deductions</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#ef4444', fontWeight: 800 }}>−{fmt(v.deductions.total)}</td>
                          </tr></tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Vehicle net bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, padding: '10px 0' }}>
                    <div><span style={{ fontSize: 12, color: '#64748b' }}>Vehicle Net: </span><span style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{fmt(v.netSettlement)}</span></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        )
      })}
    </div>
  )
}
