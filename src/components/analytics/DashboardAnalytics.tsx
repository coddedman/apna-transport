'use client'

import { useState, useTransition, useCallback } from 'react'
import { fetchAnalytics, type AnalyticsData, type AnalyticsFilters } from '@/lib/actions/analytics'
import { useLoading } from '@/lib/context/LoadingContext'

// ============================================
// Mini Chart Components (Pure CSS, no library)
// ============================================

function BarChart({ data, color = 'var(--color-accent)', height = 200 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="analytics-chart-container" style={{ height }}>
      <div className="analytics-bar-chart">
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)
          return (
            <div key={i} className="analytics-bar-col">
              <div className="analytics-bar-tooltip">
                {typeof d.value === 'number' && d.value >= 1000 ? `₹${d.value.toLocaleString('en-IN')}` : d.value.toLocaleString('en-IN')}
              </div>
              <div
                className="analytics-bar"
                style={{
                  height: `${barH}%`,
                  background: d.value === 0 ? 'rgba(255,255,255,0.04)' : color,
                }}
              />
              <span className="analytics-bar-label">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AreaChart({ data, color = 'var(--color-accent)', height = 200 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const pad = 4
  const w = 100
  const h = 100

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - 2 * pad)
    const y = h - pad - (d.value / max) * (h - 2 * pad)
    return `${x},${y}`
  })
  const lineStr = points.join(' ')
  const areaStr = `${pad},${h - pad} ${lineStr} ${w - pad},${h - pad}`

  return (
    <div className="analytics-chart-container" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="analytics-area-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaStr} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, '')})`} />
        <polyline points={lineStr} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * (w - 2 * pad)
          const y = h - pad - (d.value / max) * (h - 2 * pad)
          return d.value > 0 ? <circle key={i} cx={x} cy={y} r="1.2" fill={color} className="analytics-dot" /> : null
        })}
      </svg>
      <div className="analytics-area-labels">
        {data.filter((_, i) => i % Math.max(Math.floor(data.length / 7), 1) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} className="analytics-bar-label">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1
  const radius = 36
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="analytics-donut-wrapper">
      <svg width={size} height={size} viewBox="0 0 100 100" className="analytics-donut-svg">
        {data.map((d, i) => {
          const pct = d.value / total
          const dashLen = circumference * pct
          const dashGap = circumference - dashLen
          const currentOffset = offset
          offset += dashLen
          return (
            <circle
              key={i}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="10"
              strokeDasharray={`${dashLen} ${dashGap}`}
              strokeDashoffset={-currentOffset}
              className="analytics-donut-segment"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          )
        })}
        <text x="50" y="46" textAnchor="middle" fill="var(--color-text-primary)" fontSize="10" fontWeight="800">
          ₹{total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString('en-IN')}
        </text>
        <text x="50" y="58" textAnchor="middle" fill="var(--color-text-muted)" fontSize="5">
          Total
        </text>
      </svg>
      <div className="analytics-donut-legend">
        {data.map((d, i) => (
          <div key={i} className="analytics-legend-row">
            <span className="analytics-legend-dot" style={{ background: d.color }} />
            <span className="analytics-legend-label">{d.label}</span>
            <span className="analytics-legend-value">₹{d.value.toLocaleString('en-IN')}</span>
            <span className="analytics-legend-pct">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBar({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1)
  return (
    <div className="analytics-hbar-list">
      {data.map((d, i) => (
        <div key={i} className="analytics-hbar-item">
          <div className="analytics-hbar-header">
            <span className="analytics-hbar-label">{d.label}</span>
            <span className="analytics-hbar-value">₹{d.value.toLocaleString('en-IN')}</span>
          </div>
          <div className="analytics-hbar-track">
            <div
              className="analytics-hbar-fill"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%`, background: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ===========================
// Tab Definitions
// ===========================

type TabKey = 'overview' | 'revenue' | 'expenses' | 'vehicles' | 'projects' | 'owners'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'revenue', label: 'Revenue', icon: '💰' },
  { key: 'expenses', label: 'Expenses', icon: '📉' },
  { key: 'vehicles', label: 'Vehicles', icon: '🚛' },
  { key: 'projects', label: 'Projects', icon: '📁' },
  { key: 'owners', label: 'Owners', icon: '👤' },
]

const PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
]

const CHART_TYPES = [
  { key: 'revenue', label: 'Revenue', icon: '💰' },
  { key: 'trips', label: 'Trips', icon: '🛣️' },
  { key: 'expenses', label: 'Expenses', icon: '📉' },
  { key: 'weight', label: 'Weight', icon: '⚖️' },
]

const expenseColors: Record<string, string> = {
  'FUEL': '#f59e0b',
  'DRIVER ADVANCE': '#3b82f6',
  'OWNER ADVANCE': '#8b5cf6',
  'MAINTENANCE': '#ec4899',
  'TOLL': '#10b981',
  'CASH PAYMENT': '#ef4444',
}

// ===========================
// Main Component
// ===========================

interface Props {
  initialData: AnalyticsData
}

export default function DashboardAnalytics({ initialData }: Props) {
  const { setLoading } = useLoading()
  const [data, setData] = useState<AnalyticsData>(initialData)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [chartMetric, setChartMetric] = useState<string>('revenue')
  const [filters, setFilters] = useState<AnalyticsFilters>({ period: 'all' })
  const [showFilters, setShowFilters] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [sortBy, setSortBy] = useState<string>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const loadData = useCallback((newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
    setLoading(true)
    startTransition(async () => {
      try {
        const result = await fetchAnalytics(newFilters)
        setData(result)
      } catch (e) {
        console.error('Failed to load analytics', e)
      } finally {
        setLoading(false)
      }
    })
  }, [setLoading])

  const handlePeriodChange = (period: string) => {
    if (period === 'custom') {
      setShowFilters(true)
      return
    }
    loadData({ ...filters, period })
  }

  const handleEntityFilter = (key: string, value: string) => {
    loadData({ ...filters, [key]: value || undefined })
  }

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      loadData({ ...filters, period: 'custom', startDate: customStart, endDate: customEnd })
    }
  }

  const clearFilters = () => {
    setCustomStart('')
    setCustomEnd('')
    setShowFilters(false)
    loadData({ period: 'all' })
  }

  // Chart data transformation
  const getChartData = () => {
    let seriesData: { date: string; value: number }[]
    switch (chartMetric) {
      case 'trips': seriesData = data.dailyTrips; break
      case 'expenses': seriesData = data.dailyExpenses; break
      case 'weight': seriesData = data.dailyWeight; break
      default: seriesData = data.dailyRevenue; break
    }

    // Aggregate if too many points
    if (seriesData.length > 30) {
      const weeklyMap = new Map<string, { label: string; value: number }>()
      seriesData.forEach(d => {
        const dt = new Date(d.date)
        const weekKey = `${dt.getFullYear()}-W${Math.ceil(((dt.getTime() - new Date(dt.getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000) + 1) / 7)}`
        const existing = weeklyMap.get(weekKey)
        if (existing) {
          existing.value += d.value
        } else {
          const parts = d.date.split('-')
          weeklyMap.set(weekKey, { label: `${parts[1]}/${parts[2]}`, value: d.value })
        }
      })
      return Array.from(weeklyMap.values())
    }

    return seriesData.map(d => {
      const parts = d.date.split('-')
      return { label: `${parts[1]}/${parts[2]}`, value: d.value }
    })
  }

  const chartColor = chartMetric === 'expenses' ? '#ef4444' : chartMetric === 'trips' ? '#3b82f6' : chartMetric === 'weight' ? '#8b5cf6' : '#f59e0b'

  // Sort helpers
  const sortArray = <T extends Record<string, any>>(arr: T[], field: string) => {
    return [...arr].sort((a, b) => {
      const aVal = a[field] ?? 0
      const bVal = b[field] ?? 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => (
    <span className="analytics-sort-icon">{sortBy === field ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}</span>
  )

  // Check if any entity filter is active
  const hasEntityFilter = !!(filters.projectId || filters.ownerId || filters.vehicleId)

  return (
    <div className="analytics-dashboard">
      {/* ===== HEADER ===== */}
      <header className="analytics-header">
        <div className="analytics-header-left">
          <h1 className="analytics-title">
            <span className="analytics-title-icon">📊</span>
            Analytics Hub
          </h1>
          <div className="analytics-subtitle-row">
            <span className="analytics-period-badge">
              {isPending ? '⏳ Loading...' : data.periodLabel}
            </span>
            {hasEntityFilter && (
              <span className="analytics-filter-badge" onClick={clearFilters} title="Click to clear all filters">
                🔍 Filters Active · Clear
              </span>
            )}
          </div>
        </div>

        <div className="analytics-header-right">
          {/* Period Selector */}
          <div className="analytics-period-bar">
            {PERIODS.filter(p => p.key !== 'custom').map(p => (
              <button
                key={p.key}
                className={`analytics-period-btn ${filters.period === p.key ? 'active' : ''}`}
                onClick={() => handlePeriodChange(p.key)}
                disabled={isPending}
              >
                {p.label}
              </button>
            ))}
            <button
              className={`analytics-period-btn ${filters.period === 'custom' ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              disabled={isPending}
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* ===== FILTER PANEL ===== */}
      {showFilters && (
        <div className="analytics-filter-panel">
          <div className="analytics-filter-grid">
            <div className="analytics-filter-group">
              <label className="analytics-filter-label">Start Date</label>
              <input type="date" className="form-input analytics-filter-input" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            </div>
            <div className="analytics-filter-group">
              <label className="analytics-filter-label">End Date</label>
              <input type="date" className="form-input analytics-filter-input" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
            <div className="analytics-filter-group">
              <label className="analytics-filter-label">Project</label>
              <select className="form-select analytics-filter-input" value={filters.projectId || ''} onChange={e => handleEntityFilter('projectId', e.target.value)}>
                <option value="">All Projects</option>
                {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="analytics-filter-group">
              <label className="analytics-filter-label">Owner</label>
              <select className="form-select analytics-filter-input" value={filters.ownerId || ''} onChange={e => handleEntityFilter('ownerId', e.target.value)}>
                <option value="">All Owners</option>
                {data.owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="analytics-filter-group">
              <label className="analytics-filter-label">Vehicle</label>
              <select className="form-select analytics-filter-input" value={filters.vehicleId || ''} onChange={e => handleEntityFilter('vehicleId', e.target.value)}>
                <option value="">All Vehicles</option>
                {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNo}</option>)}
              </select>
            </div>
            <div className="analytics-filter-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={applyCustomRange} disabled={!customStart || !customEnd || isPending}>
                Apply Range
              </button>
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOADING OVERLAY ===== */}
      {isPending && <div className="analytics-loading-bar" />}

      {/* ===== TAB NAVIGATION ===== */}
      <div className="analytics-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`analytics-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="analytics-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className={`analytics-content ${isPending ? 'loading' : ''}`}>
        
        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Grid */}
            <div className="analytics-kpi-grid">
              <div className="analytics-kpi accent">
                <div className="analytics-kpi-icon">💰</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.totalRevenue.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Total Revenue</div>
                </div>
              </div>
              <div className="analytics-kpi danger">
                <div className="analytics-kpi-icon">📉</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.totalExpenses.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Total Expenses</div>
                </div>
              </div>
              <div className={`analytics-kpi ${data.netProfit >= 0 ? 'success' : 'loss'}`}>
                <div className="analytics-kpi-icon">💵</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.netProfit.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Net Profit</div>
                </div>
              </div>
              <div className="analytics-kpi info">
                <div className="analytics-kpi-icon">🛣️</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.totalTrips.toLocaleString()}</div>
                  <div className="analytics-kpi-label">Total Trips</div>
                </div>
              </div>
              <div className="analytics-kpi purple">
                <div className="analytics-kpi-icon">⚖️</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.totalWeight.toFixed(1)} MT</div>
                  <div className="analytics-kpi-label">Weight Moved</div>
                </div>
              </div>
              <div className="analytics-kpi teal">
                <div className="analytics-kpi-icon">📈</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.profitMargin.toFixed(1)}%</div>
                  <div className="analytics-kpi-label">Profit Margin</div>
                </div>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="analytics-secondary-kpis">
              <div className="analytics-mini-kpi">
                <span className="analytics-mini-icon">🚛</span>
                <span className="analytics-mini-value">{data.activeVehicles}</span>
                <span className="analytics-mini-label">Vehicles</span>
              </div>
              <div className="analytics-mini-kpi">
                <span className="analytics-mini-icon">👤</span>
                <span className="analytics-mini-value">{data.activeOwners}</span>
                <span className="analytics-mini-label">Owners</span>
              </div>
              <div className="analytics-mini-kpi">
                <span className="analytics-mini-icon">📁</span>
                <span className="analytics-mini-value">{data.activeProjects}</span>
                <span className="analytics-mini-label">Projects</span>
              </div>
              <div className="analytics-mini-kpi">
                <span className="analytics-mini-icon">💰</span>
                <span className="analytics-mini-value">₹{Math.round(data.avgRevenuePerTrip).toLocaleString('en-IN')}</span>
                <span className="analytics-mini-label">Avg/Trip</span>
              </div>
              <div className="analytics-mini-kpi">
                <span className="analytics-mini-icon">⚖️</span>
                <span className="analytics-mini-value">{data.avgWeightPerTrip.toFixed(1)} MT</span>
                <span className="analytics-mini-label">Avg Weight</span>
              </div>
            </div>

            {/* Trend Chart + Expense Donut */}
            <div className="analytics-grid-2">
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">📈 Trend Analysis</span>
                  <div className="analytics-chart-toggle">
                    {CHART_TYPES.map(ct => (
                      <button
                        key={ct.key}
                        className={`analytics-chart-toggle-btn ${chartMetric === ct.key ? 'active' : ''}`}
                        onClick={() => setChartMetric(ct.key)}
                        title={ct.label}
                      >
                        {ct.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="analytics-card-body">
                  <AreaChart data={getChartData()} color={chartColor} height={220} />
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">🧩 Expense Breakdown</span>
                </div>
                <div className="analytics-card-body">
                  {data.expenseByType.length === 0 ? (
                    <div className="analytics-empty">No expenses recorded</div>
                  ) : (
                    <DonutChart
                      data={data.expenseByType.map(e => ({
                        label: e.type,
                        value: e.amount,
                        color: expenseColors[e.type] || '#64748b',
                      }))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Top Performers + Recent */}
            <div className="analytics-grid-2">
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">🏆 Top Vehicles</span>
                </div>
                <div className="analytics-card-body">
                  {data.topVehicles.length === 0 ? (
                    <div className="analytics-empty">No data yet</div>
                  ) : (
                    <HorizontalBar
                      data={data.topVehicles.map((v, i) => ({
                        label: `${v.plateNo} (${v.trips} trips)`,
                        value: v.revenue,
                        color: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'][i] || '#64748b',
                      }))}
                    />
                  )}
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">🏗️ Top Projects</span>
                </div>
                <div className="analytics-card-body">
                  {data.topProjects.length === 0 ? (
                    <div className="analytics-empty">No data yet</div>
                  ) : (
                    <HorizontalBar
                      data={data.topProjects.map((p, i) => ({
                        label: `${p.name} (${p.trips} trips)`,
                        value: p.revenue,
                        color: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'][i] || '#64748b',
                      }))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="analytics-grid-2">
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">🕐 Recent Trips</span>
                </div>
                <div className="analytics-card-body analytics-card-body-table">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Vehicle</th><th>Project</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>
                      {data.recentTrips.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center' }}>No trips found</td></tr>
                      ) : (
                        data.recentTrips.slice(0, 5).map(t => (
                          <tr key={t.id}>
                            <td>{t.date}</td>
                            <td><strong>{t.vehicle}</strong></td>
                            <td>{t.project}</td>
                            <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>₹{t.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">💸 Recent Expenses</span>
                </div>
                <div className="analytics-card-body analytics-card-body-table">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Vehicle</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>
                      {data.recentExpenses.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center' }}>No expenses found</td></tr>
                      ) : (
                        data.recentExpenses.slice(0, 5).map(e => (
                          <tr key={e.id}>
                            <td>{e.date}</td>
                            <td><strong>{e.vehicle}</strong></td>
                            <td><span className="badge other">{e.type}</span></td>
                            <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: 600 }}>₹{e.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============ REVENUE TAB ============ */}
        {activeTab === 'revenue' && (
          <>
            <div className="analytics-kpi-grid analytics-kpi-grid-4">
              <div className="analytics-kpi accent">
                <div className="analytics-kpi-icon">💰</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.totalRevenue.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Total Revenue</div>
                </div>
              </div>
              <div className="analytics-kpi info">
                <div className="analytics-kpi-icon">📊</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{Math.round(data.avgRevenuePerTrip).toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Avg Revenue/Trip</div>
                </div>
              </div>
              <div className="analytics-kpi success">
                <div className="analytics-kpi-icon">💵</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.netProfit.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Net Profit</div>
                </div>
              </div>
              <div className="analytics-kpi purple">
                <div className="analytics-kpi-icon">📈</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.profitMargin.toFixed(1)}%</div>
                  <div className="analytics-kpi-label">Margin</div>
                </div>
              </div>
            </div>

            <div className="analytics-card" style={{ marginBottom: 16 }}>
              <div className="analytics-card-header">
                <span className="analytics-card-title">💰 Revenue Trend</span>
              </div>
              <div className="analytics-card-body">
                <AreaChart data={getChartData()} color="#f59e0b" height={250} />
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📁 Revenue by Project</span>
              </div>
              <div className="analytics-card-body analytics-card-body-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')} className="sortable-th">Project <SortIcon field="name" /></th>
                      <th onClick={() => handleSort('trips')} className="sortable-th" style={{ textAlign: 'right' }}>Trips <SortIcon field="trips" /></th>
                      <th onClick={() => handleSort('weight')} className="sortable-th" style={{ textAlign: 'right' }}>Weight (MT) <SortIcon field="weight" /></th>
                      <th onClick={() => handleSort('revenue')} className="sortable-th" style={{ textAlign: 'right' }}>Revenue <SortIcon field="revenue" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortArray(data.revenueByProject, sortBy).map((p, i) => (
                      <tr key={i}>
                        <td><strong>{p.name}</strong></td>
                        <td style={{ textAlign: 'right' }}>{p.trips}</td>
                        <td style={{ textAlign: 'right' }}>{p.weight.toFixed(1)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 700 }}>₹{p.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {data.revenueByProject.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ============ EXPENSES TAB ============ */}
        {activeTab === 'expenses' && (
          <>
            <div className="analytics-kpi-grid analytics-kpi-grid-4">
              <div className="analytics-kpi danger">
                <div className="analytics-kpi-icon">📉</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.totalExpenses.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Total Expenses</div>
                </div>
              </div>
              <div className="analytics-kpi purple">
                <div className="analytics-kpi-icon">💳</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.totalAdvances.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Owner Advances</div>
                </div>
              </div>
              <div className="analytics-kpi accent">
                <div className="analytics-kpi-icon">💰</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{(data.totalExpenses - data.totalAdvances).toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Operating Expenses</div>
                </div>
              </div>
              <div className={`analytics-kpi ${data.netProfit >= 0 ? 'success' : 'loss'}`}>
                <div className="analytics-kpi-icon">📈</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.profitMargin.toFixed(1)}%</div>
                  <div className="analytics-kpi-label">Profit Margin</div>
                </div>
              </div>
            </div>

            <div className="analytics-grid-2">
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">📉 Expense Trend</span>
                </div>
                <div className="analytics-card-body">
                  <AreaChart data={data.dailyExpenses.map(d => {
                    const parts = d.date.split('-')
                    return { label: `${parts[1]}/${parts[2]}`, value: d.value }
                  }).filter((_, i, arr) => i % Math.max(Math.floor(arr.length / 30), 1) === 0)} color="#ef4444" height={220} />
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">🧩 Category Breakdown</span>
                </div>
                <div className="analytics-card-body">
                  {data.expenseByType.length === 0 ? (
                    <div className="analytics-empty">No expenses recorded</div>
                  ) : (
                    <DonutChart
                      data={data.expenseByType.map(e => ({
                        label: e.type,
                        value: e.amount,
                        color: expenseColors[e.type] || '#64748b',
                      }))}
                      size={200}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📋 Expense Category Details</span>
              </div>
              <div className="analytics-card-body analytics-card-body-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Share</th>
                      <th style={{ width: '40%' }}>Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenseByType.map((e, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: expenseColors[e.type] || '#64748b', flexShrink: 0 }} />
                            <strong>{e.type}</strong>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{e.amount.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{e.pct}%</td>
                        <td>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ width: `${e.pct}%`, height: '100%', background: expenseColors[e.type] || '#64748b', borderRadius: 100, transition: 'width 0.6s ease' }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.expenseByType.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ============ VEHICLES TAB ============ */}
        {activeTab === 'vehicles' && (
          <>
            <div className="analytics-kpi-grid analytics-kpi-grid-4">
              <div className="analytics-kpi accent">
                <div className="analytics-kpi-icon">🚛</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.activeVehicles}</div>
                  <div className="analytics-kpi-label">Active Vehicles</div>
                </div>
              </div>
              <div className="analytics-kpi success">
                <div className="analytics-kpi-icon">💰</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.revenueByVehicle.length > 0 ? Math.round(data.totalRevenue / data.revenueByVehicle.length).toLocaleString('en-IN') : 0}</div>
                  <div className="analytics-kpi-label">Avg Revenue/Vehicle</div>
                </div>
              </div>
              <div className="analytics-kpi info">
                <div className="analytics-kpi-icon">🛣️</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.revenueByVehicle.length > 0 ? Math.round(data.totalTrips / data.revenueByVehicle.length) : 0}</div>
                  <div className="analytics-kpi-label">Avg Trips/Vehicle</div>
                </div>
              </div>
              <div className="analytics-kpi purple">
                <div className="analytics-kpi-icon">⚖️</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.revenueByVehicle.length > 0 ? (data.totalWeight / data.revenueByVehicle.length).toFixed(1) : 0} MT</div>
                  <div className="analytics-kpi-label">Avg Weight/Vehicle</div>
                </div>
              </div>
            </div>

            <div className="analytics-card" style={{ marginBottom: 16 }}>
              <div className="analytics-card-header">
                <span className="analytics-card-title">🚛 Vehicle Revenue Comparison</span>
              </div>
              <div className="analytics-card-body">
                {data.revenueByVehicle.length === 0 ? (
                  <div className="analytics-empty">No vehicle data</div>
                ) : (
                  <BarChart
                    data={data.revenueByVehicle.slice(0, 15).map(v => ({ label: v.plateNo.slice(-4), value: v.revenue }))}
                    color="var(--color-accent)"
                    height={220}
                  />
                )}
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📋 Full Vehicle Performance</span>
              </div>
              <div className="analytics-card-body analytics-card-body-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Owner</th>
                      <th onClick={() => handleSort('trips')} className="sortable-th" style={{ textAlign: 'right' }}>Trips <SortIcon field="trips" /></th>
                      <th onClick={() => handleSort('weight')} className="sortable-th" style={{ textAlign: 'right' }}>Weight <SortIcon field="weight" /></th>
                      <th onClick={() => handleSort('revenue')} className="sortable-th" style={{ textAlign: 'right' }}>Revenue <SortIcon field="revenue" /></th>
                      <th onClick={() => handleSort('expenses')} className="sortable-th" style={{ textAlign: 'right' }}>Expenses <SortIcon field="expenses" /></th>
                      <th onClick={() => handleSort('profit')} className="sortable-th" style={{ textAlign: 'right' }}>Profit <SortIcon field="profit" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortArray(data.revenueByVehicle, sortBy).map((v, i) => (
                      <tr key={i}>
                        <td><strong>{v.plateNo}</strong></td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{v.ownerName}</td>
                        <td style={{ textAlign: 'right' }}>{v.trips}</td>
                        <td style={{ textAlign: 'right' }}>{v.weight.toFixed(1)} MT</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>₹{v.revenue.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{v.expenses.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: v.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{v.profit.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {data.revenueByVehicle.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ============ PROJECTS TAB ============ */}
        {activeTab === 'projects' && (
          <>
            <div className="analytics-kpi-grid analytics-kpi-grid-3">
              <div className="analytics-kpi accent">
                <div className="analytics-kpi-icon">📁</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.activeProjects}</div>
                  <div className="analytics-kpi-label">Active Projects</div>
                </div>
              </div>
              <div className="analytics-kpi success">
                <div className="analytics-kpi-icon">💰</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.revenueByProject.length > 0 ? Math.round(data.totalRevenue / data.revenueByProject.length).toLocaleString('en-IN') : 0}</div>
                  <div className="analytics-kpi-label">Avg Revenue/Project</div>
                </div>
              </div>
              <div className="analytics-kpi info">
                <div className="analytics-kpi-icon">🛣️</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.revenueByProject.length > 0 ? Math.round(data.totalTrips / data.revenueByProject.length) : 0}</div>
                  <div className="analytics-kpi-label">Avg Trips/Project</div>
                </div>
              </div>
            </div>

            <div className="analytics-card" style={{ marginBottom: 16 }}>
              <div className="analytics-card-header">
                <span className="analytics-card-title">📁 Project Revenue Comparison</span>
              </div>
              <div className="analytics-card-body">
                {data.revenueByProject.length === 0 ? (
                  <div className="analytics-empty">No project data</div>
                ) : (
                  <BarChart
                    data={data.revenueByProject.map(p => ({ label: p.name.length > 8 ? p.name.slice(0, 8) + '..' : p.name, value: p.revenue }))}
                    color="#10b981"
                    height={220}
                  />
                )}
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📋 Full Project Breakdown</span>
              </div>
              <div className="analytics-card-body analytics-card-body-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th onClick={() => handleSort('trips')} className="sortable-th" style={{ textAlign: 'right' }}>Trips <SortIcon field="trips" /></th>
                      <th onClick={() => handleSort('weight')} className="sortable-th" style={{ textAlign: 'right' }}>Weight (MT) <SortIcon field="weight" /></th>
                      <th onClick={() => handleSort('revenue')} className="sortable-th" style={{ textAlign: 'right' }}>Revenue <SortIcon field="revenue" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortArray(data.revenueByProject, sortBy).map((p, i) => (
                      <tr key={i}>
                        <td><strong>{p.name}</strong></td>
                        <td style={{ textAlign: 'right' }}>{p.trips}</td>
                        <td style={{ textAlign: 'right' }}>{p.weight.toFixed(1)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 700 }}>₹{p.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {data.revenueByProject.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ============ OWNERS TAB ============ */}
        {activeTab === 'owners' && (
          <>
            <div className="analytics-kpi-grid analytics-kpi-grid-4">
              <div className="analytics-kpi accent">
                <div className="analytics-kpi-icon">👤</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{data.activeOwners}</div>
                  <div className="analytics-kpi-label">Registered Owners</div>
                </div>
              </div>
              <div className="analytics-kpi success">
                <div className="analytics-kpi-icon">💰</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.revenueByOwner.length > 0 ? Math.round(data.totalRevenue / data.revenueByOwner.length).toLocaleString('en-IN') : 0}</div>
                  <div className="analytics-kpi-label">Avg Revenue/Owner</div>
                </div>
              </div>
              <div className="analytics-kpi danger">
                <div className="analytics-kpi-icon">📉</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.revenueByOwner.length > 0 ? Math.round(data.totalExpenses / data.revenueByOwner.length).toLocaleString('en-IN') : 0}</div>
                  <div className="analytics-kpi-label">Avg Expenses/Owner</div>
                </div>
              </div>
              <div className="analytics-kpi purple">
                <div className="analytics-kpi-icon">💵</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.totalAdvances.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Total Advances Paid</div>
                </div>
              </div>
            </div>

            <div className="analytics-card" style={{ marginBottom: 16 }}>
              <div className="analytics-card-header">
                <span className="analytics-card-title">👤 Owner Revenue Comparison</span>
              </div>
              <div className="analytics-card-body">
                {data.revenueByOwner.length === 0 ? (
                  <div className="analytics-empty">No owner data</div>
                ) : (
                  <BarChart
                    data={data.revenueByOwner.map(o => ({ label: o.name.length > 8 ? o.name.slice(0, 8) + '..' : o.name, value: o.revenue }))}
                    color="#8b5cf6"
                    height={220}
                  />
                )}
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📋 Owner Performance Table</span>
              </div>
              <div className="analytics-card-body analytics-card-body-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Owner</th>
                      <th onClick={() => handleSort('trips')} className="sortable-th" style={{ textAlign: 'right' }}>Trips <SortIcon field="trips" /></th>
                      <th onClick={() => handleSort('revenue')} className="sortable-th" style={{ textAlign: 'right' }}>Revenue <SortIcon field="revenue" /></th>
                      <th onClick={() => handleSort('expenses')} className="sortable-th" style={{ textAlign: 'right' }}>Expenses <SortIcon field="expenses" /></th>
                      <th onClick={() => handleSort('profit')} className="sortable-th" style={{ textAlign: 'right' }}>Net Payable <SortIcon field="profit" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortArray(data.revenueByOwner, sortBy).map((o, i) => (
                      <tr key={i}>
                        <td><strong>{o.name}</strong></td>
                        <td style={{ textAlign: 'right' }}>{o.trips}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>₹{o.revenue.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{o.expenses.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: o.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{o.profit.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {data.revenueByOwner.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
