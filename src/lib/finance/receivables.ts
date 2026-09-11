import type { BillStatus } from '@prisma/client'

export interface Receivable {
  billAmount: number
  incentive?: number | null
  totalWeight: number
  receivedAmount: number
  dueDate?: Date | string | null
}

export const money = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100

export function incentiveTotal(rate: number | null | undefined, weight: number) {
  return money((rate || 0) * (weight > 0 ? weight : 1))
}

export function totalPayableFor(bill: Pick<Receivable, 'billAmount' | 'incentive' | 'totalWeight'>) {
  return money(bill.billAmount + incentiveTotal(bill.incentive, bill.totalWeight))
}

export function outstandingFor(bill: Receivable) {
  return Math.max(0, money(totalPayableFor(bill) - bill.receivedAmount))
}

// Due dates are date-only values. An invoice is due for the entire day in India.
export function daysPastDue(dueDate: Date | string | null | undefined, now = new Date()) {
  if (!dueDate) return 0
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const due = new Date(dueDate).toISOString().slice(0, 10)
  return Math.max(0, Math.round((Date.parse(today) - Date.parse(due)) / 86400000))
}

export function statusFor(bill: Receivable, now = new Date()): BillStatus {
  if (outstandingFor(bill) === 0) return 'PAID'
  if (daysPastDue(bill.dueDate, now) > 0) return 'OVERDUE'
  return bill.receivedAmount > 0 ? 'PARTIAL' : 'PENDING'
}

export const agingLabels = ['Current / no due date', '1–30 days', '31–60 days', '60+ days'] as const
export function agingBucketFor(bill: Receivable, now = new Date()) {
  const days = daysPastDue(bill.dueDate, now)
  return days === 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : 3
}

export function validDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a valid date`)
  }
  return new Date(value)
}

export function validateAmount(value: number, label: string, allowZero = false) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) throw new Error(`${label} must be ${allowZero ? 'zero or positive' : 'positive'}`)
}
