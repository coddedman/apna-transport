'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface ProjectRateData {
  projectId: string
  projectName: string
  location: string
  partyRate: number
  ownerRate: number
  totalTrips: number
  totalWeight: number
  totalRevenue: number      // ownerFreightAmount (what client pays)
  totalPayout: number       // partyFreightAmount (what we pay owner)
  actualSpread: number      // totalRevenue - totalPayout
  // Expense breakdown for this project
  expensesByType: { type: string; amount: number }[]
  totalExpenses: number
  // Weekly data for this project
  weeklyData: {
    weekKey: string
    trips: number
    weight: number
    revenue: number
    payout: number
    expenses: number
  }[]
}

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export async function fetchProjectRateData(projectId: string): Promise<ProjectRateData> {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const [project, trips, expenses] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, location: true, partyRate: true, ownerRate: true, transporterId: true },
    }),
    prisma.trip.findMany({
      where: { projectId, project: { transporterId } },
      select: { date: true, weight: true, ownerFreightAmount: true, partyFreightAmount: true },
      orderBy: { date: 'asc' },
      take: 5000,
    }),
    prisma.expense.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: { projectId, vehicle: { owner: { transporterId } } },
    }),
  ])

  if (!project || project.transporterId !== transporterId) throw new Error('Project not found')

  const totalTrips = trips.length
  const totalWeight = trips.reduce((a, t) => a + (t.weight || 0), 0)
  const totalRevenue = trips.reduce((a, t) => a + (t.ownerFreightAmount || 0), 0)
  const totalPayout = trips.reduce((a, t) => a + (t.partyFreightAmount || 0), 0)

  const expensesByType = expenses.map(e => ({
    type: e.type,
    amount: e._sum.amount || 0,
  })).sort((a, b) => b.amount - a.amount)

  const totalExpenses = expensesByType.reduce((a, e) => a + e.amount, 0)

  // Build weekly data
  const weekMap: Record<string, { trips: number; weight: number; revenue: number; payout: number; expenses: number }> = {}
  trips.forEach(t => {
    if (!t.date) return
    const k = getMonday(t.date)
    if (!weekMap[k]) weekMap[k] = { trips: 0, weight: 0, revenue: 0, payout: 0, expenses: 0 }
    weekMap[k].trips += 1
    weekMap[k].weight += t.weight || 0
    weekMap[k].revenue += t.ownerFreightAmount || 0
    weekMap[k].payout += t.partyFreightAmount || 0
  })

  const weeklyData = Object.entries(weekMap)
    .map(([weekKey, v]) => ({ weekKey, ...v }))
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))

  return {
    projectId: project.id,
    projectName: project.projectName,
    location: project.location,
    partyRate: project.partyRate,
    ownerRate: project.ownerRate,
    totalTrips,
    totalWeight,
    totalRevenue,
    totalPayout,
    actualSpread: totalRevenue - totalPayout,
    expensesByType,
    totalExpenses,
    weeklyData,
  }
}

export async function updateProjectRates(projectId: string, partyRate: number, ownerRate: number) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { transporterId: true },
  })

  if (!project || project.transporterId !== transporterId) throw new Error('Project not found')

  await prisma.project.update({
    where: { id: projectId },
    data: { partyRate, ownerRate },
  })

  return { success: true }
}
