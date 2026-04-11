'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface AnalyticsFilters {
  period: string          // 'all' | '7d' | '30d' | '90d' | 'this_month' | 'this_year' | 'custom'
  startDate?: string      // ISO date string
  endDate?: string        // ISO date string
  projectId?: string      // filter by specific project
  ownerId?: string        // filter by specific owner
  vehicleId?: string      // filter by specific vehicle
}

export interface AnalyticsData {
  // KPI Cards
  totalTrips: number
  totalRevenue: number
  totalExpenses: number
  totalAdvances: number
  netProfit: number
  totalWeight: number
  activeVehicles: number
  activeOwners: number
  activeProjects: number
  avgRevenuePerTrip: number
  avgWeightPerTrip: number
  profitMargin: number

  // Time Series (daily data for charts)
  dailyRevenue: { date: string; value: number }[]
  dailyTrips: { date: string; value: number }[]
  dailyExpenses: { date: string; value: number }[]
  dailyWeight: { date: string; value: number }[]

  // Breakdowns
  expenseByType: { type: string; amount: number; pct: number }[]
  revenueByProject: { name: string; revenue: number; trips: number; weight: number }[]
  revenueByOwner: { name: string; revenue: number; expenses: number; trips: number; profit: number }[]
  revenueByVehicle: { plateNo: string; ownerName: string; revenue: number; expenses: number; trips: number; weight: number; profit: number }[]

  // Top Performers
  topVehicles: { plateNo: string; revenue: number; trips: number }[]
  topProjects: { name: string; revenue: number; trips: number }[]

  // Recent Activity
  recentTrips: { id: string; date: string; vehicle: string; project: string; weight: number; amount: number }[]
  recentExpenses: { id: string; date: string; vehicle: string; type: string; amount: number }[]

  // Filter options (for dropdowns)
  projects: { id: string; name: string }[]
  owners: { id: string; name: string }[]
  vehicles: { id: string; plateNo: string }[]

  // Period label
  periodLabel: string
}

function getDateRange(filters: AnalyticsFilters): { startDate?: Date; endDate: Date } {
  const endDate = new Date()
  let startDate: Date | undefined

  switch (filters.period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'this_month':
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      break
    case 'this_year':
      startDate = new Date(new Date().getFullYear(), 0, 1)
      break
    case 'custom':
      if (filters.startDate) startDate = new Date(filters.startDate)
      if (filters.endDate) return { startDate, endDate: new Date(filters.endDate) }
      break
    default:
      // 'all' — no start date
      break
  }

  return { startDate, endDate }
}

export async function fetchAnalytics(filters: AnalyticsFilters): Promise<AnalyticsData> {
  const session = await auth()
  const user = session?.user as any
  const transporterId = user?.transporterId

  if (!transporterId) throw new Error('Unauthorized')

  const { startDate, endDate } = getDateRange(filters)
  const dateFilter = startDate ? { date: { gte: startDate, lte: endDate } } : {}

  // Build where clauses
  const tripWhere: any = {
    project: { transporterId },
    ...dateFilter,
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
  }

  // If filtering by owner, we need to go through vehicle
  if (filters.ownerId) {
    tripWhere.vehicle = { ...tripWhere.vehicle, ownerId: filters.ownerId }
  }

  const expenseWhere: any = {
    vehicle: { owner: { transporterId } },
    ...dateFilter,
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
  }

  if (filters.ownerId) {
    expenseWhere.vehicle = { ...expenseWhere.vehicle, ownerId: filters.ownerId }
  }

  const advanceWhere: any = {
    owner: { transporterId },
    ...dateFilter,
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
  }

  // === Parallel data fetching ===
  const [
    tripsAggr,
    tripCount,
    expenseAggr,
    advanceAggr,
    vehicleCount,
    ownerCount,
    projectCount,
    allTrips,
    allExpenses,
    allAdvances,
    projectsList,
    ownersList,
    vehiclesList,
    recentTripsData,
    recentExpensesData,
    expensesByType,
  ] = await Promise.all([
    // Aggregates
    prisma.trip.aggregate({
      _sum: { weight: true, partyFreightAmount: true, ownerFreightAmount: true },
      where: tripWhere,
    }),
    prisma.trip.count({ where: tripWhere }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: expenseWhere,
    }),
    prisma.ownerAdvance.aggregate({
      _sum: { amount: true },
      where: advanceWhere,
    }),

    // Counts
    prisma.vehicle.count({ where: { owner: { transporterId } } }),
    prisma.owner.count({ where: { transporterId } }),
    prisma.project.count({ where: { transporterId } }),

    // Raw data for time series & breakdowns
    prisma.trip.findMany({
      where: tripWhere,
      include: { vehicle: { include: { owner: true } }, project: true },
      orderBy: { date: 'desc' },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      include: { vehicle: { include: { owner: true } }, project: true },
      orderBy: { date: 'desc' },
    }),
    prisma.ownerAdvance.findMany({
      where: advanceWhere,
      include: { owner: true, project: true },
      orderBy: { date: 'desc' },
    }),

    // Filter dropdown options
    prisma.project.findMany({
      where: { transporterId },
      select: { id: true, projectName: true },
      orderBy: { projectName: 'asc' },
    }),
    prisma.owner.findMany({
      where: { transporterId },
      select: { id: true, ownerName: true },
      orderBy: { ownerName: 'asc' },
    }),
    prisma.vehicle.findMany({
      where: { owner: { transporterId } },
      select: { id: true, plateNo: true },
      orderBy: { plateNo: 'asc' },
    }),

    // Recent items
    prisma.trip.findMany({
      where: tripWhere,
      orderBy: { date: 'desc' },
      take: 10,
      include: { vehicle: true, project: true },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      orderBy: { date: 'desc' },
      take: 10,
      include: { vehicle: true },
    }),

    // Expense breakdown by type
    prisma.expense.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: expenseWhere,
    }),
  ])

  // === Calculate KPIs ===
  const totalRevenue = tripsAggr._sum.partyFreightAmount || 0
  const ownerFreight = tripsAggr._sum.ownerFreightAmount || 0
  const totalWeight = tripsAggr._sum.weight || 0
  const totalExpenses = (expenseAggr._sum.amount || 0)
  const totalAdvances = advanceAggr._sum.amount || 0
  const totalCombinedExpense = totalExpenses + totalAdvances + ownerFreight
  const netProfit = totalRevenue - totalCombinedExpense
  const avgRevenuePerTrip = tripCount > 0 ? totalRevenue / tripCount : 0
  const avgWeightPerTrip = tripCount > 0 ? totalWeight / tripCount : 0
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // === Build Time Series ===
  const dayCount = startDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
    : 30 // default to last 30 days for time series

  const seriesStart = startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
  const revenueMap = new Map<string, number>()
  const tripsMap = new Map<string, number>()
  const expensesMap = new Map<string, number>()
  const weightMap = new Map<string, number>()

  const actualDays = Math.min(dayCount, 365)
  for (let i = 0; i < actualDays; i++) {
    const d = new Date(seriesStart.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    revenueMap.set(key, 0)
    tripsMap.set(key, 0)
    expensesMap.set(key, 0)
    weightMap.set(key, 0)
  }

  allTrips.forEach(t => {
    const key = new Date(t.date).toISOString().split('T')[0]
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) || 0) + t.partyFreightAmount)
      tripsMap.set(key, (tripsMap.get(key) || 0) + 1)
      weightMap.set(key, (weightMap.get(key) || 0) + t.weight)
      // We can also add ownerFreight to expensesMap for daily view
      expensesMap.set(key, (expensesMap.get(key) || 0) + t.ownerFreightAmount)
    }
  })

  allExpenses.forEach(e => {
    const key = new Date(e.date).toISOString().split('T')[0]
    if (expensesMap.has(key)) {
      expensesMap.set(key, (expensesMap.get(key) || 0) + e.amount)
    }
  })

  allAdvances.forEach(a => {
    const key = new Date(a.date).toISOString().split('T')[0]
    if (expensesMap.has(key)) {
      expensesMap.set(key, (expensesMap.get(key) || 0) + a.amount)
    }
  })

  const dailyRevenue = Array.from(revenueMap.entries()).map(([date, value]) => ({ date, value }))
  const dailyTrips = Array.from(tripsMap.entries()).map(([date, value]) => ({ date, value }))
  const dailyExpenses = Array.from(expensesMap.entries()).map(([date, value]) => ({ date, value }))
  const dailyWeight = Array.from(weightMap.entries()).map(([date, value]) => ({ date, value }))

  // === Expense by Type ===
  const totalExpenseForPct = totalCombinedExpense || 1
  const expenseByType = expensesByType.map(e => ({
    type: e.type.replace(/_/g, ' '),
    amount: e._sum.amount || 0,
    pct: Math.round(((e._sum.amount || 0) / totalExpenseForPct) * 100),
  }))

  if (ownerFreight > 0) {
    expenseByType.push({
      type: 'OWNER FREIGHT',
      amount: ownerFreight,
      pct: Math.round((ownerFreight / totalExpenseForPct) * 100),
    })
  }

  if (totalAdvances > 0) {
    expenseByType.push({
      type: 'OWNER ADVANCE',
      amount: totalAdvances,
      pct: Math.round((totalAdvances / totalExpenseForPct) * 100),
    })
  }
  expenseByType.sort((a, b) => b.amount - a.amount)

  // === Revenue by Project ===
  const projMap = new Map<string, { name: string; revenue: number; trips: number; weight: number }>()
  allTrips.forEach(t => {
    const key = t.projectId
    const existing = projMap.get(key)
    if (existing) {
      existing.revenue += t.partyFreightAmount
      existing.trips += 1
      existing.weight += t.weight
    } else {
      projMap.set(key, { name: t.project.projectName, revenue: t.partyFreightAmount, trips: 1, weight: t.weight })
    }
  })
  const revenueByProject = Array.from(projMap.values()).sort((a, b) => b.revenue - a.revenue)

  // === Revenue by Owner ===
  const ownerMap = new Map<string, { name: string; revenue: number; expenses: number; trips: number; profit: number }>()
  allTrips.forEach(t => {
    const oid = t.vehicle.ownerId
    const existing = ownerMap.get(oid)
    if (existing) {
      existing.revenue += t.partyFreightAmount
      existing.expenses += t.ownerFreightAmount
      existing.trips += 1
    } else {
      ownerMap.set(oid, { name: t.vehicle.owner.ownerName, revenue: t.partyFreightAmount, expenses: t.ownerFreightAmount, trips: 1, profit: 0 })
    }
  })
  allExpenses.forEach(e => {
    const oid = e.vehicle.ownerId
    const existing = ownerMap.get(oid)
    if (existing) {
      existing.expenses += e.amount
    } else {
      ownerMap.set(oid, { name: e.vehicle.owner.ownerName, revenue: 0, expenses: e.amount, trips: 0, profit: 0 })
    }
  })
  allAdvances.forEach(a => {
    const oid = a.ownerId
    const existing = ownerMap.get(oid)
    if (existing) {
      existing.expenses += a.amount
    } else {
      ownerMap.set(oid, { name: a.owner.ownerName, revenue: 0, expenses: a.amount, trips: 0, profit: 0 })
    }
  })
  const revenueByOwner = Array.from(ownerMap.values())
    .map(o => ({ ...o, profit: o.revenue - o.expenses }))
    .sort((a, b) => b.revenue - a.revenue)

  // === Revenue by Vehicle ===
  const vehMap = new Map<string, { plateNo: string; ownerName: string; revenue: number; expenses: number; trips: number; weight: number; profit: number }>()
  allTrips.forEach(t => {
    const vid = t.vehicleId
    const existing = vehMap.get(vid)
    if (existing) {
      existing.revenue += t.partyFreightAmount
      existing.expenses += t.ownerFreightAmount
      existing.trips += 1
      existing.weight += t.weight
    } else {
      vehMap.set(vid, { plateNo: t.vehicle.plateNo, ownerName: t.vehicle.owner.ownerName, revenue: t.partyFreightAmount, expenses: t.ownerFreightAmount, trips: 1, weight: t.weight, profit: 0 })
    }
  })
  allExpenses.forEach(e => {
    const vid = e.vehicleId
    const existing = vehMap.get(vid)
    if (existing) {
      existing.expenses += e.amount
    } else {
      vehMap.set(vid, { plateNo: e.vehicle.plateNo, ownerName: e.vehicle.owner.ownerName, revenue: 0, expenses: e.amount, trips: 0, weight: 0, profit: 0 })
    }
  })
  const revenueByVehicle = Array.from(vehMap.values())
    .map(v => ({ ...v, profit: v.revenue - v.expenses }))
    .sort((a, b) => b.revenue - a.revenue)

  // === Top Performers ===
  const topVehicles = revenueByVehicle.slice(0, 5).map(v => ({ plateNo: v.plateNo, revenue: v.revenue, trips: v.trips }))
  const topProjects = revenueByProject.slice(0, 5).map(p => ({ name: p.name, revenue: p.revenue, trips: p.trips }))

  // Period label
  const periodLabels: Record<string, string> = {
    all: 'All Time',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    this_month: 'This Month',
    this_year: 'This Year',
    custom: 'Custom Range',
  }

  return {
    totalTrips: tripCount,
    totalRevenue,
    totalExpenses: totalCombinedExpense,
    totalAdvances,
    netProfit,
    totalWeight,
    activeVehicles: vehicleCount,
    activeOwners: ownerCount,
    activeProjects: projectCount,
    avgRevenuePerTrip,
    avgWeightPerTrip,
    profitMargin,
    dailyRevenue,
    dailyTrips,
    dailyExpenses,
    dailyWeight,
    expenseByType,
    revenueByProject,
    revenueByOwner,
    revenueByVehicle,
    topVehicles,
    topProjects,
    recentTrips: recentTripsData.map(t => ({
      id: t.id,
      date: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
      vehicle: t.vehicle.plateNo,
      project: t.project.projectName,
      weight: t.weight,
      amount: t.partyFreightAmount,
    })),
    recentExpenses: recentExpensesData.map(e => ({
      id: e.id,
      date: new Date(e.date).toLocaleDateString(),
      vehicle: e.vehicle.plateNo,
      type: e.type.replace(/_/g, ' '),
      amount: e.amount,
    })),
    projects: projectsList.map(p => ({ id: p.id, name: p.projectName })),
    owners: ownersList.map(o => ({ id: o.id, name: o.ownerName })),
    vehicles: vehiclesList.map(v => ({ id: v.id, plateNo: v.plateNo })),
    periodLabel: periodLabels[filters.period] || 'All Time',
  }
}
