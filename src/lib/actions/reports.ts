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
// Fortnightly P&L Report
// ========================

export interface FortnightPnL {
  label: string
  periodStart: string
  periodEnd: string
  // Revenue
  grossRevenue: number       // trips × ownerRate (company billing)
  ownerPayout: number        // trips × partyRate (what owners get)
  rateSpread: number         // grossRevenue - ownerPayout
  tripsCount: number
  totalWeight: number
  // Vehicle Expenses
  fuelExpense: number
  tollExpense: number
  maintenanceExpense: number
  driverAdvanceExpense: number
  cashPaymentExpense: number
  totalVehicleExpenses: number
  // Company Overhead
  salaryOverhead: number
  rentOverhead: number
  insuranceOverhead: number
  emiOverhead: number
  officeOverhead: number
  partnerPayoutOverhead: number
  otherOverhead: number
  totalOverhead: number
  // Owner Advances
  ownerAdvancesGiven: number
  // Transactions
  partyPaymentsReceived: number
  ownerPaymentsMade: number
  // Net
  netProfit: number
  profitMargin: number
}

export interface FortnightlyReport {
  year: number
  month: number
  monthLabel: string
  firstHalf: FortnightPnL
  secondHalf: FortnightPnL
  monthTotal: FortnightPnL
}

function sumByType(expenses: { type: string; amount: number }[], type: string): number {
  return expenses.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0)
}

function buildPnL(
  label: string,
  periodStart: string,
  periodEnd: string,
  trips: { ownerFreightAmount: number; partyFreightAmount: number; weight: number }[],
  vehicleExpenses: { type: string; amount: number }[],
  companyExpenses: { type: string; amount: number }[],
  ownerAdvances: { amount: number }[],
  transactions: { type: string; amount: number; status: string }[],
): FortnightPnL {
  const grossRevenue = trips.reduce((s, t) => s + t.ownerFreightAmount, 0)
  const ownerPayout = trips.reduce((s, t) => s + t.partyFreightAmount, 0)
  const rateSpread = grossRevenue - ownerPayout
  const totalWeight = trips.reduce((s, t) => s + t.weight, 0)

  const fuelExpense = sumByType(vehicleExpenses, 'FUEL')
  const tollExpense = sumByType(vehicleExpenses, 'TOLL')
  const maintenanceExpense = sumByType(vehicleExpenses, 'MAINTENANCE')
  const driverAdvanceExpense = sumByType(vehicleExpenses, 'DRIVER_ADVANCE')
  const cashPaymentExpense = sumByType(vehicleExpenses, 'CASH_PAYMENT')
  const totalVehicleExpenses = fuelExpense + tollExpense + maintenanceExpense + driverAdvanceExpense + cashPaymentExpense

  const salaryOverhead = sumByType(companyExpenses, 'SALARY')
  const rentOverhead = sumByType(companyExpenses, 'RENT')
  const insuranceOverhead = sumByType(companyExpenses, 'INSURANCE')
  const emiOverhead = sumByType(companyExpenses, 'EMI')
  const officeOverhead = sumByType(companyExpenses, 'OFFICE')
  const partnerPayoutOverhead = sumByType(companyExpenses, 'PARTNER_PAYOUT')
  const otherOverhead = sumByType(companyExpenses, 'OTHER')
  const totalOverhead = salaryOverhead + rentOverhead + insuranceOverhead + emiOverhead + officeOverhead + partnerPayoutOverhead + otherOverhead

  const ownerAdvancesGiven = ownerAdvances.reduce((s, a) => s + a.amount, 0)

  const partyPaymentsReceived = transactions
    .filter(t => t.type === 'PARTY_PAYMENT' && t.status !== 'CANCELLED')
    .reduce((s, t) => s + t.amount, 0)
  const ownerPaymentsMade = transactions
    .filter(t => t.type === 'OWNER_PAYMENT' && t.status !== 'CANCELLED')
    .reduce((s, t) => s + t.amount, 0)

  const netProfit = rateSpread - totalVehicleExpenses - totalOverhead
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0

  return {
    label, periodStart, periodEnd,
    grossRevenue, ownerPayout, rateSpread,
    tripsCount: trips.length, totalWeight,
    fuelExpense, tollExpense, maintenanceExpense, driverAdvanceExpense, cashPaymentExpense, totalVehicleExpenses,
    salaryOverhead, rentOverhead, insuranceOverhead, emiOverhead, officeOverhead, partnerPayoutOverhead, otherOverhead, totalOverhead,
    ownerAdvancesGiven,
    partyPaymentsReceived, ownerPaymentsMade,
    netProfit, profitMargin,
  }
}

function mergePnL(a: FortnightPnL, b: FortnightPnL, label: string, start: string, end: string): FortnightPnL {
  const grossRevenue = a.grossRevenue + b.grossRevenue
  const netProfit = a.netProfit + b.netProfit
  return {
    label, periodStart: start, periodEnd: end,
    grossRevenue,
    ownerPayout: a.ownerPayout + b.ownerPayout,
    rateSpread: a.rateSpread + b.rateSpread,
    tripsCount: a.tripsCount + b.tripsCount,
    totalWeight: a.totalWeight + b.totalWeight,
    fuelExpense: a.fuelExpense + b.fuelExpense,
    tollExpense: a.tollExpense + b.tollExpense,
    maintenanceExpense: a.maintenanceExpense + b.maintenanceExpense,
    driverAdvanceExpense: a.driverAdvanceExpense + b.driverAdvanceExpense,
    cashPaymentExpense: a.cashPaymentExpense + b.cashPaymentExpense,
    totalVehicleExpenses: a.totalVehicleExpenses + b.totalVehicleExpenses,
    salaryOverhead: a.salaryOverhead + b.salaryOverhead,
    rentOverhead: a.rentOverhead + b.rentOverhead,
    insuranceOverhead: a.insuranceOverhead + b.insuranceOverhead,
    emiOverhead: a.emiOverhead + b.emiOverhead,
    officeOverhead: a.officeOverhead + b.officeOverhead,
    partnerPayoutOverhead: a.partnerPayoutOverhead + b.partnerPayoutOverhead,
    otherOverhead: a.otherOverhead + b.otherOverhead,
    totalOverhead: a.totalOverhead + b.totalOverhead,
    ownerAdvancesGiven: a.ownerAdvancesGiven + b.ownerAdvancesGiven,
    partyPaymentsReceived: a.partyPaymentsReceived + b.partyPaymentsReceived,
    ownerPaymentsMade: a.ownerPaymentsMade + b.ownerPaymentsMade,
    netProfit,
    profitMargin: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
  }
}

export async function generateFortnightlyPnL(year: number, month: number): Promise<FortnightlyReport> {
  const tid = await getTransporterId()

  const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const lastDay = new Date(year, month + 1, 0).getDate()

  // Define the two halves
  const firstStart = new Date(year, month, 1)
  const firstEnd = new Date(year, month, 15, 23, 59, 59, 999)
  const secondStart = new Date(year, month, 16)
  const secondEnd = new Date(year, month, lastDay, 23, 59, 59, 999)

  const monthStart = firstStart
  const monthEnd = secondEnd

  // Fetch all data for the full month in parallel, then split
  const [trips, vehicleExpenses, companyExpenses, ownerAdvances, transactions] = await Promise.all([
    prisma.trip.findMany({
      where: { project: { transporterId: tid }, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, ownerFreightAmount: true, partyFreightAmount: true, weight: true },
    }),
    prisma.expense.findMany({
      where: { vehicle: { owner: { transporterId: tid } }, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, type: true, amount: true },
    }),
    prisma.companyExpense.findMany({
      where: { transporterId: tid, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, type: true, amount: true },
    }),
    prisma.ownerAdvance.findMany({
      where: { owner: { transporterId: tid }, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: { transporterId: tid, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, type: true, amount: true, status: true },
    }),
  ])

  // Split into halves
  const isFirstHalf = (d: Date) => d.getDate() <= 15

  const firstHalfTrips = trips.filter(t => isFirstHalf(t.date))
  const secondHalfTrips = trips.filter(t => !isFirstHalf(t.date))

  const firstHalfVExp = vehicleExpenses.filter(e => isFirstHalf(e.date))
  const secondHalfVExp = vehicleExpenses.filter(e => !isFirstHalf(e.date))

  const firstHalfCExp = companyExpenses.filter(e => isFirstHalf(e.date))
  const secondHalfCExp = companyExpenses.filter(e => !isFirstHalf(e.date))

  const firstHalfAdv = ownerAdvances.filter(a => isFirstHalf(a.date))
  const secondHalfAdv = ownerAdvances.filter(a => !isFirstHalf(a.date))

  const firstHalfTxn = transactions.filter(t => isFirstHalf(t.date))
  const secondHalfTxn = transactions.filter(t => !isFirstHalf(t.date))

  const fmtDate = (d: Date) => d.toISOString().split('T')[0]

  const firstHalf = buildPnL(
    `1st – 15th`, fmtDate(firstStart), fmtDate(new Date(year, month, 15)),
    firstHalfTrips, firstHalfVExp, firstHalfCExp, firstHalfAdv, firstHalfTxn,
  )
  const secondHalf = buildPnL(
    `16th – ${lastDay}th`, fmtDate(secondStart), fmtDate(new Date(year, month, lastDay)),
    secondHalfTrips, secondHalfVExp, secondHalfCExp, secondHalfAdv, secondHalfTxn,
  )

  const monthTotal = mergePnL(firstHalf, secondHalf, 'Full Month', fmtDate(monthStart), fmtDate(new Date(year, month, lastDay)))

  return {
    year,
    month,
    monthLabel: monthName,
    firstHalf,
    secondHalf,
    monthTotal,
  }
}
