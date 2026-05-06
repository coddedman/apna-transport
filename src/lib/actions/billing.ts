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

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, owner: { transporterId } }
  })
  if (!vehicle) throw new Error('Vehicle not found')

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { ownerRateOverride }
  })

  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function setOwnerRateOverride(ownerId: string, ownerRateOverride: number | null) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const owner = await prisma.owner.findFirst({
    where: { id: ownerId, transporterId }
  })
  if (!owner) throw new Error('Owner not found')

  await prisma.owner.update({
    where: { id: ownerId },
    data: { ownerRateOverride }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/billing')
  return { success: true }
}

// ========================
// Bill Generation
// ========================

export interface BillPeriod {
  type: 'weekly' | 'monthly' | 'custom'
  startDate: string  // ISO date
  endDate: string    // ISO date
}

export interface VehicleBillLine {
  plateNo: string
  vehicleId: string
  ownerName: string
  ownerId: string
  ownerRateOverride: number | null
  ownerOwnerRateOverride: number | null   // owner-level override
  effectiveOwnerRate: number
  effectiveRateSource: 'vehicle' | 'owner' | 'project' | 'default'
  trips: {
    id: string
    date: string
    invoiceNo: string | null
    lrNo: string | null
    weight: number
    appliedOwnerRate: number
    ownerFreightAmount: number
    ownerPayout: number
  }[]
  totalTrips: number
  totalWeight: number
  grossPayout: number
  deductions: {
    fuel: number
    toll: number
    maintenance: number
    driverAdvance: number
    ownerAdvance: number
    other: number
    total: number
  }
  netSettlement: number
}

export interface BillSummary {
  period: { start: string; end: string; label: string }
  vehicles: VehicleBillLine[]
  grandTotal: {
    trips: number
    weight: number
    grossPayout: number
    totalDeductions: number
    netSettlement: number
  }
}

export async function generateBill(
  period: BillPeriod,
  vehicleIds?: string[],  // if empty, all vehicles
  deductibleExpenseTypes: string[] = ['TOLL', 'OWNER_ADVANCE']
): Promise<BillSummary> {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const startDate = new Date(period.startDate)
  const endDate = new Date(period.endDate)
  endDate.setHours(23, 59, 59, 999)

  // Fetch all vehicles for this transporter (filtered if vehicleIds given)
  const vehicles = await prisma.vehicle.findMany({
    where: {
      owner: { transporterId },
      ...(vehicleIds && vehicleIds.length > 0 ? { id: { in: vehicleIds } } : {})
    },
    include: {
      owner: true,   // includes owner.ownerRateOverride
      project: true,
      trips: {
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' }
      },
      expenses: {
        where: { date: { gte: startDate, lte: endDate } }
      }
    }
  })

  // Fetch owner advances in period
  const ownerAdvances = await prisma.ownerAdvance.findMany({
    where: {
      owner: { transporterId },
      date: { gte: startDate, lte: endDate },
      ...(vehicleIds && vehicleIds.length > 0 ? {} : {})
    },
    include: { owner: true }
  })

  // Get project default rate (fallback)
  const project = await prisma.project.findFirst({
    where: { transporterId },
    orderBy: { id: 'desc' }
  })
  const projectOwnerRate = project?.ownerRate || 125

  const vehicleBills: VehicleBillLine[] = vehicles
    .filter(v => v.trips.length > 0)
    .map(v => {
      // 3-tier effective rate: Vehicle override → Owner override → Project default
      const effectiveOwnerRate =
        v.ownerRateOverride
        ?? (v.owner as any).ownerRateOverride
        ?? v.project?.ownerRate
        ?? projectOwnerRate

      const effectiveRateSource =
        v.ownerRateOverride != null ? 'vehicle'
        : (v.owner as any).ownerRateOverride != null ? 'owner'
        : v.project?.ownerRate != null ? 'project'
        : 'default'

      const tripLines = v.trips.map(t => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        invoiceNo: t.invoiceNo,
        lrNo: t.lrNo,
        weight: t.weight,
        appliedOwnerRate: effectiveOwnerRate,
        ownerFreightAmount: t.ownerFreightAmount,   // revenue side
        ownerPayout: t.weight * effectiveOwnerRate,  // cost side at effective rate
      }))

      const grossPayout = tripLines.reduce((a, t) => a + t.ownerPayout, 0)

      // Expenses breakdown
      const expByType = (type: string) =>
        v.expenses.filter(e => e.type === type).reduce((a, e) => a + e.amount, 0)

      const ownerAdvanceTotal = ownerAdvances
        .filter(a => a.ownerId === v.ownerId)
        .reduce((a, adv) => a + adv.amount, 0)

      const deductionMap = {
        fuel: expByType('FUEL'),
        toll: expByType('TOLL'),
        maintenance: expByType('MAINTENANCE'),
        driverAdvance: expByType('DRIVER_ADVANCE'),
        ownerAdvance: ownerAdvanceTotal,
        other: expByType('CASH_PAYMENT'),
      }

      // Only sum deductions for expense types the transporter has marked as deductible
      const deductTotal = Object.entries(deductionMap).reduce((sum, [key, val]) => {
        const expKey = key === 'ownerAdvance' ? 'OWNER_ADVANCE'
          : key === 'driverAdvance' ? 'DRIVER_ADVANCE'
          : key.toUpperCase()
        return deductibleExpenseTypes.includes(expKey) ? sum + val : sum
      }, 0)

      return {
        plateNo: v.plateNo,
        vehicleId: v.id,
        ownerName: v.owner.ownerName,
        ownerId: v.ownerId,
        ownerRateOverride: v.ownerRateOverride,
        ownerOwnerRateOverride: (v.owner as any).ownerRateOverride ?? null,
        effectiveOwnerRate,
        effectiveRateSource,
        trips: tripLines,
        totalTrips: tripLines.length,
        totalWeight: tripLines.reduce((a, t) => a + t.weight, 0),
        grossPayout,
        deductions: { ...deductionMap, total: deductTotal },
        netSettlement: grossPayout - deductTotal,
      }
    })

  const grandTotal = vehicleBills.reduce((a, v) => ({
    trips: a.trips + v.totalTrips,
    weight: a.weight + v.totalWeight,
    grossPayout: a.grossPayout + v.grossPayout,
    totalDeductions: a.totalDeductions + v.deductions.total,
    netSettlement: a.netSettlement + v.netSettlement,
  }), { trips: 0, weight: 0, grossPayout: 0, totalDeductions: 0, netSettlement: 0 })

  const periodLabel = period.type === 'weekly'
    ? `Week of ${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    : period.type === 'monthly'
    ? startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : `${startDate.toLocaleDateString('en-IN')} – ${endDate.toLocaleDateString('en-IN')}`

  return {
    period: {
      start: period.startDate,
      end: period.endDate,
      label: periodLabel,
    },
    vehicles: vehicleBills,
    grandTotal,
  }
}

// Get all vehicles with their rate info
export async function getVehiclesWithRates() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []

  return await prisma.vehicle.findMany({
    where: { owner: { transporterId } },
    include: { owner: true, project: true },
    orderBy: { plateNo: 'asc' }
  })
}

// Get all owners with their rate info
export async function getOwnersWithRates() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []

  return await prisma.owner.findMany({
    where: { transporterId },
    include: {
      vehicles: { include: { project: true } }
    },
    orderBy: { ownerName: 'asc' }
  })
}
