'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'

async function getTransporterId() {
  const session = await auth()
  const tid = (session?.user as any)?.transporterId
  if (!tid) throw new Error('Unauthorized')
  return tid
}

const CATEGORIES = ['FUEL', 'TOLL', 'MAINTENANCE', 'DRIVER_ADVANCE', 'CASH_PAYMENT', 'OWNER_ADVANCE'] as const

// ========================
// Daily Lumpsum CRUD
// ========================

export async function addDailyLumpsum(data: {
  date: string
  category: string
  amount: number
  remarks?: string
}) {
  const tid = await getTransporterId()
  if (data.amount <= 0) throw new Error('Amount must be positive')

  const dateObj = new Date(data.date + 'T00:00:00')

  // Upsert: if entry for same date+category exists, add to it
  const existing = await prisma.dailyLumpsum.findUnique({
    where: { transporterId_date_category: { transporterId: tid, date: dateObj, category: data.category } }
  })

  if (existing) {
    await prisma.dailyLumpsum.update({
      where: { id: existing.id },
      data: {
        amount: existing.amount + data.amount,
        remarks: data.remarks ? `${existing.remarks || ''}; ${data.remarks}` : existing.remarks,
      }
    })
  } else {
    await prisma.dailyLumpsum.create({
      data: {
        date: dateObj,
        category: data.category,
        amount: data.amount,
        remarks: data.remarks || null,
        transporterId: tid,
      }
    })
  }

  revalidateDashboard()
}

export async function updateDailyLumpsum(id: string, amount: number, remarks?: string) {
  const tid = await getTransporterId()
  const entry = await prisma.dailyLumpsum.findFirst({ where: { id, transporterId: tid } })
  if (!entry) throw new Error('Entry not found')

  await prisma.dailyLumpsum.update({
    where: { id },
    data: { amount, remarks: remarks ?? entry.remarks },
  })
  revalidateDashboard()
}

export async function deleteDailyLumpsum(id: string) {
  const tid = await getTransporterId()
  const entry = await prisma.dailyLumpsum.findFirst({ where: { id, transporterId: tid } })
  if (!entry) throw new Error('Entry not found')

  await prisma.dailyLumpsum.delete({ where: { id } })
  revalidateDashboard()
}

export async function getDailyLumpsums(startDate: string, endDate: string) {
  const tid = await getTransporterId()
  return prisma.dailyLumpsum.findMany({
    where: {
      transporterId: tid,
      date: {
        gte: new Date(startDate + 'T00:00:00'),
        lte: new Date(endDate + 'T23:59:59'),
      }
    },
    orderBy: { date: 'desc' },
  })
}

// ========================
// Tally / Reconciliation
// ========================

export interface CategoryTally {
  category: string
  lumpsumTotal: number
  lumpsumEntries: number
  vehicleExpenseTotal: number
  vehicleExpenseEntries: number
  difference: number       // lumpsum - vehicleExpense
  percentMatch: number     // how close they are (100% = perfect match)
  status: 'match' | 'over' | 'under' | 'no-lumpsum' | 'no-expenses'
}

export interface DailyEntry {
  id: string
  date: string
  category: string
  amount: number
  remarks: string | null
}

export interface TallyResult {
  periodLabel: string
  startDate: string
  endDate: string
  categories: CategoryTally[]
  dailyEntries: DailyEntry[]
  grandTotals: {
    lumpsumTotal: number
    vehicleExpenseTotal: number
    difference: number
  }
}

export async function generateTally(startDate: string, endDate: string): Promise<TallyResult> {
  const tid = await getTransporterId()

  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T23:59:59')

  // Fetch both lumpsum entries and vehicle expenses for the period
  const [lumpsums, vehicleExpenses] = await Promise.all([
    prisma.dailyLumpsum.findMany({
      where: { transporterId: tid, date: { gte: start, lte: end } },
      orderBy: { date: 'desc' },
    }),
    prisma.expense.groupBy({
      by: ['type'],
      where: { vehicle: { owner: { transporterId: tid } }, date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  // Build category tallies
  const vExpMap = new Map(vehicleExpenses.map(e => [e.type, { total: e._sum.amount || 0, count: e._count }]))

  // Group lumpsums by category
  const lumpByCat = new Map<string, { total: number; count: number }>()
  for (const l of lumpsums) {
    const existing = lumpByCat.get(l.category) || { total: 0, count: 0 }
    existing.total += l.amount
    existing.count += 1
    lumpByCat.set(l.category, existing)
  }

  const categories: CategoryTally[] = CATEGORIES.map(cat => {
    const lump = lumpByCat.get(cat) || { total: 0, count: 0 }
    const vExp = vExpMap.get(cat) || { total: 0, count: 0 }
    const diff = lump.total - vExp.total

    let status: CategoryTally['status'] = 'match'
    if (lump.count === 0 && vExp.count === 0) status = 'no-lumpsum'
    else if (lump.count === 0 && vExp.count > 0) status = 'no-lumpsum'
    else if (lump.count > 0 && vExp.count === 0) status = 'no-expenses'
    else if (Math.abs(diff) < 1) status = 'match'
    else if (diff > 0) status = 'under' // vehicle expenses are UNDER the lumpsum = you logged less
    else status = 'over' // vehicle expenses are OVER the lumpsum = you logged more than you paid

    const maxVal = Math.max(lump.total, vExp.total, 1)
    const percentMatch = maxVal > 0 ? (Math.min(lump.total, vExp.total) / maxVal) * 100 : 0

    return {
      category: cat,
      lumpsumTotal: lump.total,
      lumpsumEntries: lump.count,
      vehicleExpenseTotal: vExp.total,
      vehicleExpenseEntries: vExp.count,
      difference: diff,
      percentMatch,
      status,
    }
  })

  const lumpsumGrand = categories.reduce((s, c) => s + c.lumpsumTotal, 0)
  const vehicleGrand = categories.reduce((s, c) => s + c.vehicleExpenseTotal, 0)

  const fmtD = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return {
    periodLabel: `${fmtD(start)} – ${fmtD(end)}`,
    startDate,
    endDate,
    categories,
    dailyEntries: lumpsums.map(l => ({
      id: l.id,
      date: l.date.toISOString().split('T')[0],
      category: l.category,
      amount: l.amount,
      remarks: l.remarks,
    })),
    grandTotals: {
      lumpsumTotal: lumpsumGrand,
      vehicleExpenseTotal: vehicleGrand,
      difference: lumpsumGrand - vehicleGrand,
    },
  }
}
