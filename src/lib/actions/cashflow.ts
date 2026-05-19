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

export async function getCashFlows(limit = 200) {
  const tid = await getTransporterId()
  return prisma.cashFlow.findMany({
    where: { transporterId: tid },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export async function addCashFlow(data: {
  date: string
  direction: 'CASH_IN' | 'CASH_OUT'
  amount: number
  category: string
  description?: string
}) {
  const tid = await getTransporterId()
  if (data.amount <= 0) throw new Error('Amount must be positive')
  await prisma.cashFlow.create({
    data: {
      date: new Date(data.date),
      direction: data.direction,
      amount: data.amount,
      category: data.category,
      description: data.description,
      transporterId: tid,
    }
  })
  revalidateDashboard()
}

export async function deleteCashFlow(id: string) {
  const tid = await getTransporterId()
  await prisma.cashFlow.deleteMany({ where: { id, transporterId: tid } })
  revalidateDashboard()
}

export async function getCashFlowSummary() {
  const tid = await getTransporterId()
  const flows = await prisma.cashFlow.findMany({ where: { transporterId: tid } })
  const totalIn = flows.filter(f => f.direction === 'CASH_IN').reduce((a, f) => a + f.amount, 0)
  const totalOut = flows.filter(f => f.direction === 'CASH_OUT').reduce((a, f) => a + f.amount, 0)
  return { totalIn, totalOut, balance: totalIn - totalOut, count: flows.length }
}
