'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'

export interface SettlementRateGroup { rate: number; trips: number; weight: number; amount: number }

export interface SettlementCalc {
  ownerId: string
  ownerName: string
  periodStart: Date
  periodEnd: Date
  totalOwnerPayout: number
  totalFuel: number
  totalDriverAdvances: number
  totalMaint: number
  totalTolls: number
  totalOther: number
  tripsCount: number
  availableAdvance: number
  priorCarryForward: number
  finalPayout: number
  rateBreakdown: SettlementRateGroup[]
}

// Shared by previewSettlement and generateSettlement so the numbers a user previews
// are guaranteed identical to what gets written on confirm — one calculation, not two.
async function computeSettlement(formData: FormData, transporterId: string): Promise<SettlementCalc> {
  const ownerId = formData.get('ownerId') as string
  const periodEndStr = formData.get('periodEnd') as string
  // periodStart is optional — if not provided, we use "till date" (all time)
  const periodStartStr = formData.get('periodStart') as string
  // customRate is optional — if provided, overrides all rate hierarchy
  const customRateStr = formData.get('customRate') as string
  const customRate = customRateStr ? parseFloat(customRateStr) : null

  // Deductible expense types selected by user (defaults to all operational types if none passed)
  const rawDeductibleTypes = formData.getAll('deductibleTypes') as string[]
  const deductibleTypes = rawDeductibleTypes.length > 0
    ? rawDeductibleTypes
    : ['FUEL', 'TOLL', 'MAINTENANCE', 'DRIVER_ADVANCE', 'CASH_PAYMENT']

  if (!ownerId || !periodEndStr) throw new Error('Owner and end date are required')

  const useTillDate = !periodStartStr

  // Find previous settlement for this owner to prevent double-deducting past advances
  const lastSettlement = await prisma.settlement.findFirst({
    where: { ownerId },
    orderBy: { periodEnd: 'desc' }
  })

  let periodStart: Date
  if (useTillDate) {
    if (lastSettlement) {
      // Start immediately after the last settlement's periodEnd
      periodStart = new Date(lastSettlement.periodEnd.getTime() + 1)
    } else {
      // Find earliest activity date for this owner
      const earliestTrip = await prisma.trip.findFirst({
        where: { vehicle: { ownerId } },
        orderBy: { date: 'asc' },
        select: { date: true }
      })
      const earliestExpense = await prisma.expense.findFirst({
        where: { vehicle: { ownerId } },
        orderBy: { date: 'asc' },
        select: { date: true }
      })
      const earliestAdvance = await prisma.ownerAdvance.findFirst({
        where: { ownerId },
        orderBy: { date: 'asc' },
        select: { date: true }
      })

      const dates = [earliestTrip?.date, earliestExpense?.date, earliestAdvance?.date].filter(Boolean) as Date[]
      if (dates.length > 0) {
        periodStart = new Date(Math.min(...dates.map(d => d.getTime())))
      } else {
        periodStart = new Date('2000-01-01')
      }
    }
  } else {
    periodStart = new Date(periodStartStr + 'T00:00:00')
  }

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

  // Owner advances: all-time cumulative advances given to owner minus advances already deducted in prior settlements
  const totalAdvancesGivenAgg = await prisma.ownerAdvance.aggregate({
    _sum: { amount: true },
    where: { ownerId }
  })
  const totalAdvancesGiven = totalAdvancesGivenAgg._sum.amount || 0

  const priorDeductionsAgg = await prisma.settlement.aggregate({
    _sum: { totalAdvances: true },
    where: { ownerId }
  })
  const alreadyDeductedAdvances = priorDeductionsAgg._sum.totalAdvances || 0

  // Available all-time cumulative unrecovered advance balance
  const availableAdvance = Math.max(0, totalAdvancesGiven - alreadyDeductedAdvances)

  let totalOwnerPayout = 0
  let totalFuel = 0
  let totalDriverAdvances = 0
  let totalMaint = 0
  let totalTolls = 0
  let totalOther = 0
  let tripsCount = 0
  const rateGroups = new Map<number, SettlementRateGroup>()

  owner.vehicles.forEach((v: any) => {
    // Use custom rate if provided; otherwise vehicle override → owner override → the rate frozen on
    // each trip at creation time (already correct for whatever RatePeriod covered that trip's date).
    // Falling back to the project's *current* rate here would re-rate old trips whenever the rate changes.
    const overrideRate = customRate ?? v.ownerRateOverride ?? owner.ownerRateOverride ?? null
    tripsCount += v.trips.length
    v.trips.forEach((t: any) => {
      const rate = overrideRate ?? t.ownerRate
      const amount = t.weight * rate
      totalOwnerPayout += amount
      const g = rateGroups.get(rate) ?? { rate, trips: 0, weight: 0, amount: 0 }
      g.trips += 1; g.weight += t.weight; g.amount += amount
      rateGroups.set(rate, g)
    })

    v.expenses.forEach((e: any) => {
      if (!deductibleTypes.includes(e.type)) return

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

  const totalDeductions = totalFuel + totalDriverAdvances + totalMaint + totalTolls + totalOther
  const netSettlement = totalOwnerPayout - totalDeductions

  // lastSettlement (fetched above for the periodStart lookup) is also the source of the prior carryForward.
  const priorCarryForward = lastSettlement?.carryForward || 0

  // Full cumulative unrecovered advances deducted in this settlement + prior carryForward balance
  const finalPayout = netSettlement - availableAdvance + priorCarryForward // balance due to owner

  if (tripsCount === 0 && totalDeductions === 0 && availableAdvance === 0 && priorCarryForward === 0) {
    throw new Error('No trip or expense activity found in this period')
  }

  return {
    ownerId, ownerName: owner.ownerName, periodStart, periodEnd,
    totalOwnerPayout, totalFuel, totalDriverAdvances, totalMaint, totalTolls, totalOther, tripsCount,
    availableAdvance, priorCarryForward, finalPayout,
    rateBreakdown: [...rateGroups.values()].sort((a, b) => a.rate - b.rate),
  }
}

export async function previewSettlement(formData: FormData): Promise<SettlementCalc> {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')
  return computeSettlement(formData, transporterId)
}

export async function generateSettlement(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const calc = await computeSettlement(formData, transporterId)

  // Prevent overlapping settlements for the same owner
  const overlapping = await prisma.settlement.findFirst({
    where: {
      ownerId: calc.ownerId,
      AND: [
        { periodStart: { lte: calc.periodEnd } },
        { periodEnd: { gte: calc.periodStart } },
      ]
    }
  })
  if (overlapping) {
    const fmtD = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    throw new Error(`Overlapping settlement exists (${fmtD(overlapping.periodStart)} – ${fmtD(overlapping.periodEnd)}). Delete it first or adjust dates.`)
  }

  const settlement = await prisma.settlement.create({
    data: {
      ownerId: calc.ownerId,
      periodStart: calc.periodStart,
      periodEnd: calc.periodEnd,
      totalRevenue: calc.totalOwnerPayout, // using owner payout (weight × rate) not party revenue
      totalFuel: calc.totalFuel,
      totalAdvances: calc.availableAdvance, // advances deducted in this settlement
      totalMaint: calc.totalMaint,
      totalTolls: calc.totalTolls,
      totalOther: calc.totalOther + calc.totalDriverAdvances,
      finalPayout: calc.finalPayout,
      carryForward: 0, // initial carryForward before settlement is finalized
      tripsCount: calc.tripsCount,
    }
  })

  revalidateDashboard()
  return settlement
}

export async function markSettled(settlementId: string, paidAmountInput?: number, carryForwardInput?: number) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { owner: { select: { id: true, ownerName: true, transporterId: true } } }
  })

  if (!settlement || settlement.owner.transporterId !== transporterId) {
    throw new Error('Settlement not found')
  }

  // Determine paidAmount and carryForward
  const paidAmount = paidAmountInput !== undefined ? paidAmountInput : settlement.finalPayout
  const carryForward = carryForwardInput !== undefined ? carryForwardInput : (settlement.finalPayout - paidAmount)

  await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'SETTLED',
      settledAt: new Date(),
      paidAmount,
      carryForward,
    }
  })

  // Create transaction if paidAmount != 0
  if (paidAmount !== 0) {
    await prisma.transaction.create({
      data: {
        transporterId,
        ownerId: settlement.ownerId,
        settlementId: settlement.id,
        type: paidAmount > 0 ? 'OWNER_PAYMENT' : 'REFUND',
        amount: Math.abs(paidAmount),
        status: 'COMPLETED',
        description: `Settlement payout/adjustment for period ${settlement.periodStart.toISOString().split('T')[0]} to ${settlement.periodEnd.toISOString().split('T')[0]}`
      }
    })
  }

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

  // Settlements chain via "last settlement for this owner" lookups (see generateSettlement),
  // not an explicit link — deleting one out of order silently drops its carryForward from the chain.
  const latest = await prisma.settlement.findFirst({
    where: { ownerId: settlement.ownerId },
    orderBy: { periodEnd: 'desc' },
  })
  if (latest && latest.id !== settlementId) {
    throw new Error('Only the most recent settlement for this owner can be deleted (older ones carry forward into later ones)')
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

  // Back out whatever carryForward is already baked into this row's finalPayout so editing
  // line items doesn't silently erase it (finalPayout = net - advances + priorCarryForward).
  const currentDeductions = settlement.totalFuel + settlement.totalMaint + settlement.totalTolls + settlement.totalOther
  const priorCarryForward = settlement.finalPayout - (settlement.totalRevenue - currentDeductions - settlement.totalAdvances)

  const finalPayout = rev - deductions - adv + priorCarryForward

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
