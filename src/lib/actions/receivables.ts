'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'
import { BillStatus } from '@prisma/client'
import { incentiveTotal, totalPayableFor, outstandingFor, statusFor, money, validDate, validateAmount } from '@/lib/finance/receivables'
import { eligibleTrips } from '@/lib/finance/eligibleTrips'
import { summarizeTrips, validateTripSelection } from '@/lib/finance/tripBilling'
import { financeTransaction } from '@/lib/finance/transaction'

async function getTransporterId() {
  const session = await auth()
  const tid = (session?.user as any)?.transporterId
  if (!tid || session?.user?.role === 'OWNER') throw new Error('Unauthorized')
  return tid
}

export async function createPartyBill(data: {
  billNo: string
  projectId: string
  periodStart: string
  periodEnd: string
  tripIds?: string[]
  totalTrips?: number
  totalWeight?: number
  billAmount: number
  incentive?: number
  billType?: string
  submittedAt?: string
  dueDate?: string
  remarks?: string
}) {
  const tid = await getTransporterId()

  if (!data.billNo?.trim()) throw new Error('Bill number is required')
  if (!data.projectId) throw new Error('Project is required')
  validateAmount(data.billAmount, 'Bill amount')
  validateAmount(data.incentive ?? 0, 'Incentive', true)
  validateAmount(data.totalWeight ?? 0, 'Weight', true)
  validateAmount(data.totalTrips ?? 0, 'Trip count', true)
  if (!Number.isInteger(data.totalTrips ?? 0)) throw new Error('Trip count must be a whole number')
  validDate(data.periodStart, 'Period start')
  validDate(data.periodEnd, 'Period end')
  if (data.periodStart > data.periodEnd) throw new Error('Period end must be on or after period start')
  if (data.submittedAt) validDate(data.submittedAt, 'Submission date')
  if (data.dueDate) validDate(data.dueDate, 'Due date')
  const project = await prisma.project.findFirst({ where: { id: data.projectId, transporterId: tid }, select: { id: true } })
  if (!project) throw new Error('Project not found')

  const bill = await financeTransaction(async tx => {
    const isFreight = (data.billType || 'FREIGHT') === 'FREIGHT'
    if (!['FREIGHT', 'TOLL'].includes(data.billType || 'FREIGHT')) throw new Error('Invalid bill type')
    let totals = { totalTrips: 0, totalWeight: 0, billAmount: data.billAmount }
    const tripIds = data.tripIds || []
    if (isFreight) {
      const available = await eligibleTrips(tx, tid, data.projectId, { start: data.periodStart, end: data.periodEnd })
      validateTripSelection(tripIds, available.map(trip => trip.id))
      totals = summarizeTrips(available.filter(trip => tripIds.includes(trip.id)))
      validateAmount(totals.billAmount, 'Trip freight total')
      if (money(data.billAmount) !== totals.billAmount || data.totalTrips !== totals.totalTrips || Math.abs((data.totalWeight ?? 0) - totals.totalWeight) > 0.000001) {
        throw new Error('Trip totals changed. Reload the trips and review the invoice before saving.')
      }
    } else if (tripIds.length) throw new Error('Only freight invoices can link trips')
    // Check for duplicate bill number
    const existing = await tx.partyBill.findFirst({
      where: { transporterId: tid, billNo: data.billNo }
    })
    if (existing) throw new Error(`Duplicate bill number: "${data.billNo}" already exists`)

    const bill = await tx.partyBill.create({
      data: {
        billNo: data.billNo,
        projectId: data.projectId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        ...totals,
        tripLinked: isFreight,
        incentive: isFreight ? data.incentive || 0 : 0,
        billType: data.billType || 'FREIGHT',
        submittedAt: data.submittedAt ? new Date(data.submittedAt) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        remarks: data.remarks || null,
        transporterId: tid,
      }
    })
    if (isFreight) {
      const claimed = await tx.trip.updateMany({ where: { id: { in: tripIds }, partyBillId: null, projectId: data.projectId, project: { transporterId: tid } }, data: { partyBillId: bill.id } })
      if (claimed.count !== tripIds.length) throw new Error('One or more trips were just invoiced. Reload the trips and try again.')
    }
    return bill
  })

  revalidateDashboard()
  return bill
}

/**
 * Auto-calculate bill amount from trips for a project + period.
 */
export async function calculateBillFromTrips(projectId: string, periodStart: string, periodEnd: string) {
  const tid = await getTransporterId()

  if (!projectId) throw new Error('Project is required')
  const trips = await eligibleTrips(prisma, tid, projectId, { start: periodStart, end: periodEnd })
  return { ...summarizeTrips(trips), trips }
}

export async function getUnbilledWork() {
  const tid = await getTransporterId()
  const [trips, legacyCount] = await Promise.all([
    eligibleTrips(prisma, tid),
    prisma.partyBill.count({ where: { transporterId: tid, tripLinked: false, billType: 'FREIGHT' } }),
  ])
  const groups = new Map<string, typeof trips>()
  for (const trip of trips) {
    const rows = groups.get(trip.projectId) || []
    rows.push(trip)
    groups.set(trip.projectId, rows)
  }
  return {
    legacyCount,
    projects: [...groups.entries()].map(([projectId, rows]) => ({ projectId, projectName: rows[0].project.projectName, ...summarizeTrips(rows), periodStart: rows[0].date.toISOString().slice(0, 10), periodEnd: rows[rows.length - 1].date.toISOString().slice(0, 10) })),
  }
}

// ========================
// Bill Payments
// ========================

export async function addBillPayment(data: {
  billId: string
  date: string
  amount: number
  referenceNo?: string
  remarks?: string
}) {
  const tid = await getTransporterId()
  await financeTransaction(async tx => {

    const bill = await tx.partyBill.findFirst({
      where: { id: data.billId, transporterId: tid },
    })
    if (!bill) throw new Error('Bill not found')
    validateAmount(data.amount, 'Amount')
    if (money(data.amount) <= 0) throw new Error('Amount must be at least ₹0.01')
    validDate(data.date, 'Payment date')

    if (money(data.amount) > outstandingFor(bill)) throw new Error('Payment exceeds the remaining invoice balance')

    // Create payment
    await tx.billPayment.create({
      data: {
        billId: data.billId,
        date: new Date(data.date),
        amount: money(data.amount),
        referenceNo: data.referenceNo || null,
        remarks: data.remarks || null,
      }
    })

    // Recalculate receivedAmount and status
    const payments = await tx.billPayment.findMany({
      where: { billId: data.billId },
      select: { amount: true },
    })
    const totalReceived = money(payments.reduce((s, p) => s + p.amount, 0))
    const status = statusFor({ ...bill, receivedAmount: totalReceived })

    await tx.partyBill.update({
      where: { id: data.billId },
      data: { receivedAmount: totalReceived, status },
    })
  })
  revalidateDashboard()
}

/**
 * Record an Overall / Lump-Sum Party Payment received from client.
 * Distributes payment automatically across pending bills in chronological order (FIFO)
 * and records a Transaction entry for financial tracking.
 */
export async function addBulkPartyPayment(data: {
  projectId?: string
  date: string
  amount: number
  referenceNo?: string
  remarks?: string
}) {
  const tid = await getTransporterId()
  await financeTransaction(async tx => {

    validateAmount(data.amount, 'Amount')
    if (money(data.amount) <= 0) throw new Error('Amount must be at least ₹0.01')
    validDate(data.date, 'Payment date')

    if (data.projectId && !await tx.project.findFirst({ where: { id: data.projectId, transporterId: tid }, select: { id: true } })) throw new Error('Project not found')

    const where: any = {
      transporterId: tid
    }
    if (data.projectId) {
      where.projectId = data.projectId
    }

    const bills = await tx.partyBill.findMany({
      where,
      include: { payments: true },
      orderBy: { periodStart: 'asc' },
    })

    let remainingToDistribute = money(data.amount)
    const payDate = new Date(data.date)

    for (const bill of bills) {
      if (remainingToDistribute <= 0) break

      const alreadyReceived = bill.payments.reduce((s, p) => s + p.amount, 0)
      const totalPayable = totalPayableFor(bill)
      const billPending = money(totalPayable - alreadyReceived)

      if (billPending <= 0) continue

      const payForThisBill = Math.min(remainingToDistribute, billPending)

      await tx.billPayment.create({
        data: {
          billId: bill.id,
          date: payDate,
          amount: payForThisBill,
          referenceNo: data.referenceNo || null,
          remarks: data.remarks ? `${data.remarks} (Overall Payment)` : 'Overall Payment',
        }
      })

      const newTotalReceived = money(alreadyReceived + payForThisBill)
      const newStatus = statusFor({ ...bill, receivedAmount: newTotalReceived })

      await tx.partyBill.update({
        where: { id: bill.id },
        data: { receivedAmount: newTotalReceived, status: newStatus },
      })

      remainingToDistribute = money(remainingToDistribute - payForThisBill)
    }

    if (money(remainingToDistribute) > 0) throw new Error('Payment exceeds outstanding invoices. Record any client advance separately.')

    // Create Transaction record for CashFlow tracking
    await tx.transaction.create({
      data: {
        transporterId: tid,
        date: payDate,
        projectId: data.projectId || null,
        type: 'PARTY_PAYMENT',
        amount: money(data.amount),
        status: 'COMPLETED',
        referenceNo: data.referenceNo || null,
        description: `Overall Party Payment Received${data.remarks ? ': ' + data.remarks : ''}`,
      }
    })
  })
  revalidateDashboard()
}

export async function deleteBillPayment(paymentId: string) {
  const tid = await getTransporterId()
  await financeTransaction(async tx => {

    const payment = await tx.billPayment.findUnique({
      where: { id: paymentId },
      include: { bill: { select: { id: true, transporterId: true, billAmount: true, incentive: true, totalWeight: true, dueDate: true } } },
    })
    if (!payment || payment.bill.transporterId !== tid) throw new Error('Payment not found')

    await tx.billPayment.delete({ where: { id: paymentId } })

    // Recalculate
    const remaining = await tx.billPayment.findMany({
      where: { billId: payment.billId },
      select: { amount: true },
    })
    const totalReceived = money(remaining.reduce((s, p) => s + p.amount, 0))
    const status = statusFor({ ...payment.bill, receivedAmount: totalReceived })

    await tx.partyBill.update({
      where: { id: payment.billId },
      data: { receivedAmount: totalReceived, status },
    })
  })
  revalidateDashboard()
}

// ========================
// Fetch Bills
// ========================

export interface ReceivableFilters {
  projectId?: string
  status?: BillStatus
}

export async function getPartyBills(filters: ReceivableFilters = {}) {
  const tid = await getTransporterId()

  const where: any = { transporterId: tid }
  if (filters.projectId) where.projectId = filters.projectId

  const bills = await prisma.partyBill.findMany({
    where,
    include: {
      project: { select: { id: true, projectName: true } },
      payments: { orderBy: { date: 'desc' } },
      trips: { select: { id: true, date: true, weight: true, partyFreightAmount: true, vehicle: { select: { plateNo: true } } }, orderBy: { date: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return bills.map(bill => ({ ...bill, status: statusFor(bill) })).filter(bill => !filters.status || bill.status === filters.status)
}

export async function getOverallPartyPayments() {
  const tid = await getTransporterId()
  return prisma.transaction.findMany({
    where: { transporterId: tid, type: 'PARTY_PAYMENT' },
    include: { project: { select: { id: true, projectName: true } } },
    orderBy: { date: 'desc' },
  })
}

// ========================
// Summary / Dashboard Data
// ========================

export async function getReceivableSummary() {
  const tid = await getTransporterId()

  const bills = await prisma.partyBill.findMany({
    where: { transporterId: tid },
    select: { billAmount: true, incentive: true, totalWeight: true, receivedAmount: true, dueDate: true, status: true },
  })

  const totalBaseBilled = bills.reduce((s, b) => s + b.billAmount, 0)
  const totalIncentives = bills.reduce((s, b) => s + incentiveTotal(b.incentive, b.totalWeight), 0)
  const totalBilled = totalBaseBilled + totalIncentives
  const totalReceived = bills.reduce((s, b) => s + b.receivedAmount, 0)
  const totalPending = bills.reduce((sum, bill) => sum + outstandingFor(bill), 0)

  return {
    totalBilled,
    totalBaseBilled,
    totalIncentives,
    totalReceived,
    totalPending,
    totalBills: bills.length,
    pendingBills: bills.filter(b => statusFor(b) === 'PENDING').length,
    partialBills: bills.filter(b => statusFor(b) === 'PARTIAL').length,
    paidBills: bills.filter(b => statusFor(b) === 'PAID').length,
    overdueBills: bills.filter(b => statusFor(b) === 'OVERDUE').length,
  }
}

export async function getProjectWisePending() {
  const tid = await getTransporterId()

  const bills = await prisma.partyBill.findMany({
    where: { transporterId: tid },
    include: { project: { select: { id: true, projectName: true } } },
  })

  const projectMap = new Map<string, { projectName: string; billed: number; received: number; pending: number; count: number }>()

  for (const b of bills) {
    const pid = b.projectId
    const totalBillPayable = totalPayableFor(b)
    const existing = projectMap.get(pid) || { projectName: b.project.projectName, billed: 0, received: 0, pending: 0, count: 0 }
    existing.billed += totalBillPayable
    existing.received += b.receivedAmount
    existing.pending += outstandingFor(b)
    existing.count += 1
    projectMap.set(pid, existing)
  }

  return [...projectMap.entries()]
    .map(([projectId, data]) => ({ projectId, ...data }))
    .sort((a, b) => b.pending - a.pending)
}

export async function deletePartyBill(billId: string) {
  const tid = await getTransporterId()
  await financeTransaction(async tx => {
    const bill = await tx.partyBill.findFirst({ where: { id: billId, transporterId: tid }, include: { _count: { select: { payments: true } } } })
    if (!bill) throw new Error('Bill not found')
    if (bill._count.payments > 0 || bill.receivedAmount > 0) throw new Error('Remove or reverse recorded payments before deleting this invoice')
    await tx.partyBill.delete({ where: { id: billId } })
  })
  revalidateDashboard()
}

export async function updatePartyBill(billId: string, data: {
  billNo?: string
  periodStart?: string
  periodEnd?: string
  totalTrips?: number
  totalWeight?: number
  billAmount?: number
  incentive?: number
  billType?: string
  submittedAt?: string | null
  dueDate?: string | null
  remarks?: string | null
}) {
  const tid = await getTransporterId()
  await financeTransaction(async tx => {
    const bill = await tx.partyBill.findFirst({ where: { id: billId, transporterId: tid } })
    if (!bill) throw new Error('Bill not found')
    if (bill.tripLinked) {
      const changesTripBasis =
        (data.billType !== undefined && data.billType !== bill.billType) ||
        (data.totalTrips !== undefined && data.totalTrips !== bill.totalTrips) ||
        (data.totalWeight !== undefined && data.totalWeight !== bill.totalWeight) ||
        (data.billAmount !== undefined && money(data.billAmount) !== money(bill.billAmount)) ||
        (data.periodStart !== undefined && data.periodStart !== bill.periodStart.toISOString().slice(0, 10)) ||
        (data.periodEnd !== undefined && data.periodEnd !== bill.periodEnd.toISOString().slice(0, 10))
      if (changesTripBasis) throw new Error('Trip-linked invoice totals and period are locked. Delete the unpaid invoice to release its trips, then rebuild it.')
    }


    if (data.billNo !== undefined && !data.billNo.trim()) throw new Error('Bill number is required')
    if (data.billAmount !== undefined) validateAmount(data.billAmount, 'Bill amount')
    if (data.incentive !== undefined) validateAmount(data.incentive, 'Incentive', true)
    if (data.totalWeight !== undefined) validateAmount(data.totalWeight, 'Weight', true)
    if (data.totalTrips !== undefined) {
      validateAmount(data.totalTrips, 'Trip count', true)
      if (!Number.isInteger(data.totalTrips)) throw new Error('Trip count must be a whole number')
    }
    if (data.periodStart !== undefined) validDate(data.periodStart, 'Period start')
    if (data.periodEnd !== undefined) validDate(data.periodEnd, 'Period end')
    if (data.submittedAt) validDate(data.submittedAt, 'Submission date')
    if (data.dueDate) validDate(data.dueDate, 'Due date')
    if (new Date(data.periodStart ?? bill.periodStart) > new Date(data.periodEnd ?? bill.periodEnd)) throw new Error('Period end must be on or after period start')
    const updateData: any = {}
    if (data.billNo !== undefined) {
      // Check for duplicate bill number (excluding current bill)
      if (data.billNo !== bill.billNo) {
        const dup = await tx.partyBill.findFirst({
          where: { transporterId: tid, billNo: data.billNo, id: { not: billId } }
        })
        if (dup) throw new Error(`Duplicate bill number: "${data.billNo}" already exists`)
      }
      updateData.billNo = data.billNo
    }
    if (data.periodStart !== undefined) updateData.periodStart = new Date(data.periodStart)
    if (data.periodEnd !== undefined) updateData.periodEnd = new Date(data.periodEnd)
    if (data.totalTrips !== undefined) updateData.totalTrips = data.totalTrips
    if (data.totalWeight !== undefined) updateData.totalWeight = data.totalWeight
    if (data.incentive !== undefined) updateData.incentive = data.incentive
    if (data.billType !== undefined) updateData.billType = data.billType
    if (data.billAmount !== undefined) updateData.billAmount = data.billAmount
    if (data.submittedAt !== undefined) updateData.submittedAt = data.submittedAt ? new Date(data.submittedAt) : null
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.remarks !== undefined) updateData.remarks = data.remarks

    const payments = await tx.billPayment.aggregate({ where: { billId }, _sum: { amount: true } })
    const receivedAmount = money(payments._sum.amount || 0)
    const updated = { ...bill, ...updateData, receivedAmount }
    if (totalPayableFor(updated) < receivedAmount) throw new Error('Invoice total cannot be less than payments already received')
    updateData.receivedAmount = receivedAmount
    updateData.status = statusFor(updated)
    await tx.partyBill.update({ where: { id: billId }, data: updateData })
  })
  revalidateDashboard()
}

// Get projects for form dropdown
export async function getReceivableFormData() {
  const tid = await getTransporterId()
  return prisma.project.findMany({
    where: { transporterId: tid },
    select: { id: true, projectName: true, partyRate: true },
    orderBy: { projectName: 'asc' },
  })
}
