'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  vehicles: { id: string; plateNo: string }[]
  projects: { id: string; projectName: string }[]
}

const EXP_TYPES = [
  { value: 'FUEL', label: '⛽ Fuel' },
  { value: 'DRIVER_ADVANCE', label: '🧑‍✈️ Driver Advance' },
  { value: 'OWNER_ADVANCE', label: '👤 Owner Advance' },
  { value: 'MAINTENANCE', label: '🔧 Maintenance' },
  { value: 'TOLL', label: '🛤️ Toll' },
  { value: 'CASH_PAYMENT', label: '💵 Cash Payment' },
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
    <button type="button" onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      cursor: 'pointer', transition: 'all 0.15s',
      border: active ? `1px solid ${color}50` : '1px solid var(--color-border)',
      background: active ? `${color}18` : 'var(--color-bg-primary)',
      color: active ? color : 'var(--color-text-muted)',
      whiteSpace: 'nowrap' as const,
    }}>
      {active ? '✓ ' : ''}{label}
    </button>
  )

  const sectionLabel = (txt: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>{txt}</div>
  )

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ padding: '14px 16px' }}>
        {/* Row 1: Category + Dates */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const, marginBottom: 12 }}>
          <div>
            {sectionLabel('Category')}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {EXP_TYPES.map(t => pillBtn(t.label, selTypes.includes(t.value), () => toggle(selTypes, t.value, setSelTypes), '#ef4444'))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginLeft: 'auto', flexWrap: 'wrap' as const }}>
            <div>
              {sectionLabel('From')}
              <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)}
                style={{ padding: '5px 10px', fontSize: 12, width: 140 }} />
            </div>
            <div>
              {sectionLabel('To')}
              <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)}
                style={{ padding: '5px 10px', fontSize: 12, width: 140 }} />
            </div>
          </div>
        </div>

        {/* Row 2: Vehicles */}
        <div style={{ marginBottom: 12 }}>
          {sectionLabel(`Vehicle ${selVehicles.length > 0 ? `(${selVehicles.length} selected)` : ''}`)}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {pillBtn('All Vehicles', selVehicles.length === 0, () => setSelVehicles([]), '#10b981')}
            {vehicles.map(v => pillBtn(v.plateNo, selVehicles.includes(v.id), () => toggle(selVehicles, v.id, setSelVehicles), '#3b82f6'))}
          </div>
        </div>

        {/* Row 3: Projects */}
        {projects.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {sectionLabel(`Project ${selProjects.length > 0 ? `(${selProjects.length} selected)` : ''}`)}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {pillBtn('All Projects', selProjects.length === 0, () => setSelProjects([]), '#10b981')}
              {projects.map(p => pillBtn(p.projectName, selProjects.includes(p.id), () => toggle(selProjects, p.id, setSelProjects), '#8b5cf6'))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={applyFilter} className="btn btn-primary btn-sm" style={{ padding: '6px 18px', fontSize: 12 }}>
            🔍 Apply Filter
          </button>
          {hasFilter && (
            <button onClick={clearAll} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: 12 }}>
              ✕ Clear All
            </button>
          )}
          {hasFilter && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', alignSelf: 'center', marginLeft: 4 }}>
              {selVehicles.length > 0 && `${selVehicles.length} vehicle${selVehicles.length > 1 ? 's' : ''}`}
              {selProjects.length > 0 && ` · ${selProjects.length} project${selProjects.length > 1 ? 's' : ''}`}
              {selTypes.length > 0 && ` · ${selTypes.length} category${selTypes.length > 1 ? 'ies' : ''}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
