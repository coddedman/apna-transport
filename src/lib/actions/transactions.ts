'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'
import { TransactionType, TransactionStatus } from '@prisma/client'

async function getTransporterId() {
  const session = await auth()
  const tid = (session?.user as any)?.transporterId
  if (!tid) throw new Error('Unauthorized')
  return tid
}

// ========================
// Transaction CRUD
// ========================

export async function createTransaction(data: {
  date: string
  type: TransactionType
  amount: number
  description?: string
  referenceNo?: string
  projectId?: string
  ownerId?: string
  settlementId?: string
}) {
  const tid = await getTransporterId()

  if (!data.amount || data.amount <= 0) throw new Error('Amount must be positive')
  if (!data.type) throw new Error('Transaction type is required')

  const transaction = await prisma.transaction.create({
    data: {
      date: new Date(data.date),
      type: data.type,
      amount: data.amount,
      description: data.description || null,
      referenceNo: data.referenceNo || null,
      projectId: data.projectId || null,
      ownerId: data.ownerId || null,
      settlementId: data.settlementId || null,
      transporterId: tid,
    }
  })

  revalidateDashboard()
  return transaction
}

export interface TransactionFilters {
  type?: TransactionType
  status?: TransactionStatus
  ownerId?: string
  projectId?: string
  startDate?: string
  endDate?: string
}

export async function getTransactions(filters: TransactionFilters = {}, limit = 200) {
  const tid = await getTransporterId()

  const where: any = { transporterId: tid }

  if (filters.type) where.type = filters.type
  if (filters.status) where.status = filters.status
  if (filters.ownerId) where.ownerId = filters.ownerId
  if (filters.projectId) where.projectId = filters.projectId

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) where.date.gte = new Date(filters.startDate)
    if (filters.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      where.date.lte = end
    }
  }

  return prisma.transaction.findMany({
    where,
    include: {
      project: { select: { id: true, projectName: true } },
      owner: { select: { id: true, ownerName: true } },
      settlement: { select: { id: true, periodStart: true, periodEnd: true, status: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export async function updateTransactionStatus(id: string, status: TransactionStatus) {
  const tid = await getTransporterId()

  const txn = await prisma.transaction.findFirst({ where: { id, transporterId: tid } })
  if (!txn) throw new Error('Transaction not found')

  await prisma.transaction.update({
    where: { id },
    data: { status },
  })

  revalidateDashboard()
}

export async function deleteTransaction(id: string) {
  const tid = await getTransporterId()

  const txn = await prisma.transaction.findFirst({ where: { id, transporterId: tid } })
  if (!txn) throw new Error('Transaction not found')

  await prisma.transaction.delete({ where: { id } })
  revalidateDashboard()
}

// ========================
// Transaction Summary
// ========================

export async function getTransactionSummary(filters: TransactionFilters = {}) {
  const tid = await getTransporterId()

  const where: any = { transporterId: tid }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) where.date.gte = new Date(filters.startDate)
    if (filters.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      where.date.lte = end
    }
  }

  const transactions = await prisma.transaction.findMany({ where })

  const partyReceived = transactions
    .filter(t => t.type === 'PARTY_PAYMENT' && t.status !== 'CANCELLED')
    .reduce((sum, t) => sum + t.amount, 0)

  const ownerPaid = transactions
    .filter(t => t.type === 'OWNER_PAYMENT' && t.status !== 'CANCELLED')
    .reduce((sum, t) => sum + t.amount, 0)

  const advancesGiven = transactions
    .filter(t => t.type === 'ADVANCE_GIVEN' && t.status !== 'CANCELLED')
    .reduce((sum, t) => sum + t.amount, 0)

  const refunds = transactions
    .filter(t => t.type === 'REFUND' && t.status !== 'CANCELLED')
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingCount = transactions.filter(t => t.status === 'PENDING').length
  const completedCount = transactions.filter(t => t.status === 'COMPLETED').length

  return {
    partyReceived,
    ownerPaid,
    advancesGiven,
    refunds,
    netBalance: partyReceived - ownerPaid - advancesGiven - refunds,
    totalTransactions: transactions.length,
    pendingCount,
    completedCount,
  }
}

// Get all owners and projects for form dropdowns
export async function getTransactionFormData() {
  const tid = await getTransporterId()

  const [owners, projects, settlements] = await Promise.all([
    prisma.owner.findMany({
      where: { transporterId: tid },
      select: { id: true, ownerName: true },
      orderBy: { ownerName: 'asc' },
    }),
    prisma.project.findMany({
      where: { transporterId: tid },
      select: { id: true, projectName: true },
      orderBy: { projectName: 'asc' },
    }),
    prisma.settlement.findMany({
      where: { owner: { transporterId: tid }, status: 'PENDING' },
      select: { id: true, ownerId: true, periodStart: true, periodEnd: true, finalPayout: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return { owners, projects, settlements }
}
