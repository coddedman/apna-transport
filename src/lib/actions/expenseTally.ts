'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

async function getTransporterId() {
  const session = await auth()
  const tid = (session?.user as any)?.transporterId
  if (!tid) throw new Error('Unauthorized')
  return tid
}

// ========================
// Expense Tally / Audit
// ========================

export interface VehicleExpenseTally {
  vehicleId: string
  plateNo: string
  ownerName: string
  tripsCount: number
  totalWeight: number
  totalRevenue: number
  // Expense breakdown
  fuelAmount: number
  fuelCount: number
  tollAmount: number
  tollCount: number
  maintenanceAmount: number
  maintenanceCount: number
  driverAdvanceAmount: number
  driverAdvanceCount: number
  cashPaymentAmount: number
  cashPaymentCount: number
  ownerAdvanceAmount: number
  ownerAdvanceCount: number
  totalExpenses: number
  // Flags for missing
  missingCategories: string[]
  // Derived
  expensePerTrip: number
  fuelPerTrip: number
  daysActive: number
  lastExpenseDate: string | null
  lastTripDate: string | null
}

export interface ExpenseTallyResult {
  periodLabel: string
  periodStart: string
  periodEnd: string
  vehicles: VehicleExpenseTally[]
  summary: {
    totalVehicles: number
    vehiclesWithTrips: number
    vehiclesWithMissing: number
    totalTrips: number
    totalExpenses: number
    totalMissing: number
    missingBreakdown: { category: string; count: number }[]
  }
}

// Expected expense categories for vehicles that have trips
const EXPECTED_CATEGORIES = ['FUEL', 'TOLL'] as const
// Advisory categories — flagged but less critical
const ADVISORY_CATEGORIES = ['MAINTENANCE'] as const

export async function getExpenseTally(startDate: string, endDate: string): Promise<ExpenseTallyResult> {
  const tid = await getTransporterId()

  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T23:59:59')

  // Fetch vehicles with trips and expenses in the period
  const vehicles = await prisma.vehicle.findMany({
    where: { owner: { transporterId: tid } },
    include: {
      owner: { select: { ownerName: true } },
      trips: {
        where: { date: { gte: start, lte: end } },
        select: { date: true, weight: true, ownerFreightAmount: true },
      },
      expenses: {
        where: { date: { gte: start, lte: end } },
        select: { type: true, amount: true, date: true },
      },
    },
    orderBy: { plateNo: 'asc' },
  })

  // Also fetch owner advances in this period per owner
  const ownerAdvances = await prisma.ownerAdvance.findMany({
    where: { owner: { transporterId: tid }, date: { gte: start, lte: end } },
    select: { ownerId: true, amount: true },
  })
  const advanceByOwner = new Map<string, { amount: number; count: number }>()
  for (const adv of ownerAdvances) {
    const existing = advanceByOwner.get(adv.ownerId) || { amount: 0, count: 0 }
    existing.amount += adv.amount
    existing.count += 1
    advanceByOwner.set(adv.ownerId, existing)
  }

  const tallyVehicles: VehicleExpenseTally[] = vehicles.map(v => {
    const tripsCount = v.trips.length
    const totalWeight = v.trips.reduce((s, t) => s + t.weight, 0)
    const totalRevenue = v.trips.reduce((s, t) => s + t.ownerFreightAmount, 0)

    const expByType = (type: string) => {
      const items = v.expenses.filter(e => e.type === type)
      return { amount: items.reduce((s, e) => s + e.amount, 0), count: items.length }
    }

    const fuel = expByType('FUEL')
    const toll = expByType('TOLL')
    const maint = expByType('MAINTENANCE')
    const driverAdv = expByType('DRIVER_ADVANCE')
    const cashPmt = expByType('CASH_PAYMENT')
    const ownerAdv = advanceByOwner.get(v.ownerId) || { amount: 0, count: 0 }

    const totalExpenses = fuel.amount + toll.amount + maint.amount + driverAdv.amount + cashPmt.amount

    // Determine missing categories — only for vehicles with trips
    const missingCategories: string[] = []
    if (tripsCount > 0) {
      for (const cat of EXPECTED_CATEGORIES) {
        const exp = expByType(cat)
        if (exp.count === 0) missingCategories.push(cat)
      }
      for (const cat of ADVISORY_CATEGORIES) {
        const exp = expByType(cat)
        if (exp.count === 0) missingCategories.push(cat)
      }
    }

    // Compute days active and last dates
    const tripDates = v.trips.map(t => t.date)
    const expDates = v.expenses.map(e => e.date)
    const uniqueTripDays = new Set(tripDates.map(d => d.toISOString().split('T')[0]))

    const lastTripDate = tripDates.length > 0
      ? new Date(Math.max(...tripDates.map(d => d.getTime()))).toISOString().split('T')[0]
      : null
    const lastExpenseDate = expDates.length > 0
      ? new Date(Math.max(...expDates.map(d => d.getTime()))).toISOString().split('T')[0]
      : null

    return {
      vehicleId: v.id,
      plateNo: v.plateNo,
      ownerName: v.owner.ownerName,
      tripsCount,
      totalWeight,
      totalRevenue,
      fuelAmount: fuel.amount, fuelCount: fuel.count,
      tollAmount: toll.amount, tollCount: toll.count,
      maintenanceAmount: maint.amount, maintenanceCount: maint.count,
      driverAdvanceAmount: driverAdv.amount, driverAdvanceCount: driverAdv.count,
      cashPaymentAmount: cashPmt.amount, cashPaymentCount: cashPmt.count,
      ownerAdvanceAmount: ownerAdv.amount, ownerAdvanceCount: ownerAdv.count,
      totalExpenses,
      missingCategories,
      expensePerTrip: tripsCount > 0 ? totalExpenses / tripsCount : 0,
      fuelPerTrip: tripsCount > 0 ? fuel.amount / tripsCount : 0,
      daysActive: uniqueTripDays.size,
      lastExpenseDate,
      lastTripDate,
    }
  })

  // Only show vehicles that have activity
  const activeVehicles = tallyVehicles.filter(v => v.tripsCount > 0 || v.totalExpenses > 0)

  // Sort: vehicles with missing categories first, then by trips descending
  activeVehicles.sort((a, b) => {
    if (a.missingCategories.length !== b.missingCategories.length) {
      return b.missingCategories.length - a.missingCategories.length
    }
    return b.tripsCount - a.tripsCount
  })

  // Build summary
  const vehiclesWithTrips = activeVehicles.filter(v => v.tripsCount > 0).length
  const vehiclesWithMissing = activeVehicles.filter(v => v.missingCategories.length > 0).length
  const totalMissing = activeVehicles.reduce((s, v) => s + v.missingCategories.length, 0)

  // Missing breakdown by category
  const missingCount: Record<string, number> = {}
  for (const v of activeVehicles) {
    for (const cat of v.missingCategories) {
      missingCount[cat] = (missingCount[cat] || 0) + 1
    }
  }
  const missingBreakdown = Object.entries(missingCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const fmtD = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const periodLabel = `${fmtD(start)} – ${fmtD(end)}`

  return {
    periodLabel,
    periodStart: startDate,
    periodEnd: endDate,
    vehicles: activeVehicles,
    summary: {
      totalVehicles: activeVehicles.length,
      vehiclesWithTrips,
      vehiclesWithMissing,
      totalTrips: activeVehicles.reduce((s, v) => s + v.tripsCount, 0),
      totalExpenses: activeVehicles.reduce((s, v) => s + v.totalExpenses, 0),
      totalMissing,
      missingBreakdown,
    },
  }
}
