import React from 'react'
import { Card } from './Card'

export interface KpiStatProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  colorClass?: string // Tailwind classes for text and bg colors
  sparkline?: React.ReactNode
}

export function KpiStat({ icon, label, value, trend, trendUp, colorClass = 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]', sparkline }: KpiStatProps) {
  return (
    <Card className="p-[14px_16px] md:p-[18px_18px]">
      <div className="flex items-center justify-between mb-[14px]">
        <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${colorClass}`}>
          {icon}
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11px] font-semibold ${trendUp ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]' : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {trendUp ? <path d="M3 17l6-6 4 4 8-8" /> : <path d="M3 7l6 6 4-4 8 8" />}
              {trendUp ? <path d="M15 7h6v6" /> : <path d="M15 17h6v-6" />}
            </svg>
            {trend}
          </span>
        )}
      </div>
      
      <div className="text-[25px] font-bold tracking-[-0.03em] leading-[1.05] text-[var(--color-text-primary)] tabular-nums">
        {value}
      </div>
      
      <div className="flex items-end justify-between gap-[10px] mt-[5px]">
        <span className="text-[12.5px] text-[var(--color-text-muted)]">{label}</span>
        {sparkline && (
          <div className="w-[64px] h-[18px] shrink-0">
            {sparkline}
          </div>
        )}
      </div>
    </Card>
  )
}
