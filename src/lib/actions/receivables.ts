'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'
import { BillStatus } from '@prisma/client'

async function getTransporterId() {
  const session = await auth()
  const tid = (session?.user as any)?.transporterId
  if (!tid) throw new Error('Unauthorized')
  return tid
}

// ========================
// Party Bill CRUD
// ========================

export async function createPartyBill(data: {
  billNo: string
  projectId: string
  periodStart: string
  periodEnd: string
  totalTrips?: number
  totalWeight?: number
  billAmount: number
  incentive?: number
  submittedAt?: string
  dueDate?: string
  remarks?: string
}) {
  const tid = await getTransporterId()

  if (!data.billNo) throw new Error('Bill number is required')
  if (!data.projectId) throw new Error('Project is required')
  if (data.billAmount <= 0) throw new Error('Bill amount must be positive')

  // Check for duplicate bill number
  const existing = await prisma.partyBill.findFirst({
    where: { transporterId: tid, billNo: data.billNo }
  })
  if (existing) throw new Error(`Duplicate bill number: "${data.billNo}" already exists`)

  const bill = await prisma.partyBill.create({
    data: {
      billNo: data.billNo,
      projectId: data.projectId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      totalTrips: data.totalTrips || 0,
      totalWeight: data.totalWeight || 0,
      billAmount: data.billAmount,
      incentive: data.incentive || 0,
      submittedAt: data.submittedAt ? new Date(data.submittedAt) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      remarks: data.remarks || null,
      transporterId: tid,
    }
  })

  revalidateDashboard()
  return bill
}

/**
 * Auto-calculate bill amount from trips for a project + period.
 */
export async function calculateBillFromTrips(projectId: string, periodStart: string, periodEnd: string) {
  const tid = await getTransporterId()

  const start = new Date(periodStart + 'T00:00:00')
  const end = new Date(periodEnd + 'T23:59:59')

  const trips = await prisma.trip.findMany({
    where: {
      projectId,
      project: { transporterId: tid },
      date: { gte: start, lte: end },
    },
    select: { weight: true, partyFreightAmount: true },
  })

  return {
    totalTrips: trips.length,
    totalWeight: trips.reduce((s, t) => s + t.weight, 0),
    billAmount: trips.reduce((s, t) => s + t.partyFreightAmount, 0),
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

  const bill = await prisma.partyBill.findFirst({
    where: { id: data.billId, transporterId: tid },
  })
  if (!bill) throw new Error('Bill not found')
  if (data.amount <= 0) throw new Error('Amount must be positive')

  // Create payment
  await prisma.billPayment.create({
    data: {
      billId: data.billId,
      date: new Date(data.date),
      amount: data.amount,
      referenceNo: data.referenceNo || null,
      remarks: data.remarks || null,
    }
  })

  // Recalculate receivedAmount and status
  const payments = await prisma.billPayment.findMany({
    where: { billId: data.billId },
    select: { amount: true },
  })
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0)
  const totalPayable = bill.billAmount + (bill.incentive || 0)

  let status: BillStatus = 'PENDING'
  if (totalReceived >= totalPayable) {
    status = 'PAID'
  } else if (totalReceived > 0) {
    status = 'PARTIAL'
  } else if (bill.dueDate && new Date() > bill.dueDate) {
    status = 'OVERDUE'
  }

  await prisma.partyBill.update({
    where: { id: data.billId },
    data: { receivedAmount: totalReceived, status },
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

  if (data.amount <= 0) throw new Error('Amount must be positive')

  const where: any = {
    transporterId: tid,
    status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
  }
  if (data.projectId) {
    where.projectId = data.projectId
  }

  const bills = await prisma.partyBill.findMany({
    where,
    include: { payments: true },
    orderBy: { periodStart: 'asc' },
  })

  let remainingToDistribute = data.amount
  const payDate = new Date(data.date)

  for (const bill of bills) {
    if (remainingToDistribute <= 0) break

    const alreadyReceived = bill.payments.reduce((s, p) => s + p.amount, 0)
    const billPending = bill.billAmount - alreadyReceived

    if (billPending <= 0) continue

    const payForThisBill = Math.min(remainingToDistribute, billPending)

    await prisma.billPayment.create({
      data: {
        billId: bill.id,
        date: payDate,
        amount: payForThisBill,
        referenceNo: data.referenceNo || null,
        remarks: data.remarks ? `${data.remarks} (Overall Payment)` : 'Overall Payment',
      }
    })

    const newTotalReceived = alreadyReceived + payForThisBill
    let newStatus: BillStatus = 'PENDING'
    if (newTotalReceived >= bill.billAmount) {
      newStatus = 'PAID'
    } else if (newTotalReceived > 0) {
      newStatus = 'PARTIAL'
    }

    await prisma.partyBill.update({
      where: { id: bill.id },
      data: { receivedAmount: newTotalReceived, status: newStatus },
    })

    remainingToDistribute -= payForThisBill
  }

  // Create Transaction record for CashFlow tracking
  await prisma.transaction.create({
    data: {
      transporterId: tid,
      projectId: data.projectId || null,
      type: 'PARTY_PAYMENT',
      amount: data.amount,
      status: 'COMPLETED',
      referenceNo: data.referenceNo || null,
      description: `Overall Party Payment Received${data.remarks ? ': ' + data.remarks : ''}`,
    }
  })

  revalidateDashboard()
}

export async function deleteBillPayment(paymentId: string) {
  const tid = await getTransporterId()

  const payment = await prisma.billPayment.findUnique({
    where: { id: paymentId },
    include: { bill: { select: { id: true, transporterId: true, billAmount: true, dueDate: true } } },
  })
  if (!payment || payment.bill.transporterId !== tid) throw new Error('Payment not found')

  await prisma.billPayment.delete({ where: { id: paymentId } })

  // Recalculate
  const remaining = await prisma.billPayment.findMany({
    where: { billId: payment.billId },
    select: { amount: true },
  })
  const totalReceived = remaining.reduce((s, p) => s + p.amount, 0)

  let status: BillStatus = 'PENDING'
  if (totalReceived >= payment.bill.billAmount) status = 'PAID'
  else if (totalReceived > 0) status = 'PARTIAL'
  else if (payment.bill.dueDate && new Date() > payment.bill.dueDate) status = 'OVERDUE'

  await prisma.partyBill.update({
    where: { id: payment.billId },
    data: { receivedAmount: totalReceived, status },
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
  if (filters.status) where.status = filters.status

  return prisma.partyBill.findMany({
    where,
    include: {
      project: { select: { id: true, projectName: true } },
      payments: { orderBy: { date: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
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
    select: { billAmount: true, incentive: true, receivedAmount: true, status: true },
  })

  const totalBaseBilled = bills.reduce((s, b) => s + b.billAmount, 0)
  const totalIncentives = bills.reduce((s, b) => s + (b.incentive || 0), 0)
  const totalBilled = totalBaseBilled + totalIncentives
  const totalReceived = bills.reduce((s, b) => s + b.receivedAmount, 0)
  const totalPending = totalBilled - totalReceived

  return {
    totalBilled,
    totalBaseBilled,
    totalIncentives,
    totalReceived,
    totalPending,
    totalBills: bills.length,
    pendingBills: bills.filter(b => b.status === 'PENDING').length,
    partialBills: bills.filter(b => b.status === 'PARTIAL').length,
    paidBills: bills.filter(b => b.status === 'PAID').length,
    overdueBills: bills.filter(b => b.status === 'OVERDUE').length,
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
    const totalBillPayable = b.billAmount + (b.incentive || 0)
    const existing = projectMap.get(pid) || { projectName: b.project.projectName, billed: 0, received: 0, pending: 0, count: 0 }
    existing.billed += totalBillPayable
    existing.received += b.receivedAmount
    existing.pending += (totalBillPayable - b.receivedAmount)
    existing.count += 1
    projectMap.set(pid, existing)
  }

  return [...projectMap.entries()]
    .map(([projectId, data]) => ({ projectId, ...data }))
    .sort((a, b) => b.pending - a.pending)
}

export async function deletePartyBill(billId: string) {
  const tid = await getTransporterId()
  const bill = await prisma.partyBill.findFirst({ where: { id: billId, transporterId: tid } })
  if (!bill) throw new Error('Bill not found')

  await prisma.partyBill.delete({ where: { id: billId } })
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
  submittedAt?: string | null
  dueDate?: string | null
  remarks?: string | null
}) {
  const tid = await getTransporterId()
  const bill = await prisma.partyBill.findFirst({ where: { id: billId, transporterId: tid } })
  if (!bill) throw new Error('Bill not found')

  const updateData: any = {}
  if (data.billNo !== undefined) {
    // Check for duplicate bill number (excluding current bill)
    if (data.billNo !== bill.billNo) {
      const dup = await prisma.partyBill.findFirst({
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
  if (data.billAmount !== undefined || data.incentive !== undefined) {
    if (data.billAmount !== undefined) updateData.billAmount = data.billAmount
    const finalBillAmount = data.billAmount ?? bill.billAmount
    const finalIncentive = data.incentive ?? bill.incentive
    const totalPayable = finalBillAmount + finalIncentive

    // Recalculate status based on new total amount
    const payments = await prisma.billPayment.findMany({
      where: { billId },
      select: { amount: true },
    })
    const totalReceived = payments.reduce((s, p) => s + p.amount, 0)
    let status: BillStatus = 'PENDING'
    if (totalReceived >= totalPayable) status = 'PAID'
    else if (totalReceived > 0) status = 'PARTIAL'
    else if (data.dueDate !== undefined ? (data.dueDate && new Date() > new Date(data.dueDate)) : (bill.dueDate && new Date() > bill.dueDate)) status = 'OVERDUE'
    updateData.status = status
  }
  if (data.submittedAt !== undefined) updateData.submittedAt = data.submittedAt ? new Date(data.submittedAt) : null
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.remarks !== undefined) updateData.remarks = data.remarks

  await prisma.partyBill.update({ where: { id: billId }, data: updateData })
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
