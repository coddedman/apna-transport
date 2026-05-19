'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  vehicles: { id: string; plateNo: string }[]
  projects: { id: string; projectName: string }[]
}

const EXP_TYPES = [
  { value: 'FUEL', label: '⛽ Fuel', color: '#f59e0b' },
  { value: 'DRIVER_ADVANCE', label: '🧑‍✈️ Driver Advance', color: '#3b82f6' },
  { value: 'OWNER_ADVANCE', label: '👤 Owner Advance', color: '#8b5cf6' },
  { value: 'MAINTENANCE', label: '🔧 Maintenance', color: '#ec4899' },
  { value: 'TOLL', label: '🛤️ Toll', color: '#10b981' },
  { value: 'CASH_PAYMENT', label: '💵 Cash Payment', color: '#ef4444' },
]

export default function ExpenseFilterBar({ vehicles, projects }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  // Read current selections from URL
  const initVehicles = sp.getAll('vehicleId')
  const initProjects = sp.getAll('projectId')
  const initTypes = sp.getAll('type')

  const [selVehicles, setSelVehicles] = useState<string[]>(initVehicles)
  const [selProjects, setSelProjects] = useState<string[]>(initProjects)
  const [selTypes, setSelTypes] = useState<string[]>(initTypes)
  const [from, setFrom] = useState(sp.get('from') || '')
  const [to, setTo] = useState(sp.get('to') || '')

  const toggle = (arr: string[], val: string, set: (a: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const applyFilter = () => {
    const params = new URLSearchParams()
    selVehicles.forEach(v => params.append('vehicleId', v))
    selProjects.forEach(p => params.append('projectId', p))
    selTypes.forEach(t => params.append('type', t))
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    router.push(`/dashboard/expenses?${params.toString()}`)
  }

  const clearAll = () => {
    setSelVehicles([]); setSelProjects([]); setSelTypes([]); setFrom(''); setTo('')
    router.push('/dashboard/expenses')
  }

  const hasFilter = selVehicles.length > 0 || selProjects.length > 0 || selTypes.length > 0 || from || to

  const pillBtn = (
    label: string, active: boolean, onClick: () => void, color = '#f59e0b'
  ) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: '30px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: active ? `1px solid ${color}` : '1px solid rgba(255, 255, 255, 0.08)',
        background: active ? `${color}18` : 'rgba(255, 255, 255, 0.03)',
        color: active ? color : 'var(--color-text-secondary)',
        whiteSpace: 'nowrap' as const,
        boxShadow: active ? `0 4px 12px ${color}15` : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
      className="filter-pill-btn"
    >
      {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
      {label}
    </button>
  )

  const sectionLabel = (txt: string, count?: number) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
    }}>
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
      }}>{txt}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          background: 'var(--color-accent-subtle)',
          color: 'var(--color-accent)',
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '10px',
          lineHeight: 1,
        }}>
          {count}
        </span>
      )}
    </div>
  )

  return (
    <div className="card" style={{
      marginBottom: 20,
      background: 'rgba(30, 41, 59, 0.3)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
    }}>
      <div style={{ padding: '20px' }}>
        
        {/* Main Grid: Categories vs. Dates */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
          marginBottom: '20px',
        }} className="filter-top-grid">
          
          {/* Category Filter */}
          <div>
            {sectionLabel('Category', selTypes.length)}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap' as const,
            }}>
              {EXP_TYPES.map(t => pillBtn(
                t.label,
                selTypes.includes(t.value),
                () => toggle(selTypes, t.value, setSelTypes),
                t.color
              ))}
            </div>
          </div>

          {/* Date Picker Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}>
            <div>
              {sectionLabel('From Date')}
              <input
                className="form-input"
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                style={{
                  height: '38px',
                  fontSize: '13px',
                  background: 'var(--color-bg-primary)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              />
            </div>
            <div>
              {sectionLabel('To Date')}
              <input
                className="form-input"
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                style={{
                  height: '38px',
                  fontSize: '13px',
                  background: 'var(--color-bg-primary)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Vehicles selection */}
        <div style={{ marginBottom: '20px' }}>
          {sectionLabel('Vehicle', selVehicles.length)}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap' as const,
            maxHeight: '120px',
            overflowY: 'auto' as const,
            padding: '4px 0',
          }}>
            {pillBtn('🚛 All Vehicles', selVehicles.length === 0, () => setSelVehicles([]), '#10b981')}
            {vehicles.map(v => pillBtn(
              v.plateNo,
              selVehicles.includes(v.id),
              () => toggle(selVehicles, v.id, setSelVehicles),
              '#3b82f6'
            ))}
          </div>
        </div>

        {/* Projects selection */}
        {projects.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            {sectionLabel('Project', selProjects.length)}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap' as const,
              maxHeight: '120px',
              overflowY: 'auto' as const,
              padding: '4px 0',
            }}>
              {pillBtn('📁 All Projects', selProjects.length === 0, () => setSelProjects([]), '#10b981')}
              {projects.map(p => pillBtn(
                p.projectName,
                selProjects.includes(p.id),
                () => toggle(selProjects, p.id, setSelProjects),
                '#8b5cf6'
              ))}
            </div>
          </div>
        )}

        {/* Actions panel */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '16px',
          marginTop: '8px',
          flexWrap: 'wrap' as const,
          gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={applyFilter}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                height: '38px',
              }}
            >
              🔍 Apply Filter
            </button>
            {hasFilter && (
              <button
                onClick={clearAll}
                className="btn btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  height: '38px',
                }}
              >
                ✕ Clear All
              </button>
            )}
          </div>

          {hasFilter && (
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '6px 14px',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}>
              Active Selections: {[
                selTypes.length > 0 && `${selTypes.length} Category`,
                selVehicles.length > 0 && `${selVehicles.length} Vehicle`,
                selProjects.length > 0 && `${selProjects.length} Project`,
                (from || to) && 'Date Range'
              ].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>
      
      {/* Styles for filter top grid media queries */}
      <style jsx global>{`
        @media (min-width: 1024px) {
          .filter-top-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
        .filter-pill-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  )
}
