'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function getTransporterId() {
  const session = await auth()
  const tid = (session?.user as any)?.transporterId
  if (!tid) throw new Error('Unauthorized')
  return tid
}

// ── Partners ──
export async function getPartners() {
  const tid = await getTransporterId()
  return prisma.businessPartner.findMany({
    where: { transporterId: tid },
    orderBy: { createdAt: 'asc' },
  })
}

export async function upsertPartner(data: {
  id?: string
  name: string
  phone?: string
  equityPct: number
  investedAmount: number
}) {
  const tid = await getTransporterId()
  if (data.id) {
    await prisma.businessPartner.update({
      where: { id: data.id },
      data: { name: data.name, phone: data.phone, equityPct: data.equityPct, investedAmount: data.investedAmount },
    })
  } else {
    await prisma.businessPartner.create({
      data: { ...data, transporterId: tid },
    })
  }
  revalidatePath('/dashboard/partners')
}

export async function deletePartner(id: string) {
  const tid = await getTransporterId()
  await prisma.businessPartner.deleteMany({ where: { id, transporterId: tid } })
  revalidatePath('/dashboard/partners')
}

// ── Company Expenses ──
export async function getCompanyExpenses(limit = 50) {
  const tid = await getTransporterId()
  return prisma.companyExpense.findMany({
    where: { transporterId: tid },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export async function addCompanyExpense(data: {
  date: string
  amount: number
  type: string
  description?: string
}) {
  const tid = await getTransporterId()
  await prisma.companyExpense.create({
    data: {
      date: new Date(data.date),
      amount: data.amount,
      type: data.type as any,
      description: data.description,
      transporterId: tid,
    },
  })
  revalidatePath('/dashboard/partners')
}

export async function deleteCompanyExpense(id: string) {
  const tid = await getTransporterId()
  await prisma.companyExpense.deleteMany({ where: { id, transporterId: tid } })
  revalidatePath('/dashboard/partners')
}

// ── Summary for P&L ──
export async function getPartnerSummary() {
  const tid = await getTransporterId()
  const [partners, expenses] = await Promise.all([
    prisma.businessPartner.findMany({ where: { transporterId: tid } }),
    prisma.companyExpense.findMany({ where: { transporterId: tid } }),
  ])
  const totalInvested = partners.reduce((a, p) => a + p.investedAmount, 0)
  const totalOverhead = expenses.reduce((a, e) => a + e.amount, 0)
  const partnerPayouts = expenses
    .filter(e => e.type === 'PARTNER_PAYOUT')
    .reduce((a, e) => a + e.amount, 0)
  return { partners, expenses, totalInvested, totalOverhead, partnerPayouts }
}
