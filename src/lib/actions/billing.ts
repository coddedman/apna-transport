'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ========================
// Rate Override Management
// ========================

export async function setVehicleRateOverride(vehicleId: string, ownerRateOverride: number | null) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, owner: { transporterId } } })
  if (!vehicle) throw new Error('Vehicle not found')
  await prisma.vehicle.update({ where: { id: vehicleId }, data: { ownerRateOverride } })
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function setOwnerRateOverride(ownerId: string, ownerRateOverride: number | null) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')
  const owner = await prisma.owner.findFirst({ where: { id: ownerId, transporterId } })
  if (!owner) throw new Error('Owner not found')
  await prisma.owner.update({ where: { id: ownerId }, data: { ownerRateOverride } })
  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/billing')
  return { success: true }
}

// ========================
// Bill Generation
// ========================

export interface BillPeriod {
  type: 'weekly' | 'monthly' | 'custom' | 'till_date'
  startDate: string
  endDate: string
}

export interface DeductionItem {
  type: string; label: string; date: string; amount: number; note?: string
}
export interface PaidItem {
  type: string; label: string; date: string; amount: number; note?: string
}

export interface VehicleBillLine {
  plateNo: string; vehicleId: string; ownerName: string; ownerId: string
  ownerRateOverride: number | null; ownerOwnerRateOverride: number | null
  effectiveOwnerRate: number; effectiveRateSource: 'vehicle' | 'owner' | 'project' | 'default'
  trips: { id: string; date: string; invoiceNo: string | null; lrNo: string | null; weight: number; appliedOwnerRate: number; ownerFreightAmount: number; ownerPayout: number }[]
  totalTrips: number; totalWeight: number; grossPayout: number
  deductions: { fuel: number; toll: number; maintenance: number; driverAdvance: number; ownerAdvance: number; other: number; total: number; items: DeductionItem[] }
  netSettlement: number; previouslyPaid: number; paidItems: PaidItem[]; balanceDue: number
}

export interface OwnerBillSummary {
  ownerId: string; ownerName: string; vehicles: VehicleBillLine[]
  totalGross: number; totalDeductions: number; totalNet: number
  ownerAdvanceTotal: number; ownerAdvanceItems: PaidItem[]
  totalBalanceDue: number
}

export interface BillSummary {
  period: { start: string; end: string; label: string; isTillDate: boolean }
  vehicles: VehicleBillLine[]; ownerSummaries: OwnerBillSummary[]
  grandTotal: { trips: number; weight: number; grossPayout: number; totalDeductions: number; netSettlement: number; totalAdvancesPaid: number; totalBalanceDue: number }
}

export async function generateBill(
  period: BillPeriod,
  vehicleIds?: string[],
  deductibleExpenseTypes: string[] = ['TOLL', 'OWNER_ADVANCE']
): Promise<BillSummary> {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const isTillDate = period.type === 'till_date'
  // For till_date: fetch from the very beginning of records up to endDate
  const startDate = isTillDate ? new Date('2000-01-01') : new Date(period.startDate)
  const endDate = new Date(period.endDate)
  endDate.setHours(23, 59, 59, 999)

  const vehicles = await prisma.vehicle.findMany({
    where: { owner: { transporterId }, ...(vehicleIds?.length ? { id: { in: vehicleIds } } : {}) },
    include: {
      owner: true, project: true,
      trips: { where: { date: { gte: startDate, lte: endDate } }, orderBy: { date: 'asc' } },
      expenses: { where: { date: { gte: startDate, lte: endDate } } }
    }
  })

  // Fetch ALL owner advances — NO date filter. Advances are cumulative lifetime totals.
  const ownerAdvances = await prisma.ownerAdvance.findMany({
    where: { owner: { transporterId } },
    include: { owner: true }
  })

  const project = await prisma.project.findFirst({ where: { transporterId }, orderBy: { id: 'desc' } })
  const projectOwnerRate = project?.ownerRate || 125

  const processedOwnersWithAdvances = new Set<string>()

  const vehicleBills: VehicleBillLine[] = vehicles
    .filter(v => {
      if (v.trips.length > 0 || v.expenses.length > 0) return true
      if (ownerAdvances.some(a => a.ownerId === v.ownerId) && !processedOwnersWithAdvances.has(v.ownerId)) {
        processedOwnersWithAdvances.add(v.ownerId); return true
      }
      return false
    })
    .map(v => {
      const effectiveOwnerRate = v.ownerRateOverride ?? (v.owner as any).ownerRateOverride ?? v.project?.ownerRate ?? projectOwnerRate
      const effectiveRateSource = v.ownerRateOverride != null ? 'vehicle' : (v.owner as any).ownerRateOverride != null ? 'owner' : v.project?.ownerRate != null ? 'project' : 'default'

      const tripLines = v.trips.map(t => ({
        id: t.id, date: t.date.toISOString().split('T')[0],
        invoiceNo: t.invoiceNo, lrNo: t.lrNo, weight: t.weight,
        appliedOwnerRate: effectiveOwnerRate, ownerFreightAmount: t.ownerFreightAmount,
        ownerPayout: t.weight * effectiveOwnerRate,
      }))
      const grossPayout = tripLines.reduce((a, t) => a + t.ownerPayout, 0)

      const expByType = (type: string) => v.expenses.filter(e => e.type === type).reduce((a, e) => a + e.amount, 0)

      // Owner advances are handled at the owner level, not per vehicle

      // Operational deductions only (fuel, toll, maintenance, driver advance, cash payment)
      // Owner advances are ALWAYS "Already Paid" — they are cash given to the owner, not operational costs
      const deductionMap = {
        fuel: expByType('FUEL'), toll: expByType('TOLL'), maintenance: expByType('MAINTENANCE'),
        driverAdvance: expByType('DRIVER_ADVANCE'),
        ownerAdvance: 0, // Owner advances never reduce netSettlement — they reduce balanceDue
        other: expByType('CASH_PAYMENT'),
      }

      const deductTotal = Object.entries(deductionMap).reduce((sum, [key, val]) => {
        const expKey = key === 'driverAdvance' ? 'DRIVER_ADVANCE' : key === 'other' ? 'CASH_PAYMENT' : key.toUpperCase()
        // ownerAdvance is always 0 here, skip it
        if (key === 'ownerAdvance') return sum
        return deductibleExpenseTypes.includes(expKey) ? sum + val : sum
      }, 0)

      // Deduction items: only operational expenses
      const deductionItems: DeductionItem[] = v.expenses
        .filter(e => e.type !== 'OWNER_ADVANCE' && deductibleExpenseTypes.includes(e.type))
        .map(e => ({
          type: e.type,
          label: ({ FUEL: '⛽ Fuel', TOLL: '🛣️ Toll', MAINTENANCE: '🔧 Maintenance', DRIVER_ADVANCE: '👤 Driver Advance', CASH_PAYMENT: '💵 Cash Payment' } as any)[e.type] ?? e.type,
          date: e.date.toISOString().split('T')[0], amount: e.amount, note: e.remarks ?? undefined,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Per-vehicle paid items (cash payments only — advances are at owner level)
      const paidItems: PaidItem[] = v.expenses
        .filter(e => e.type === 'CASH_PAYMENT' && !deductibleExpenseTypes.includes(e.type))
        .map(e => ({ type: e.type, label: '💵 Cash Payment', date: e.date.toISOString().split('T')[0], amount: e.amount, note: e.remarks ?? undefined }))
        .sort((a, b) => a.date.localeCompare(b.date))
      const previouslyPaid = paidItems.reduce((s, p) => s + p.amount, 0)

      return {
        plateNo: v.plateNo, vehicleId: v.id, ownerName: v.owner.ownerName, ownerId: v.ownerId,
        ownerRateOverride: v.ownerRateOverride, ownerOwnerRateOverride: (v.owner as any).ownerRateOverride ?? null,
        effectiveOwnerRate, effectiveRateSource, trips: tripLines,
        totalTrips: tripLines.length, totalWeight: tripLines.reduce((a, t) => a + t.weight, 0),
        grossPayout,
        deductions: { ...deductionMap, total: deductTotal, items: deductionItems },
        netSettlement: grossPayout - deductTotal,
        previouslyPaid, paidItems,
        balanceDue: grossPayout - deductTotal - previouslyPaid,
      }
    })

  // Build owner summaries — advances are cumulative at owner level
  const ownerMap = new Map<string, OwnerBillSummary>()
  for (const vb of vehicleBills) {
    if (!ownerMap.has(vb.ownerId)) {
      const advItems = ownerAdvances.filter(a => a.ownerId === vb.ownerId)
      const advTotal = advItems.reduce((s, a) => s + a.amount, 0)
      ownerMap.set(vb.ownerId, {
        ownerId: vb.ownerId, ownerName: vb.ownerName, vehicles: [],
        totalGross: 0, totalDeductions: 0, totalNet: 0,
        ownerAdvanceTotal: advTotal,
        ownerAdvanceItems: advItems.map(a => ({ type: 'OWNER_ADVANCE', label: '🏦 Owner Advance', date: a.date.toISOString().split('T')[0], amount: a.amount, note: a.remarks ?? undefined })).sort((a, b) => a.date.localeCompare(b.date)),
        totalBalanceDue: 0,
      })
    }
    const os = ownerMap.get(vb.ownerId)!
    os.vehicles.push(vb)
    os.totalGross += vb.grossPayout
    os.totalDeductions += vb.deductions.total
    os.totalNet += vb.netSettlement
  }
  // Calculate balance due at owner level: Net - Advances
  for (const os of ownerMap.values()) {
    os.totalBalanceDue = os.totalNet - os.ownerAdvanceTotal
  }

  const ownerSums = [...ownerMap.values()]
  const grandTotal = {
    trips: vehicleBills.reduce((a, v) => a + v.totalTrips, 0),
    weight: vehicleBills.reduce((a, v) => a + v.totalWeight, 0),
    grossPayout: ownerSums.reduce((a, o) => a + o.totalGross, 0),
    totalDeductions: ownerSums.reduce((a, o) => a + o.totalDeductions, 0),
    netSettlement: ownerSums.reduce((a, o) => a + o.totalNet, 0),
    totalAdvancesPaid: ownerSums.reduce((a, o) => a + o.ownerAdvanceTotal, 0),
    totalBalanceDue: ownerSums.reduce((a, o) => a + o.totalBalanceDue, 0),
  }

  const fmtD = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const periodLabel = isTillDate
    ? `All records till ${fmtD(endDate)}`
    : period.type === 'weekly' ? `Week of ${fmtD(startDate)}`
    : period.type === 'monthly' ? startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : `${fmtD(startDate)} – ${fmtD(endDate)}`

  return {
    period: { start: isTillDate ? '' : period.startDate, end: period.endDate, label: periodLabel, isTillDate },
    vehicles: vehicleBills, ownerSummaries: ownerSums, grandTotal,
  }
}

export async function getVehiclesWithRates() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []
  return prisma.vehicle.findMany({ where: { owner: { transporterId } }, include: { owner: true, project: true }, orderBy: { plateNo: 'asc' } })
}

export async function getOwnersWithRates() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []
  return prisma.owner.findMany({ where: { transporterId }, include: { vehicles: { include: { project: true } } }, orderBy: { ownerName: 'asc' } })
}
