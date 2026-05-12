'use client'
import { useState } from 'react'
import type { BillSummary } from '@/lib/actions/billing'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const fmtD = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

interface Props { bill: BillSummary }

export default function BillOutput({ bill }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  async function handlePdf(ownerName?: string) {
    setPdfLoading(ownerName ?? 'all')
    const { generateBillPdf } = await import('@/lib/billPdf')
    generateBillPdf(bill, ownerName)
    setPdfLoading(null)
  }

  const S: Record<string, React.CSSProperties> = {
    card: { background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
    hdr: { padding: '16px 20px', background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 },
    row: { display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' as const },
    chip: (c: string) => ({ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c + '15', color: c }),
    vRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
    expHdr: { padding: '20px', background: '#0b1120', borderTop: '1px solid rgba(255,255,255,0.06)' },
    tbl: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
    th: { padding: '8px 12px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    td: { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8' },
    summBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b1120', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' as const, gap: 12 },
  }

  return (
    <div>
      {/* Grand Total */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Overall Settlement</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{bill.period.label} · {bill.grandTotal.trips} trips · {bill.grandTotal.weight.toFixed(1)} MT</div>
          </div>
          <button onClick={() => handlePdf()} disabled={pdfLoading === 'all'} style={{ padding: '10px 20px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {pdfLoading === 'all' ? '⏳' : '📥'} Export All PDF
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'Gross Payout', value: fmt(bill.grandTotal.grossPayout), color: '#f59e0b' },
            { label: 'Deductions', value: fmt(bill.grandTotal.totalDeductions), color: '#ef4444' },
            { label: 'Net Settlement', value: fmt(bill.grandTotal.netSettlement), color: '#10b981' },
            { label: 'Already Paid', value: fmt(bill.grandTotal.totalPreviouslyPaid), color: '#f97316' },
            { label: 'Balance Due', value: fmt(bill.grandTotal.totalBalanceDue), color: bill.grandTotal.totalBalanceDue < 0 ? '#ef4444' : '#22d3ee' },
          ].map(b => (
            <div key={b.label} style={{ background: '#0b1120', borderRadius: 10, padding: '14px 16px', border: `1px solid ${b.color}22` }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{b.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: b.color }}>{b.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per owner */}
      {bill.ownerSummaries.map(owner => (
        <div key={owner.ownerId} style={S.card}>
          <div style={S.hdr}>
            <div style={S.row}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧑</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{owner.ownerName}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{owner.vehicles.length} vehicle(s) · {owner.vehicles.reduce((a, v) => a + v.totalTrips, 0)} trips</div>
              </div>
            </div>
            <div style={S.row}>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: '#64748b' }}>Gross</div><div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>{fmt(owner.totalGross)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: '#64748b' }}>Deductions</div><div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>−{fmt(owner.totalDeductions)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: '#64748b' }}>Net</div><div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>{fmt(owner.totalNet)}</div></div>
              {owner.totalPreviouslyPaid > 0 && <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: '#64748b' }}>Paid</div><div style={{ fontSize: 15, fontWeight: 700, color: '#f97316' }}>−{fmt(owner.totalPreviouslyPaid)}</div></div>}
              <div style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, padding: '8px 14px', textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#22d3ee', fontWeight: 700 }}>BALANCE DUE</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: owner.totalBalanceDue < 0 ? '#ef4444' : '#22d3ee' }}>{fmt(owner.totalBalanceDue)}</div>
              </div>
              <button onClick={() => handlePdf(owner.ownerName)} disabled={pdfLoading === owner.ownerName} style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                {pdfLoading === owner.ownerName ? '⏳' : '📄'} PDF
              </button>
            </div>
          </div>

          {/* Vehicles */}
          {owner.vehicles.map(v => (
            <div key={v.vehicleId}>
              <div style={S.vRow} onClick={() => setExpanded(expanded === v.vehicleId ? null : v.vehicleId)}>
                <div style={S.row}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>🚛 {v.plateNo}</span>
                  <span style={S.chip('#3b82f6')}>₹{v.effectiveOwnerRate}/MT</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{v.totalTrips} trips · {v.totalWeight.toFixed(1)} MT</span>
                </div>
                <div style={S.row}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(v.grossPayout)}</span>
                  <span style={{ color: '#ef4444' }}>−{fmt(v.deductions.total)}</span>
                  <span style={{ color: '#10b981', fontWeight: 800 }}>{fmt(v.netSettlement)}</span>
                  {v.previouslyPaid > 0 && <span style={{ color: '#f97316' }}>−{fmt(v.previouslyPaid)}</span>}
                  <span style={{ color: v.balanceDue < 0 ? '#ef4444' : '#22d3ee', fontWeight: 900, minWidth: 80, textAlign: 'right' }}>{fmt(v.balanceDue)}</span>
                  <span style={{ color: '#64748b', fontSize: 11 }}>{expanded === v.vehicleId ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === v.vehicleId && (
                <div style={S.expHdr}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Trips */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>🟢 Trip Earnings</div>
                      <table style={S.tbl}>
                        <thead><tr><th style={S.th}>Date</th><th style={S.th}>Inv/LR</th><th style={{ ...S.th, textAlign: 'right' }}>Weight</th><th style={{ ...S.th, textAlign: 'right' }}>Payout</th></tr></thead>
                        <tbody>
                          {v.trips.map(t => (
                            <tr key={t.id}>
                              <td style={S.td}>{fmtD(t.date)}</td>
                              <td style={{ ...S.td, color: '#64748b' }}>{t.invoiceNo || t.lrNo || '—'}</td>
                              <td style={{ ...S.td, textAlign: 'right' }}>{t.weight.toFixed(2)} MT</td>
                              <td style={{ ...S.td, textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>{fmt(t.ownerPayout)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr><td colSpan={3} style={{ ...S.td, fontWeight: 700, color: '#94a3b8' }}>Total</td><td style={{ ...S.td, textAlign: 'right', color: '#f59e0b', fontWeight: 800 }}>{fmt(v.grossPayout)}</td></tr></tfoot>
                      </table>
                    </div>

                    {/* Deductions */}
                    <div>
                      {v.deductions.items.length > 0 && (
                        <>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>🔴 Deductions</div>
                          <table style={S.tbl}>
                            <thead><tr><th style={S.th}>Date</th><th style={S.th}>Item</th><th style={{ ...S.th, textAlign: 'right' }}>Amount</th></tr></thead>
                            <tbody>
                              {v.deductions.items.map((d, i) => (
                                <tr key={i}><td style={S.td}>{fmtD(d.date)}</td><td style={S.td}>{d.label}{d.note && <span style={{ color: '#64748b' }}> · {d.note}</span>}</td><td style={{ ...S.td, textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>−{fmt(d.amount)}</td></tr>
                              ))}
                            </tbody>
                            <tfoot><tr><td colSpan={2} style={{ ...S.td, fontWeight: 700, color: '#94a3b8' }}>Total Deductions</td><td style={{ ...S.td, textAlign: 'right', color: '#ef4444', fontWeight: 800 }}>−{fmt(v.deductions.total)}</td></tr></tfoot>
                          </table>
                        </>
                      )}
                      {v.paidItems.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>🟠 Already Paid</div>
                          <table style={S.tbl}>
                            <tbody>
                              {v.paidItems.map((p, i) => (
                                <tr key={i}><td style={S.td}>{fmtD(p.date)}</td><td style={S.td}>{p.label}</td><td style={{ ...S.td, textAlign: 'right', color: '#f97316', fontWeight: 700 }}>−{fmt(p.amount)}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Net bar */}
                  <div style={S.summBar}>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div><span style={{ fontSize: 11, color: '#64748b' }}>Net Settlement </span><span style={{ color: '#10b981', fontWeight: 700 }}>{fmt(v.netSettlement)}</span></div>
                      {v.previouslyPaid > 0 && <div><span style={{ fontSize: 11, color: '#64748b' }}>Less Paid </span><span style={{ color: '#f97316', fontWeight: 700 }}>−{fmt(v.previouslyPaid)}</span></div>}
                    </div>
                    <div style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 8, padding: '6px 16px' }}>
                      <span style={{ fontSize: 11, color: '#22d3ee', fontWeight: 700 }}>BALANCE DUE  </span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: v.balanceDue < 0 ? '#ef4444' : '#22d3ee' }}>{fmt(v.balanceDue)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
