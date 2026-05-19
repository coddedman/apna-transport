'use client'

import { useState, useEffect, useRef } from 'react'
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

interface MultiSelectProps {
  label: string
  options: { value: string; label: string; color?: string }[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
  icon?: string
}

function MultiSelectDropdown({ label, options, selected, onChange, placeholder, icon }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(x => x !== val))
    } else {
      onChange([...selected, val])
    }
  }

  const selectedLabels = options
    .filter(o => selected.includes(o.value))
    .map(o => o.label.replace(/^[^\s]+\s+/, '')) // Strip emoji for cleaner button text if needed, or keep it

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === options.length
      ? 'All Selected'
      : selectedLabels.join(', ')

  return (
    <div ref={containerRef} className="form-group" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px', flex: '1 1 180px', marginBottom: 0 }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '8px 12px',
          background: 'var(--color-bg-primary)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          color: selected.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontSize: '13px',
          cursor: 'pointer',
          textAlign: 'left',
          height: '38px',
          transition: 'all 0.15s ease',
        }}
        className="multiselect-trigger"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
          {icon && <span>{icon}</span>}
          {displayText}
        </span>
        <span style={{ fontSize: '9px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--color-text-muted)' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          marginTop: '6px',
          background: 'var(--color-bg-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '6px',
        }} className="scrollbar-thin">
          {options.map(opt => {
            const isChecked = selected.includes(opt.value)
            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleOption(opt.value)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isChecked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  background: isChecked ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
                className="multiselect-item"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  style={{
                    cursor: 'pointer',
                    width: '14px',
                    height: '14px',
                    accentColor: opt.color || 'var(--color-accent)',
                  }}
                />
                <span style={{ pointerEvents: 'none' }}>{opt.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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

  // Map options
  const categoryOptions = EXP_TYPES
  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: v.plateNo }))
  const projectOptions = projects.map(p => ({ value: p.id, label: p.projectName }))

  return (
    <div className="card" style={{
      marginBottom: '20px',
      background: 'rgba(30, 41, 59, 0.25)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      overflow: 'visible',
    }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, alignItems: 'flex-end', padding: '16px 20px' }}>
        
        {/* Category Multiselect */}
        <MultiSelectDropdown
          label="Category"
          options={categoryOptions}
          selected={selTypes}
          onChange={setSelTypes}
          placeholder="All Categories"
          icon="🏷️"
        />

        {/* Vehicle Multiselect */}
        <MultiSelectDropdown
          label="Vehicle"
          options={vehicleOptions}
          selected={selVehicles}
          onChange={setSelVehicles}
          placeholder="All Vehicles"
          icon="🚛"
        />

        {/* Project Multiselect */}
        {projects.length > 0 && (
          <MultiSelectDropdown
            label="Project"
            options={projectOptions}
            selected={selProjects}
            onChange={setSelProjects}
            placeholder="All Projects"
            icon="📁"
          />
        )}

        {/* From Date */}
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px', flex: '1 1 140px', marginBottom: 0 }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            From
          </label>
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
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* To Date */}
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px', flex: '1 1 140px', marginBottom: 0 }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            To
          </label>
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
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Actions Button Container */}
        <div style={{ display: 'flex', gap: '8px', minWidth: '180px', flex: '1 1 180px' }}>
          <button
            onClick={applyFilter}
            className="btn btn-primary"
            style={{
              height: '38px',
              fontSize: '13px',
              padding: '0 16px',
              flex: 2,
              justifyContent: 'center',
            }}
          >
            🔍 Filter
          </button>
          {hasFilter && (
            <button
              onClick={clearAll}
              className="btn btn-secondary"
              style={{
                height: '38px',
                fontSize: '13px',
                padding: '0 12px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Styles for list items and triggers */}
      <style jsx global>{`
        .multiselect-trigger:hover {
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .multiselect-item:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  )
}
