'use client'
import { useState, useMemo } from 'react'
import { type AnalyticsData } from '@/lib/actions/analytics'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const card: React.CSSProperties = {
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 20, marginBottom: 16,
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getIntensity(trips: number, max: number) {
  if (trips === 0) return 0
  return Math.ceil((trips / max) * 4)  // 1–4
}

const INTENSITY_COLORS = ['', 'rgba(59,130,246,0.15)', 'rgba(59,130,246,0.35)', 'rgba(59,130,246,0.65)', '#3b82f6']

export default function ActivityTab({ data }: { data: AnalyticsData }) {
  const [view, setView] = useState<'heatmap' | 'calendar' | 'table'>('heatmap')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('__all__')
  const [metric, setMetric] = useState<'trips' | 'weight' | 'revenue'>('trips')

  const raw = data.dailyTripsByVehicle
  const plates = useMemo(() => [...new Set(raw.map(r => r.plateNo))].sort(), [raw])
  const dates = useMemo(() => [...new Set(raw.map(r => r.date))].sort(), [raw])

  // Filter by vehicle
  const filtered = selectedVehicle === '__all__' ? raw : raw.filter(r => r.plateNo === selectedVehicle)

  // Aggregate: date → { trips, weight, revenue }
  const byDate = useMemo(() => {
    const m: Record<string, { trips: number; weight: number; revenue: number }> = {}
    filtered.forEach(r => {
      if (!m[r.date]) m[r.date] = { trips: 0, weight: 0, revenue: 0 }
      m[r.date].trips += r.trips
      m[r.date].weight += r.weight
      m[r.date].revenue += r.revenue
    })
    return m
  }, [filtered])

  const maxVal = Math.max(...Object.values(byDate).map(d => d[metric]), 1)

  // Per-vehicle summary
  const vehicleSummary = useMemo(() => {
    const m: Record<string, { plateNo: string; trips: number; weight: number; revenue: number; days: number; lastDate: string }> = {}
    raw.forEach(r => {
      if (!m[r.plateNo]) m[r.plateNo] = { plateNo: r.plateNo, trips: 0, weight: 0, revenue: 0, days: 0, lastDate: '' }
      m[r.plateNo].trips += r.trips
      m[r.plateNo].weight += r.weight
      m[r.plateNo].revenue += r.revenue
      m[r.plateNo].days += 1
      if (r.date > m[r.plateNo].lastDate) m[r.plateNo].lastDate = r.date
    })
    return Object.values(m).sort((a, b) => b.trips - a.trips)
  }, [raw])

  // Calendar grid: weeks × days
  const calendarData = useMemo(() => {
    if (dates.length === 0) return []
    const first = new Date(dates[0])
    const last = new Date(dates[dates.length - 1])
    // Go back to previous Monday
    const startDay = new Date(first)
    const dow = startDay.getDay()
    startDay.setDate(startDay.getDate() - (dow === 0 ? 6 : dow - 1))

    const weeks: { date: string; val: number; isInRange: boolean }[][] = []
    let week: { date: string; val: number; isInRange: boolean }[] = []
    const cur = new Date(startDay)
    while (cur <= last || week.length > 0) {
      const dateStr = cur.toISOString().split('T')[0]
      const val = byDate[dateStr]?.[metric] || 0
      week.push({ date: dateStr, val, isInRange: cur >= first && cur <= last })
      if (week.length === 7) { weeks.push(week); week = [] }
      cur.setDate(cur.getDate() + 1)
      if (cur > last && week.length > 0) {
        while (week.length < 7) week.push({ date: '', val: 0, isInRange: false })
        weeks.push(week); break
      }
    }
    return weeks
  }, [byDate, dates, metric])

  const tabBtn = (v: string, cur: string, set: (s: any) => void, label: string) => (
    <button onClick={() => set(v)} style={{
      padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
      border: cur === v ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--color-border)',
      background: cur === v ? 'rgba(59,130,246,0.08)' : 'transparent',
      color: cur === v ? '#3b82f6' : 'var(--color-text-muted)',
    }}>{label}</button>
  )

  const metricLabel = metric === 'trips' ? 'Trips' : metric === 'weight' ? 'MT' : '₹'

  return (
    <>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { icon: '📅', label: 'Active Days', val: dates.length, color: 'accent' },
          { icon: '🚛', label: 'Vehicles Active', val: plates.length, color: 'info' },
          { icon: '🛣️', label: 'Total Trips', val: data.totalTrips, color: 'success' },
          { icon: '⚖️', label: 'Avg Trips/Day', val: dates.length > 0 ? (data.totalTrips / dates.length).toFixed(1) : 0, color: 'warning' },
        ].map(k => (
          <div key={k.label} className={`analytics-kpi ${k.color}`}>
            <div className="analytics-kpi-icon">{k.icon}</div>
            <div className="analytics-kpi-body">
              <div className="analytics-kpi-value">{k.val}</div>
              <div className="analytics-kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle quick-select pills */}
      <div style={{ ...card, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Filter Vehicle
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          <button onClick={() => setSelectedVehicle('__all__')} style={{
            padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: selectedVehicle === '__all__' ? '1px solid #10b981' : '1px solid var(--color-border)',
            background: selectedVehicle === '__all__' ? 'rgba(16,185,129,0.1)' : 'transparent',
            color: selectedVehicle === '__all__' ? '#10b981' : 'var(--color-text-muted)',
          }}>All Vehicles</button>
          {plates.map(p => (
            <button key={p} onClick={() => setSelectedVehicle(p)} style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: selectedVehicle === p ? '1px solid #3b82f6' : '1px solid var(--color-border)',
              background: selectedVehicle === p ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: selectedVehicle === p ? '#3b82f6' : 'var(--color-text-secondary)',
            }}>🚛 {p}</button>
          ))}
        </div>
      </div>

      {/* View switcher */}
      <div style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            📅 Activity{selectedVehicle !== '__all__' ? ` · ${selectedVehicle}` : ' · All Vehicles'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
              {tabBtn('trips', metric, setMetric, 'Trips')}
              {tabBtn('weight', metric, setMetric, 'Weight')}
              {tabBtn('revenue', metric, setMetric, 'Revenue')}
            </div>
            {tabBtn('heatmap', view, setView, '🟦 Heatmap')}
            {tabBtn('calendar', view, setView, '📆 Calendar')}
            {tabBtn('table', view, setView, '📋 Table')}
          </div>
        </div>

        {/* ── HEATMAP VIEW: vehicles × dates ── */}
        {view === 'heatmap' && (
          <>
            {raw.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No trip data for this period</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  {/* Date headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${dates.length}, 1fr)`, gap: 2, minWidth: dates.length * 32 + 120 }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }} />
                    {dates.map(d => {
                      const parts = d.split('-')
                      return (
                        <div key={d} style={{ fontSize: 9, color: 'var(--color-text-muted)', textAlign: 'center', writingMode: 'vertical-rl' as const, transform: 'rotate(180deg)', height: 40, lineHeight: 1 }}>
                          {`${parts[2]}/${parts[1]}`}
                        </div>
                      )
                    })}
                  </div>
                  {/* Vehicle rows */}
                  {(selectedVehicle === '__all__' ? plates : [selectedVehicle]).map(plate => {
                    const rowData = raw.filter(r => r.plateNo === plate)
                    const rowByDate: Record<string, typeof rowData[0]> = {}
                    rowData.forEach(r => { rowByDate[r.date] = r })
                    const rowMax = Math.max(...rowData.map(r => r[metric]), 1)
                    return (
                      <div key={plate} style={{ display: 'grid', gridTemplateColumns: `120px repeat(${dates.length}, 1fr)`, gap: 2, marginTop: 3, minWidth: dates.length * 32 + 120, alignItems: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', paddingRight: 8, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>🚛 {plate}</div>
                        {dates.map(d => {
                          const cell = rowByDate[d]
                          const val = cell?.[metric] || 0
                          const intensity = getIntensity(val, rowMax)
                          const bg = INTENSITY_COLORS[intensity] || 'rgba(255,255,255,0.03)'
                          return (
                            <div key={d} title={val > 0 ? `${d}: ${metric === 'revenue' ? fmt(val) : val + (metric === 'weight' ? ' MT' : ' trip' + (val > 1 ? 's' : ''))}` : `${d}: No trips`} style={{
                              height: 24, borderRadius: 4, background: bg,
                              border: '1px solid rgba(255,255,255,0.04)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, color: intensity >= 3 ? '#fff' : 'transparent',
                              cursor: 'default',
                            }}>
                              {intensity >= 3 ? val : ''}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  {/* Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Less</span>
                    {INTENSITY_COLORS.map((c, i) => (
                      <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c || 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
                    ))}
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>More</span>
                  </div>
                </div>
              )}
          </>
        )}

        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (
          <>
            {calendarData.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No trip data for this period</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  {/* Day labels */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                    {DAY_LABELS.map(d => <div key={d} style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center' }}>{d}</div>)}
                  </div>
                  {calendarData.map((week, wi) => (
                    <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                      {week.map((cell, di) => {
                        const intensity = cell.isInRange ? getIntensity(cell.val, maxVal) : 0
                        const bg = INTENSITY_COLORS[intensity] || 'rgba(255,255,255,0.02)'
                        const d = cell.date ? cell.date.split('-') : []
                        return (
                          <div key={di} title={cell.date && cell.val > 0 ? `${cell.date}: ${metric === 'revenue' ? fmt(cell.val) : cell.val + (metric === 'weight' ? ' MT' : ' trips')}` : cell.date || ''} style={{
                            height: 44, borderRadius: 6, background: cell.isInRange ? bg : 'transparent',
                            border: cell.isInRange ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                          }}>
                            {cell.date && <div style={{ fontSize: 10, color: intensity > 0 ? '#fff' : 'var(--color-text-muted)', fontWeight: intensity > 0 ? 700 : 400 }}>{d[2]}</div>}
                            {cell.val > 0 && (
                              <div style={{ fontSize: 9, fontWeight: 800, color: intensity >= 3 ? '#fff' : '#3b82f6' }}>
                                {metric === 'revenue' ? `₹${Math.round(cell.val / 1000)}k` : cell.val + (metric === 'weight' ? 'T' : 't')}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  {/* Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Less</span>
                    {INTENSITY_COLORS.map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c || 'rgba(255,255,255,0.03)' }} />)}
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>More</span>
                  </div>
                </div>
              )}
          </>
        )}

        {/* ── TABLE VIEW ── */}
        {view === 'table' && (
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th style={{ textAlign: 'right' }}>Trips</th>
                  <th style={{ textAlign: 'right' }}>Weight (MT)</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No data</td></tr>
                  : [...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12 }}>{r.date.split('-').reverse().join('/')}</td>
                      <td><strong>{r.plateNo}</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{r.trips}</span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>{r.weight.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{fmt(r.revenue)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-vehicle summary cards */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🚛 Per-Vehicle Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
          {vehicleSummary.map((v, i) => {
            const avgTripsPerDay = v.days > 0 ? (v.trips / v.days).toFixed(1) : '0'
            const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']
            const c = colors[i % colors.length]
            return (
              <div key={v.plateNo} style={{ background: 'var(--color-bg-primary)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${c}25` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)' }}>🚛 {v.plateNo}</div>
                  <div style={{ fontSize: 11, color: c, fontWeight: 700, background: `${c}15`, padding: '2px 8px', borderRadius: 20 }}>{v.trips} trips</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Active Days', val: v.days },
                    { label: 'Avg/Day', val: `${avgTripsPerDay} trips` },
                    { label: 'Total Weight', val: `${v.weight.toFixed(0)} MT` },
                    { label: 'Revenue', val: fmt(v.revenue) },
                  ].map(k => (
                    <div key={k.label} style={{ background: `${c}08`, borderRadius: 6, padding: '6px 8px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: c }}>{k.val}</div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' as const, marginTop: 2 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: 'var(--color-text-muted)' }}>
                  Last trip: {v.lastDate.split('-').reverse().join('/')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
