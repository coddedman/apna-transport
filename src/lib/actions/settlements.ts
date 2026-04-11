'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function generateSettlement(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const ownerId = formData.get('ownerId') as string
  const periodStartStr = formData.get('periodStart') as string
  const periodEndStr = formData.get('periodEnd') as string

  if (!ownerId || !periodStartStr || !periodEndStr) {
    throw new Error('Owner and date range are required')
  }

  const periodStart = new Date(periodStartStr + 'T00:00:00')
  const periodEnd = new Date(periodEndStr + 'T23:59:59')

  // Verify owner belongs to this transporter
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: {
      vehicles: {
        include: {
          trips: {
            where: { date: { gte: periodStart, lte: periodEnd } }
          },
          expenses: {
            where: { date: { gte: periodStart, lte: periodEnd } }
          }
        }
      }
    }
  })

  if (!owner || owner.transporterId !== transporterId) {
    throw new Error('Owner not found')
  }

  // Calculate totals
  let totalRevenue = 0
  let totalFuel = 0
  let totalAdvances = 0
  let totalMaint = 0
  let totalTolls = 0
  let totalOther = 0
  let tripsCount = 0

  owner.vehicles.forEach((v: any) => {
    tripsCount += v.trips.length
    totalRevenue += v.trips.reduce((acc: number, t: any) => acc + t.totalAmount, 0)

    v.expenses.forEach((e: any) => {
      switch (e.type) {
        case 'FUEL': totalFuel += e.amount; break
        case 'DRIVER_ADVANCE': totalAdvances += e.amount; break
        case 'MAINTENANCE': totalMaint += e.amount; break
        case 'TOLL': totalTolls += e.amount; break
        case 'CASH_PAYMENT': totalOther += e.amount; break
      }
    })
  })

  const totalDeductions = totalFuel + totalAdvances + totalMaint + totalTolls + totalOther
  const finalPayout = totalRevenue - totalDeductions

  if (tripsCount === 0 && totalDeductions === 0) {
    throw new Error('No trip or expense activity found in this period')
  }

  const settlement = await prisma.settlement.create({
    data: {
      ownerId,
      periodStart,
      periodEnd,
      totalRevenue,
      totalFuel,
      totalAdvances,
      totalMaint,
      totalTolls,
      totalOther,
      finalPayout,
      tripsCount,
    }
  })

  revalidatePath('/dashboard/settlements')
  return settlement
}

export async function markSettled(settlementId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'SETTLED',
      settledAt: new Date(),
    }
  })

  revalidatePath('/dashboard/settlements')
}
