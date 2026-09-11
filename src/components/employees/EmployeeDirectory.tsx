'use client'

import { useState, useMemo } from 'react'
import { Designation, CostBucket } from '@prisma/client'
import { Card, CardHeader } from '@/components/ui/Card'
import { KpiStat } from '@/components/ui/KpiStat'
import { Table, TableHead, TableRow, TableHeader, TableCell, TableFoot, TableFootCell } from '@/components/ui/Table'
import type { EmployeeSummary } from '@/lib/actions/employees'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

const lk = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  return fmt(n)
}

const DESIGNATION_LABELS: Record<Designation, string> = {
  DRIVER: 'Driver',
  MECHANIC: 'Mechanic',
  FIELD_MANAGER: 'Field Manager',
  ACCOUNTANT: 'Accountant',
  DISPATCHER: 'Dispatcher',
  HR_ADMIN: 'HR / Admin',
  WEIGHBRIDGE_OPERATOR: 'Weighbridge Op.',
  OTHER: 'Other',
}

const COST_BUCKET_LABELS: Record<CostBucket, string> = {
  VEHICLE: 'Vehicle',
  PROJECT: 'Project',
  OVERHEAD: 'Overhead',
}

// Token pair per designation so badges theme with light/dark.
const DESIGNATION_COLORS: Record<Designation, { fg: string; bg: string }> = {
  DRIVER: { fg: 'var(--color-accent)', bg: 'var(--color-accent-subtle)' },
  MECHANIC: { fg: 'var(--color-purple)', bg: 'var(--color-purple-subtle)' },
  FIELD_MANAGER: { fg: 'var(--color-orange)', bg: 'var(--color-orange-subtle)' },
  ACCOUNTANT: { fg: 'var(--color-success)', bg: 'var(--color-success-subtle)' },
  DISPATCHER: { fg: 'var(--color-info)', bg: 'var(--color-info-subtle)' },
  HR_ADMIN: { fg: 'var(--color-danger)', bg: 'var(--color-danger-subtle)' },
  WEIGHBRIDGE_OPERATOR: { fg: 'var(--color-warning)', bg: 'var(--color-warning-subtle)' },
  OTHER: { fg: 'var(--color-text-muted)', bg: 'var(--color-bg-secondary)' },
}

const icon = (paths: string[], size = 17) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
)

const IC_ID = ['M3 5h18v14H3z', 'M8.5 11a2 2 0 100-4 2 2 0 000 4z', 'M5.5 16a3 3 0 016 0', 'M13.5 9h5', 'M13.5 13h4']
const IC_BRIEFCASE = ['M4 7h16v13H4z', 'M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2', 'M4 12h16']
const IC_USER = ['M12 12a4 4 0 100-8 4 4 0 000 8z', 'M4.5 20a7.5 7.5 0 0115 0']
const IC_BANKNOTE = ['M4 6h16v12H4z', 'M12 9a3 3 0 100 6 3 3 0 000-6z', 'M7 12h.01', 'M17 12h.01']

export interface EmployeeRow {
  id: string
  name: string
  phone: string | null
  designation: Designation
  assignedTo: string | null
  costBucket: CostBucket
  salary: number
  onLeave: boolean
}

export default function EmployeeDirectory({
  employees,
  summary,
}: {
  employees: EmployeeRow[]
  summary: EmployeeSummary
}) {
  const [filter, setFilter] = useState<Designation | 'ALL'>('ALL')

  const visible = useMemo(
    () => (filter === 'ALL' ? employees : employees.filter(e => e.designation === filter)),
    [employees, filter]
  )

  const visiblePayroll = useMemo(() => visible.reduce((s, e) => s + e.salary, 0), [visible])

  const chips: { key: Designation | 'ALL'; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Staff', count: summary.total },
    ...summary.byDesignation.map(d => ({ key: d.designation, label: d.label, count: d.count })),
  ]

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px] mb-[16px]">
        <KpiStat icon={icon(IC_ID)} label="Total Employees" value={summary.total} />
        <KpiStat
          icon={icon(IC_BRIEFCASE)}
          label="Designations"
          value={summary.designations}
          colorClass="text-[var(--color-purple)] bg-[var(--color-purple-subtle)]"
        />
        <KpiStat
          icon={icon(IC_USER)}
          label="Present Today"
          value={`${summary.presentToday} / ${summary.total}`}
          colorClass="text-[var(--color-success)] bg-[var(--color-success-subtle)]"
        />
        <KpiStat
          icon={icon(IC_BANKNOTE)}
          label="Monthly Payroll"
          value={lk(summary.monthlyPayroll)}
          colorClass="text-[var(--color-orange)] bg-[var(--color-orange-subtle)]"
        />
      </div>

      {/* Designation filter chips */}
      <div className="flex gap-[8px] flex-wrap mb-[16px]">
        {chips.map(c => {
          const on = filter === c.key
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className="inline-flex items-center px-[14px] py-[7px] rounded-full text-[12px] font-semibold cursor-pointer border transition-colors"
              style={{
                borderColor: on ? 'var(--color-accent)' : 'var(--color-border)',
                background: on ? 'var(--color-accent-subtle)' : 'var(--color-bg-card)',
                color: on ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              }}
            >
              {c.label} · {c.count}
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader
          title="Staff Directory"
          rightContent={
            <span className="text-[12px] text-[var(--color-text-muted)]">
              by designation · monthly payroll
            </span>
          }
        />
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Employee</TableHeader>
              <TableHeader>Designation</TableHeader>
              <TableHeader>Assigned To</TableHeader>
              <TableHeader>Cost Bucket</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader align="right">Salary / mo ₹</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <TableCell colSpan={6} align="center" className="!text-[var(--color-text-muted)] py-[40px]">
                  {filter === 'ALL'
                    ? 'No employees yet. Add your first staff member to start tracking payroll.'
                    : 'No employees with this designation.'}
                </TableCell>
              </tr>
            ) : (
              visible.map(e => {
                const dc = DESIGNATION_COLORS[e.designation]
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-[10px]">
                        <span
                          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: dc.bg, color: dc.fg }}
                        >
                          {e.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-[var(--color-text-primary)] font-semibold">{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center px-[10px] py-[3px] rounded-full text-[11px] font-semibold"
                        style={{ background: dc.bg, color: dc.fg }}
                      >
                        {DESIGNATION_LABELS[e.designation]}
                      </span>
                    </TableCell>
                    <TableCell>{e.assignedTo || '—'}</TableCell>
                    <TableCell>{COST_BUCKET_LABELS[e.costBucket]}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center px-[10px] py-[3px] rounded-full text-[11px] font-semibold"
                        style={{
                          background: e.onLeave ? 'var(--color-warning-subtle)' : 'var(--color-success-subtle)',
                          color: e.onLeave ? 'var(--color-warning)' : 'var(--color-success)',
                        }}
                      >
                        {e.onLeave ? 'On leave' : 'Present'}
                      </span>
                    </TableCell>
                    <TableCell align="right" tabularNums>
                      <strong className="text-[var(--color-text-primary)] font-semibold">{fmt(e.salary)}</strong>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </tbody>
          {visible.length > 0 && (
            <TableFoot>
              <tr>
                <TableFootCell colSpan={5}>
                  {visible.length} employee{visible.length === 1 ? '' : 's'} · total monthly payroll
                </TableFootCell>
                <TableFootCell align="right" tabularNums>
                  <strong className="text-[var(--color-text-primary)]">{fmt(visiblePayroll)}</strong>
                </TableFootCell>
              </tr>
            </TableFoot>
          )}
        </Table>
      </Card>
    </>
  )
}
