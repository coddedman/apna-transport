import React from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="inline-flex gap-[2px] mb-[20px] p-[4px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[11px] overflow-x-auto max-w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-[6px] p-[8px_13px] rounded-[8px] text-[12.5px] font-semibold whitespace-nowrap transition-all ${isActive ? 'text-[var(--color-accent)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] bg-transparent'}`}
          >
            {tab.icon && <span className="flex">{tab.icon}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
