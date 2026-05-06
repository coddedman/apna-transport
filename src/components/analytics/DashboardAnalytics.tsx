'use client'

import { useState, useTransition, useCallback } from 'react'
import { fetchAnalytics, type AnalyticsData, type AnalyticsFilters } from '@/lib/actions/analytics'
import { useLoading } from '@/lib/context/LoadingContext'
import { useSidebar } from '@/lib/context/SidebarContext'
import toast from 'react-hot-toast'

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
// Helpers
// ===========================

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

// ===========================
// Tab Definitions
// ===========================

type TabKey = 'overview' | 'revenue' | 'expenses' | 'vehicles' | 'projects' | 'owners' | 'simulator'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'revenue', label: 'Revenue', icon: '💰' },
  { key: 'expenses', label: 'Expenses', icon: '📉' },
  { key: 'vehicles', label: 'Vehicles', icon: '🚛' },
  { key: 'projects', label: 'Projects', icon: '📁' },
  { key: 'owners', label: 'Owners', icon: '👤' },
  { key: 'simulator', label: 'Rate Calculator', icon: '🧮' },
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
  const { toggle } = useSidebar()
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
  const [deductibleTypes, setDeductibleTypes] = useState<Set<string>>(new Set(['TOLL', 'OWNER_ADVANCE']))
  const [modalData, setModalData] = useState<{ title: string; content: React.ReactNode } | null>(null)

  // Calculated values based on deductible config
  const totalDeductions = data.expenseByType
    .filter(e => deductibleTypes.has(e.type.replace(/ /g, '_').toUpperCase()))
    .reduce((a, e) => a + e.amount, 0)
  
  const netSettlement = data.ownerPayout - totalDeductions
  const rateSpread = data.totalRevenue - data.ownerPayout
  const nonDeductibleExpenses = data.totalExpenses - totalDeductions
  const adjustedNetProfit = rateSpread - nonDeductibleExpenses
  const adjustedMargin = data.totalRevenue > 0 ? (adjustedNetProfit / data.totalRevenue) * 100 : 0

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
          <button 
            className="mobile-menu-btn" 
            onClick={toggle}
            style={{ marginRight: '12px' }}
          >
            ☰
          </button>
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
              <div className="analytics-kpi accent" style={{ cursor: 'pointer' }} onClick={() => setModalData({
                title: 'Company Revenue Breakdown',
                content: (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>Total freight revenue generated from projects before any payouts.</p>
                    {data.revenueByProject.map(p => (
                      <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.trips} trips · {p.weight.toFixed(1)} MT</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{fmt(p.revenue)}</div>
                      </div>
                    ))}
                  </div>
                )
              })}>
                <div className="analytics-kpi-icon">🏢</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.totalRevenue.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Company Rev <span style={{fontSize:'10px', opacity:0.5}}>ⓘ</span></div>
                </div>
              </div>
              
              <div className="analytics-kpi warning" style={{ cursor: 'pointer' }} onClick={() => setModalData({
                title: 'Owner Gross Payout Breakdown',
                content: (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>Gross payout per owner (before deductions). The final settlement will subtract their specific expenses (fuel, tolls, advances).</p>
                    {data.revenueByOwner.map(o => (
                      <div key={o.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{o.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{o.trips} trips</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{fmt(o.expenses)}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: 8, fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                      <span>Total Gross Payout</span>
                      <span style={{ color: '#f59e0b' }}>{fmt(data.ownerPayout)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 700 }}>
                      <span style={{ color: '#ef4444' }}>MINUS Global Deductions</span>
                      <span style={{ color: '#ef4444' }}>-{fmt(totalDeductions)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 800 }}>
                      <span style={{ color: '#8b5cf6' }}>Net Settlement (Paid)</span>
                      <span style={{ color: '#8b5cf6' }}>{fmt(netSettlement)}</span>
                    </div>
                  </div>
                )
              })}>
                <div className="analytics-kpi-icon">💰</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{netSettlement.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Owner Settlement <span style={{fontSize:'10px', opacity:0.5}}>ⓘ</span></div>
                </div>
              </div>

              <div className="analytics-kpi danger" style={{ cursor: 'pointer' }} onClick={() => setModalData({
                title: 'My Non-Deductible Expenses',
                content: (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>Operational costs borne by your company that CANNOT be deducted from owner settlements.</p>
                    {data.expenseByType
                      .filter(e => !deductibleTypes.has(e.type.replace(/ /g, '_').toUpperCase()))
                      .map(e => (
                      <div key={e.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{e.type}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{fmt(e.amount)}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: 8, fontWeight: 800, borderTop: '2px solid var(--color-border)' }}>
                      <span>Total</span>
                      <span style={{ color: '#ef4444' }}>{fmt(nonDeductibleExpenses)}</span>
                    </div>
                  </div>
                )
              })}>
                <div className="analytics-kpi-icon">📉</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{nonDeductibleExpenses.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">My Expenses <span style={{fontSize:'10px', opacity:0.5}}>ⓘ</span></div>
                </div>
              </div>
              <div className="analytics-kpi info" style={{ cursor: 'pointer' }} onClick={() => toast('Rate Spread:\nThe gross difference between Company Revenue and Owner Gross Payout.', { icon: 'ℹ️', duration: 4000 })}>
                <div className="analytics-kpi-icon">📊</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{rateSpread.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Rate Spread <span style={{fontSize:'10px', opacity:0.5}}>ⓘ</span></div>
                </div>
              </div>
              <div className={`analytics-kpi ${adjustedNetProfit >= 0 ? 'success' : 'loss'}`} style={{ cursor: 'pointer' }} onClick={() => toast('Net Profit:\nFinal take-home profit: Company Revenue - Owner Settlement - My Expenses.', { icon: 'ℹ️', duration: 4000 })}>
                <div className="analytics-kpi-icon">💵</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{adjustedNetProfit.toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Net Profit <span style={{fontSize:'10px', opacity:0.5}}>ⓘ</span></div>
                </div>
              </div>
              <div className="analytics-kpi teal" style={{ cursor: 'pointer' }} onClick={() => toast('Profit Margin:\nNet Profit as a percentage of Company Revenue.', { icon: 'ℹ️', duration: 4000 })}>
                <div className="analytics-kpi-icon">📈</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">{adjustedMargin.toFixed(1)}%</div>
                  <div className="analytics-kpi-label">Profit Margin <span style={{fontSize:'10px', opacity:0.5}}>ⓘ</span></div>
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
                <span className="analytics-mini-icon">🛣️</span>
                <span className="analytics-mini-value">{data.totalTrips.toLocaleString()}</span>
                <span className="analytics-mini-label">Trips</span>
              </div>
              <div className="analytics-mini-kpi">
                <span className="analytics-mini-icon">⚖️</span>
                <span className="analytics-mini-value">{data.totalWeight.toFixed(1)} MT</span>
                <span className="analytics-mini-label">Weight</span>
              </div>
              <div className="analytics-mini-kpi">
                <span className="analytics-mini-icon">💰</span>
                <span className="analytics-mini-value">₹{Math.round(data.avgRevenuePerTrip).toLocaleString('en-IN')}</span>
                <span className="analytics-mini-label">Revenue/Trip</span>
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
                  <div className="analytics-kpi-label">Gross Billings</div>
                </div>
              </div>
              <div className="analytics-kpi info">
                <div className="analytics-kpi-icon">📊</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{Math.round(data.avgRevenuePerTrip).toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Avg Billings/Trip</div>
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
                  <div className="analytics-kpi-label">Total Outgoings</div>
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
              <div className="analytics-kpi warning">
                <div className="analytics-kpi-icon">⛽</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.revenueByVehicle.reduce((a, v) => a + v.fuel, 0).toLocaleString('en-IN')}</div>
                  <div className="analytics-kpi-label">Total Fuel Cost</div>
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

            {/* Per-vehicle expense breakdown cards */}
            {data.revenueByVehicle.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>⛽ Per-Vehicle Expense Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {data.revenueByVehicle.map((v, i) => {
                    const deductions = [
                      { type: 'FUEL', val: v.fuel },
                      { type: 'MAINTENANCE', val: v.maintenance },
                      { type: 'TOLL', val: v.toll },
                      { type: 'DRIVER_ADVANCE', val: v.driverAdvance },
                    ].filter(d => deductibleTypes.has(d.type)).reduce((a, d) => a + d.val, 0)
                    
                    const settlement = v.payout - deductions
                    const myProfit = v.profit + deductions
                    const margin = v.revenue > 0 ? (myProfit / v.revenue) * 100 : 0

                    return (
                      <div key={i} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-primary)' }}>🚛 {v.plateNo}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{v.trips} trips • {v.weight.toFixed(1)} MT</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>{fmt(v.revenue)}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Revenue</div>
                          </div>
                        </div>

                        {/* Stats mini-grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                          <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.06)', borderRadius: 8, padding: '6px 4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>{fmt(v.payout)}</div>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Gross Pay</div>
                          </div>
                          <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '6px 4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>{fmt(deductions)}</div>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Deduct</div>
                          </div>
                          <div style={{ textAlign: 'center', background: 'rgba(139,92,246,0.06)', borderRadius: 8, padding: '6px 4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#8b5cf6' }}>{fmt(settlement)}</div>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Settled</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: myProfit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(myProfit)}</div>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>My Net</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>{margin.toFixed(1)}%</div>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Margin</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Full sortable table */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📋 Full Vehicle Performance</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{data.revenueByVehicle.length} vehicles</span>
              </div>
              <div className="analytics-card-body analytics-card-body-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th onClick={() => handleSort('trips')} className="sortable-th" style={{ textAlign: 'right' }}>Trips <SortIcon field="trips" /></th>
                      <th onClick={() => handleSort('revenue')} className="sortable-th" style={{ textAlign: 'right' }}>Revenue <SortIcon field="revenue" /></th>
                      <th style={{ textAlign: 'right' }}>Gross Payout</th>
                      <th style={{ textAlign: 'right' }}>Deductions</th>
                      <th style={{ textAlign: 'right' }}>Settlement</th>
                      <th style={{ textAlign: 'right' }}>My Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortArray(data.revenueByVehicle, sortBy).map((v, i) => {
                      const deductions = [
                        { type: 'FUEL', val: v.fuel },
                        { type: 'MAINTENANCE', val: v.maintenance },
                        { type: 'TOLL', val: v.toll },
                        { type: 'DRIVER_ADVANCE', val: v.driverAdvance },
                      ].filter(d => deductibleTypes.has(d.type)).reduce((a, d) => a + d.val, 0)
                      
                      const settlement = v.payout - deductions
                      const myProfit = v.profit + deductions

                      return (
                        <tr key={i}>
                          <td><strong>{v.plateNo}</strong></td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ background: 'rgba(59,130,246,.1)', color: 'var(--color-info)', borderRadius: 20, padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>{v.trips}</span>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>₹{v.revenue.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '12px' }}>₹{v.payout.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', color: '#ef4444', fontSize: '12px' }}>{deductions > 0 ? `₹${deductions.toLocaleString('en-IN')}` : '—'}</td>
                          <td style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>₹{settlement.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: myProfit >= 0 ? '#10b981' : '#ef4444' }}>₹{myProfit.toLocaleString('en-IN')}</td>
                        </tr>
                      )
                    })}
                    {data.revenueByVehicle.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No vehicle data</td></tr>}
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
            {/* KPI Row */}
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
                  <div className="analytics-kpi-label">Avg Earnings / Owner</div>
                </div>
              </div>
              <div className="analytics-kpi danger">
                <div className="analytics-kpi-icon">📉</div>
                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">₹{data.revenueByOwner.length > 0 ? Math.round(data.totalExpenses / data.revenueByOwner.length).toLocaleString('en-IN') : 0}</div>
                  <div className="analytics-kpi-label">Avg Expenses / Owner</div>
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

            {/* Visual + Table side by side when data exists */}
            <div className="analytics-grid-2" style={{ marginBottom: 16 }}>
              {/* Revenue Horizontal Bar */}
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">📊 Revenue Share</span>
                </div>
                <div className="analytics-card-body">
                  {data.revenueByOwner.length === 0 ? (
                    <div className="analytics-empty">No owner data</div>
                  ) : (
                    <HorizontalBar
                      data={data.revenueByOwner.map((o, i) => ({
                        label: o.name,
                        value: o.revenue,
                        color: ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'][i % 5],
                      }))}
                    />
                  )}
                </div>
              </div>

              {/* Net Payable Horizontal Bar */}
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">💸 Net Payable by Owner</span>
                </div>
                <div className="analytics-card-body">
                  {data.revenueByOwner.length === 0 ? (
                    <div className="analytics-empty">No owner data</div>
                  ) : (
                    <HorizontalBar
                      data={data.revenueByOwner
                        .filter(o => o.profit > 0)
                        .map((o, i) => ({
                          label: o.name,
                          value: o.profit,
                          color: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][i % 5],
                        }))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Full Performance Table */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📋 Owner Performance Table</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {data.revenueByOwner.length} owner{data.revenueByOwner.length !== 1 ? 's' : ''} · {data.totalTrips} total trips
                </span>
              </div>
              <div className="analytics-card-body analytics-card-body-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Owner</th>
                      <th onClick={() => handleSort('trips')} className="sortable-th" style={{ textAlign: 'right' }}>Trips <SortIcon field="trips" /></th>
                      <th onClick={() => handleSort('revenue')} className="sortable-th" style={{ textAlign: 'right' }}>Earnings <SortIcon field="revenue" /></th>
                      <th onClick={() => handleSort('expenses')} className="sortable-th" style={{ textAlign: 'right' }}>Expenses <SortIcon field="expenses" /></th>
                      <th style={{ textAlign: 'right' }}>Margin</th>
                      <th onClick={() => handleSort('profit')} className="sortable-th" style={{ textAlign: 'right' }}>Net Payable <SortIcon field="profit" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortArray(data.revenueByOwner, sortBy).map((o, i) => {
                      const margin = o.revenue > 0 ? ((o.profit / o.revenue) * 100).toFixed(1) : '0.0'
                      const marginNum = parseFloat(margin)
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: `rgba(139,92,246,0.15)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: 800, color: '#8b5cf6', flexShrink: 0,
                              }}>
                                {o.name.slice(0, 1).toUpperCase()}
                              </div>
                              <strong>{o.name}</strong>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block', minWidth: '36px',
                              background: 'rgba(59,130,246,0.1)', color: 'var(--color-info)',
                              borderRadius: '20px', padding: '2px 8px',
                              fontSize: '12px', fontWeight: 700,
                            }}>{o.trips}</span>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>₹{o.revenue.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>₹{o.expenses.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              color: marginNum >= 30 ? 'var(--color-success)' : marginNum >= 10 ? 'var(--color-accent)' : 'var(--color-danger)',
                              fontWeight: 700, fontSize: '12px',
                            }}>{margin}%</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              fontWeight: 800, fontSize: '13px',
                              color: o.profit > 0 ? 'var(--color-accent)' : 'var(--color-success)',
                            }}>
                              {o.profit > 0 ? '▲ ' : o.profit < 0 ? '▼ ' : ''}₹{Math.abs(o.profit).toLocaleString('en-IN')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {data.revenueByOwner.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No owner data for the selected period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ============ SIMULATOR TAB ============ */}
        {activeTab === 'simulator' && (
          <SimulatorTab data={data} deductibleTypes={deductibleTypes} setDeductibleTypes={setDeductibleTypes} />
        )}
      </div>

      {/* ===== MODAL ===== */}
      {modalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModalData(null)}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 450, maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{modalData.title}</h3>
              <button onClick={() => setModalData(null)} style={{ background: 'var(--color-bg-secondary)', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-primary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            {modalData.content}
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================
// Simulator Tab Component
// ===========================

const EXP_TYPE_LABELS: Record<string, string> = {
  FUEL: '⛽ Fuel',
  DRIVER_ADVANCE: '👤 Driver Advance',
  OWNER_ADVANCE: '🏦 Owner Advance',
  MAINTENANCE: '🔧 Maintenance',
  TOLL: '🛣️ Toll',
  CASH_PAYMENT: '💵 Cash Payment',
}

function SimulatorTab({ 
  data, 
  deductibleTypes, 
  setDeductibleTypes 
}: { 
  data: AnalyticsData;
  deductibleTypes: Set<string>;
  setDeductibleTypes: (s: Set<string>) => void;
}) {
  const currentCompanyRate = data.totalWeight > 0 ? Math.round(data.totalRevenue / data.totalWeight) : 133
  const currentOwnerRate = data.totalWeight > 0 ? Math.round(data.ownerPayout / data.totalWeight) : 125

  const [companyRate, setCompanyRate] = useState<number>(currentCompanyRate)
  const [ownerRate, setOwnerRate] = useState<number>(currentOwnerRate)
  const refundableTypes = deductibleTypes

  const toggleRefundable = (type: string) => {
    const next = new Set(deductibleTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setDeductibleTypes(next)
  }

  const allExpTypes = ['FUEL', 'MAINTENANCE', 'TOLL', 'DRIVER_ADVANCE', 'OWNER_ADVANCE', 'CASH_PAYMENT']

  // === ACTUAL figures (from DB) ===
  const actualRevenue = data.totalRevenue
  const actualPayout = data.ownerPayout
  const actualDeductions = data.expenseByType
    .filter(e => refundableTypes.has(e.type.replace(/ /g, '_').toUpperCase()))
    .reduce((a, e) => a + e.amount, 0)
  const actualSettlement = actualPayout - actualDeductions
  const actualNonDeductExp = data.totalExpenses - actualDeductions
  const actualProfit = actualRevenue - actualSettlement - actualNonDeductExp

  // === SCENARIO figures (using custom rates) ===
  const scenarioRevenue = data.totalWeight * companyRate
  const scenarioPayout = data.totalWeight * ownerRate
  const scenarioSettlement = scenarioPayout - actualDeductions
  const scenarioProfit = scenarioRevenue - scenarioSettlement - actualNonDeductExp
  const scenarioMargin = scenarioRevenue > 0 ? (scenarioProfit / scenarioRevenue) * 100 : 0

  const getWeekLabel = (k: string) => {
    const d = new Date(k)
    const e = new Date(k); e.setDate(d.getDate() + 6)
    return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })} – ${e.getDate()} ${e.toLocaleString('en-IN', { month: 'short' })}`
  }

  const cardStyle = { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' } as React.CSSProperties

  const RateInput = ({ label, sub, value, onChange, color, presets }: { label: string; sub: string; value: number; onChange: (v: number) => void; color: string; presets: number[] }) => (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="number" className="form-input" value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{ width: '110px', fontSize: '16px', fontWeight: 700, padding: '8px 12px', borderColor: color }}
          min={0} step={1} />
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{sub}</span>
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' as const }}>
        {presets.map(r => (
          <button key={r} onClick={() => onChange(r)} style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 600, borderRadius: 5, border: 'none', cursor: 'pointer', background: value === r ? color : 'rgba(255,255,255,0.06)', color: value === r ? '#fff' : 'var(--color-text-muted)' }}>₹{r}</button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* ── Rate Config ── */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>🧮 Rate Calculator
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>Scenario modelling vs actual DB data</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <RateInput label="🏢 Company Rate (₹/MT)" sub={`DB Actual: ₹${currentCompanyRate}/MT`}
            value={companyRate} onChange={setCompanyRate} color="#10b981" presets={[120, 125, 130, 133, 140, 150]} />
          <RateInput label="🚛 Owner Rate (₹/MT)" sub={`DB Actual: ₹${currentOwnerRate}/MT`}
            value={ownerRate} onChange={setOwnerRate} color="#f59e0b" presets={[110, 115, 120, 125, 130, 135]} />
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Deduct from Owner Settlement</label>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {allExpTypes.map(type => {
                const isDeductible = deductibleTypes.has(type)
                const amt = data.expenseByType.find(e => e.type.replace(/ /g, '_').toUpperCase() === type)?.amount || 0
                return (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '11px' }}>
                    <input type="checkbox" checked={isDeductible} onChange={() => toggleRefundable(type)} style={{ width: 14, height: 14, accentColor: 'var(--color-accent)' }} />
                    <span style={{ color: isDeductible ? '#ef4444' : 'var(--color-text-secondary)', fontWeight: isDeductible ? 700 : 400 }}>{EXP_TYPE_LABELS[type] || type}</span>
                    {amt > 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', marginLeft: 'auto' }}>{fmt(amt)}</span>}
                    {isDeductible && amt > 0 && <span style={{ fontSize: '9px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>DEDUCT</span>}
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Actual vs Scenario P&L ── */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 14 }}>💹 Actual vs Scenario — {data.totalWeight.toFixed(1)} MT</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Actual */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase' as const }}>📊 Actual (from DB)</div>
            {[
              { label: 'Company Revenue', val: actualRevenue, color: '#10b981', sub: `₹${currentCompanyRate}/MT avg` },
              { label: 'Gross Payout', val: actualPayout, color: '#f59e0b', sub: `₹${currentOwnerRate}/MT avg` },
              { label: 'Deductions', val: actualDeductions, color: '#ef4444', sub: 'Configured above' },
              { label: 'Net Settlement', val: actualSettlement, color: '#8b5cf6', sub: 'Owner gets this' },
              { label: 'My Expenses', val: actualNonDeductExp, color: '#64748b', sub: 'Non-deductible' },
              { label: 'Net Profit', val: actualProfit, color: actualProfit >= 0 ? '#f59e0b' : '#ef4444', sub: `${actualRevenue > 0 ? ((actualProfit / actualRevenue) * 100).toFixed(1) : 0}% margin` },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{k.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{k.sub}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: k.color }}>{fmt(k.val)}</div>
              </div>
            ))}
          </div>
          {/* Scenario */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase' as const }}>🎯 Scenario (₹{companyRate}/{ownerRate})</div>
            {[
              { label: 'Company Revenue', val: scenarioRevenue, color: '#10b981', sub: `₹${companyRate}/MT × ${data.totalWeight.toFixed(1)} MT`, delta: scenarioRevenue - actualRevenue },
              { label: 'Gross Payout', val: scenarioPayout, color: '#f59e0b', sub: `₹${ownerRate}/MT × ${data.totalWeight.toFixed(1)} MT`, delta: scenarioPayout - actualPayout },
              { label: 'Deductions', val: actualDeductions, color: '#ef4444', sub: 'Same as actual', delta: 0 },
              { label: 'Net Settlement', val: scenarioSettlement, color: '#8b5cf6', sub: 'Owner gets this', delta: scenarioSettlement - actualSettlement },
              { label: 'My Expenses', val: actualNonDeductExp, color: '#64748b', sub: 'Non-deductible', delta: 0 },
              { label: 'Net Profit', val: scenarioProfit, color: scenarioProfit >= 0 ? '#f59e0b' : '#ef4444', sub: `${scenarioMargin.toFixed(1)}% margin`, delta: scenarioProfit - actualProfit },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: k.color }}>{fmt(k.val)}</div>
                  {k.delta !== 0 && <span style={{ fontSize: 10, fontWeight: 700, color: k.delta > 0 ? '#10b981' : '#ef4444', background: k.delta > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                    {k.delta > 0 ? '+' : ''}{fmt(k.delta)}
                  </span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right' as const }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Per-Vehicle Rate Breakdown ── */}
      {data.revenueByVehicle.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 12 }}>🚛 Per-Vehicle Rate Breakdown</div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th style={{ textAlign: 'right' }}>Trips</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  <th style={{ textAlign: 'right' }}>Actual Rev</th>
                  <th style={{ textAlign: 'right' }}>Actual Payout</th>
                  <th style={{ textAlign: 'right' }}>Scenario Payout</th>
                  <th style={{ textAlign: 'right' }}>Δ Change</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueByVehicle.map((v, i) => {
                  const scenVehiclePayout = v.weight * ownerRate
                  const delta = scenVehiclePayout - v.payout
                  return (
                    <tr key={i}>
                      <td><strong>{v.plateNo}</strong></td>
                      <td style={{ textAlign: 'right' }}><span style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>{v.trips}</span></td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>{v.weight.toFixed(1)} MT</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmt(v.revenue)}</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b' }}>{fmt(v.payout)}</td>
                      <td style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>{fmt(scenVehiclePayout)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: delta <= 0 ? '#10b981' : '#ef4444' }}>{delta > 0 ? '+' : ''}{fmt(delta)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Weekly P&L (Scenario) ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 14 }}>📅 Weekly Settlement — Scenario Projection</div>
        {data.weeklyBreakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No weekly data for this period</div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th style={{ textAlign: 'right' }}>Trips</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  <th style={{ textAlign: 'right' }}>Scenario Rev</th>
                  <th style={{ textAlign: 'right' }}>Scenario Payout</th>
                  <th style={{ textAlign: 'right' }}>Deductions</th>
                  <th style={{ textAlign: 'right' }}>Net Settlement</th>
                  <th style={{ textAlign: 'right' }}>Scenario Net</th>
                </tr>
              </thead>
              <tbody>
                {[...data.weeklyBreakdown]
                  .sort((a, b) => a.weekKey.localeCompare(b.weekKey)) // Ascending chronological sort
                  .map(w => {
                  const wDeductions = Object.entries(w.expByType)
                    .filter(([type]) => refundableTypes.has(type))
                    .reduce((a, [, v]) => a + v, 0)
                  const wTotalExp = Object.values(w.expByType).reduce((a, v) => a + v, 0)
                  
                  // Use the custom rates instead of actuals to reflect UI updates
                  const wScenarioRev = w.weight * companyRate
                  const wScenarioPayout = w.weight * ownerRate
                  
                  const wSettlement = wScenarioPayout - wDeductions
                  const wMyExp = wTotalExp - wDeductions
                  const wNet = (wScenarioRev - wSettlement) - wMyExp

                  return (
                    <tr key={w.weekKey}>
                      <td style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' as const }}>{getWeekLabel(w.weekKey)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>{w.trips}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '12px' }}>{w.weight.toFixed(1)} MT</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmt(wScenarioRev)}</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '12px' }}>{fmt(wScenarioPayout)}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontSize: '12px' }}>{wDeductions > 0 ? fmt(wDeductions) : '—'}</td>
                      <td style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 700 }}>{fmt(wSettlement)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: wNet >= 0 ? '#f59e0b' : '#ef4444' }}>{fmt(wNet)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
