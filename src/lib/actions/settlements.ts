'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'

export async function generateSettlement(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const ownerId = formData.get('ownerId') as string
  const periodEndStr = formData.get('periodEnd') as string
  // periodStart is optional — if not provided, we use "till date" (all time)
  const periodStartStr = formData.get('periodStart') as string

  if (!ownerId || !periodEndStr) throw new Error('Owner and end date are required')

  const useTillDate = !periodStartStr
  const periodStart = useTillDate ? new Date('2000-01-01') : new Date(periodStartStr + 'T00:00:00')
  const periodEnd = new Date(periodEndStr + 'T23:59:59')

  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: {
      vehicles: {
        include: {
          project: true,
          trips: { where: { date: { gte: periodStart, lte: periodEnd } } },
          expenses: { where: { date: { gte: periodStart, lte: periodEnd } } },
        }
      }
    }
  })

  if (!owner || owner.transporterId !== transporterId) throw new Error('Owner not found')

  // Owner advances: ALL time, no date filter (cumulative)
  const ownerAdvances = await prisma.ownerAdvance.findMany({ where: { ownerId } })
  const ownerAdvanceTotal = ownerAdvances.reduce((a, adv) => a + adv.amount, 0)

  // Get default project rate as a last-resort fallback
  const defaultProject = await prisma.project.findFirst({ where: { transporterId }, orderBy: { id: 'desc' } })
  const defaultOwnerRate = defaultProject?.ownerRate || 125

  let totalOwnerPayout = 0
  let totalFuel = 0
  let totalDriverAdvances = 0
  let totalMaint = 0
  let totalTolls = 0
  let totalOther = 0
  let tripsCount = 0

  owner.vehicles.forEach((v: any) => {
    // Use proper rate override chain: vehicle override → owner override → vehicle's assigned project rate → default
    const effectiveRate = v.ownerRateOverride ?? owner.ownerRateOverride ?? v.project?.ownerRate ?? defaultOwnerRate
    tripsCount += v.trips.length
    totalOwnerPayout += v.trips.reduce((acc: number, t: any) => acc + (t.weight * effectiveRate), 0)

    v.expenses.forEach((e: any) => {
      switch (e.type) {
        case 'FUEL': totalFuel += e.amount; break
        case 'DRIVER_ADVANCE': totalDriverAdvances += e.amount; break
        case 'MAINTENANCE': totalMaint += e.amount; break
        case 'TOLL': totalTolls += e.amount; break
        case 'CASH_PAYMENT': totalOther += e.amount; break
        // OWNER_ADVANCE from expenses table is ignored — we use OwnerAdvance table
      }
    })
  })

  // totalAdvances = only owner advances (cumulative, from OwnerAdvance table)
  const totalDeductions = totalFuel + totalDriverAdvances + totalMaint + totalTolls + totalOther
  const netSettlement = totalOwnerPayout - totalDeductions
  const finalPayout = netSettlement - ownerAdvanceTotal // balance due

  if (tripsCount === 0 && totalDeductions === 0 && ownerAdvanceTotal === 0) {
    throw new Error('No trip or expense activity found in this period')
  }

  const settlement = await prisma.settlement.create({
    data: {
      ownerId,
      periodStart: useTillDate ? new Date('2000-01-01') : periodStart,
      periodEnd,
      totalRevenue: totalOwnerPayout, // using owner payout (weight × rate) not party revenue
      totalFuel,
      totalAdvances: ownerAdvanceTotal, // cumulative owner advances (all time)
      totalMaint,
      totalTolls,
      totalOther: totalOther + totalDriverAdvances,
      finalPayout,
      tripsCount,
    }
  })

  revalidateDashboard()
  return settlement
}

export async function markSettled(settlementId: string) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { owner: { select: { transporterId: true } } }
  })

  if (!settlement || settlement.owner.transporterId !== transporterId) {
    throw new Error('Settlement not found')
  }

  await prisma.settlement.update({
    where: { id: settlementId },
    data: { status: 'SETTLED', settledAt: new Date() }
  })

  revalidateDashboard()
}

export async function deleteSettlement(settlementId: string) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { owner: { select: { transporterId: true } } }
  })

  if (!settlement || settlement.owner.transporterId !== transporterId) {
    throw new Error('Settlement not found')
  }

  await prisma.settlement.delete({ where: { id: settlementId } })
  revalidateDashboard()
}

export async function updateSettlement(
  settlementId: string,
  data: { totalRevenue?: number; totalFuel?: number; totalAdvances?: number; totalMaint?: number; totalTolls?: number; totalOther?: number }
) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { owner: { select: { transporterId: true } } }
  })

  if (!settlement || settlement.owner.transporterId !== transporterId) {
    throw new Error('Settlement not found')
  }

  const rev = data.totalRevenue ?? settlement.totalRevenue
  const fuel = data.totalFuel ?? settlement.totalFuel
  const adv = data.totalAdvances ?? settlement.totalAdvances
  const maint = data.totalMaint ?? settlement.totalMaint
  const tolls = data.totalTolls ?? settlement.totalTolls
  const other = data.totalOther ?? settlement.totalOther
  const deductions = fuel + maint + tolls + other
  const finalPayout = rev - deductions - adv

  await prisma.settlement.update({
    where: { id: settlementId },
    data: { totalRevenue: rev, totalFuel: fuel, totalAdvances: adv, totalMaint: maint, totalTolls: tolls, totalOther: other, finalPayout }
  })

  revalidateDashboard()
}

export async function getSettlementById(settlementId: string) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: {
      owner: {
        select: {
          ownerName: true, transporterId: true,
          vehicles: { select: { id: true, plateNo: true } }
        }
      }
    }
  })

  if (!settlement || settlement.owner.transporterId !== transporterId) return null
  return settlement
}
