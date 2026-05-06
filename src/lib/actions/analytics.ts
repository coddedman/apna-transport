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
  totalRevenue: number       // ownerFreightAmount — what company pays transporter
  ownerPayout: number        // partyFreightAmount — what transporter pays vehicle owner
  totalExpenses: number      // running expenses + advances
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
  revenueByVehicle: { plateNo: string; ownerName: string; revenue: number; payout: number; expenses: number; trips: number; weight: number; profit: number; fuel: number; maintenance: number; toll: number; driverAdvance: number; otherExp: number }[]
  vehicleExpenseBreakdown: { vehicleId: string; plateNo: string; type: string; amount: number }[]

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

  // To prevent memory limits in production, we should cap 'all' period to a reasonable range if needed,
  // but for now let's just make the data processing more robust.

  // === Parallel data fetching ===
  // === Parallel data fetching ===
  const [
    tripsAggr,           // 0
    tripCount,           // 1
    expenseAggr,         // 2
    advanceAggr,         // 3
    vehicleCount,        // 4
    ownerCount,          // 5
    projectCount,        // 6
    projectsList,        // 7
    ownersList,          // 8
    vehiclesList,        // 9
    recentTripsData,     // 10
    recentExpensesData,  // 11
    expensesByType,      // 12
    revenueByProjectData, // 13
    revenueByOwnerData,  // 14
    revenueByVehicleData, // 15
    expenseByVehicleData, // 16
    timeSeriesTrips,     // 16
    timeSeriesExpenses,  // 17
    timeSeriesAdvances,  // 18
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

    // Recent items (capped at 10)
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

    // Breakdown Aggregations
    prisma.expense.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: expenseWhere,
    }),

    // Revenue by Project
    prisma.trip.groupBy({
      by: ['projectId'],
      _sum: { ownerFreightAmount: true, weight: true },
      _count: { id: true },
      where: tripWhere,
    }),

    // Revenue by Owner (via Vehicle)
    prisma.trip.findMany({
      where: tripWhere,
      select: {
        ownerFreightAmount: true,
        partyFreightAmount: true,
        vehicle: { select: { ownerId: true, owner: { select: { ownerName: true } } } }
      }
    }),

    // Revenue by Vehicle
    prisma.trip.groupBy({
      by: ['vehicleId'],
      _sum: { ownerFreightAmount: true, partyFreightAmount: true, weight: true },
      _count: { id: true },
      where: tripWhere,
    }),

    // Expenses by Vehicle + Type
    prisma.expense.groupBy({
      by: ['vehicleId', 'type'],
      _sum: { amount: true },
      where: expenseWhere,
    }),

    // Time Series data (explicitly limited to chart range)
    prisma.trip.findMany({
      where: { ...tripWhere, date: { gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), lte: endDate } },
      select: { date: true, ownerFreightAmount: true, partyFreightAmount: true, weight: true }
    }),
    prisma.expense.findMany({
      where: { ...expenseWhere, date: { gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), lte: endDate } },
      select: { date: true, amount: true }
    }),
    prisma.ownerAdvance.findMany({
      where: { ...advanceWhere, date: { gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), lte: endDate } },
      select: { date: true, amount: true }
    }),
  ])

  // === Calculate KPIs ===
  const totalRevenue = tripsAggr._sum.ownerFreightAmount || 0
  const vehiclePayoutCost = tripsAggr._sum.partyFreightAmount || 0
  const totalWeight = tripsAggr._sum.weight || 0
  const totalExpenses = (expenseAggr._sum.amount || 0)
  const totalAdvances = advanceAggr._sum.amount || 0
  const totalCombinedExpense = totalExpenses + totalAdvances
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

  timeSeriesTrips.forEach(t => {
    if (!t.date) return
    const key = new Date(t.date).toISOString().split('T')[0]
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) || 0) + (t.ownerFreightAmount || 0))
      tripsMap.set(key, (tripsMap.get(key) || 0) + 1)
      weightMap.set(key, (weightMap.get(key) || 0) + (t.weight || 0))
      expensesMap.set(key, (expensesMap.get(key) || 0) + (t.partyFreightAmount || 0))
    }
  })

  timeSeriesExpenses.forEach(e => {
    if (!e.date) return
    const key = new Date(e.date).toISOString().split('T')[0]
    if (expensesMap.has(key)) {
      expensesMap.set(key, (expensesMap.get(key) || 0) + (e.amount || 0))
    }
  })

  timeSeriesAdvances.forEach(a => {
    if (!a.date) return
    const key = new Date(a.date).toISOString().split('T')[0]
    if (expensesMap.has(key)) {
      expensesMap.set(key, (expensesMap.get(key) || 0) + (a.amount || 0))
    }
  })

  const dailyRevenue = Array.from(revenueMap.entries()).map(([date, value]) => ({ date, value }))
  const dailyTrips = Array.from(tripsMap.entries()).map(([date, value]) => ({ date, value }))
  const dailyExpenses = Array.from(expensesMap.entries()).map(([date, value]) => ({ date, value }))
  const dailyWeight = Array.from(weightMap.entries()).map(([date, value]) => ({ date, value }))

  // === Expense by Type ===
  const totalExpenseForBreakdown = totalExpenses + totalAdvances || 1
  const expenseByType = expensesByType.map(e => ({
    type: e.type.replace(/_/g, ' '),
    amount: e._sum.amount || 0,
    pct: Math.round(((e._sum.amount || 0) / totalExpenseForBreakdown) * 100),
  }))

  if (totalAdvances > 0) {
    expenseByType.push({
      type: 'OWNER ADVANCE',
      amount: totalAdvances,
      pct: Math.round((totalAdvances / totalExpenseForBreakdown) * 100),
    })
  }
  expenseByType.sort((a, b) => b.amount - a.amount)

  // === Revenue by Project ===
  const revenueByProject = revenueByProjectData.map(p => {
    const project = projectsList.find(proj => proj.id === p.projectId)
    return {
      name: project?.projectName || 'Deleted Project',
      revenue: p._sum.ownerFreightAmount || 0,
      trips: p._count.id || 0,
      weight: p._sum.weight || 0,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  // === Revenue by Owner ===
  const ownerMap = new Map<string, { name: string; revenue: number; expenses: number; trips: number; profit: number }>()
  revenueByOwnerData.forEach(t => {
    const oid = t.vehicle?.ownerId
    if (!oid) return
    const existing = ownerMap.get(oid)
    if (existing) {
      existing.revenue += (t.ownerFreightAmount || 0)
      existing.expenses += (t.partyFreightAmount || 0)
      existing.trips += 1
    } else {
      ownerMap.set(oid, { name: t.vehicle?.owner?.ownerName || 'Unknown Owner', revenue: (t.ownerFreightAmount || 0), expenses: (t.partyFreightAmount || 0), trips: 1, profit: 0 })
    }
  })
  // Note: We might miss some expenses here if we don't fetch all of them, 
  // but we can add those to the query above if needed.
  const revenueByOwner = Array.from(ownerMap.values())
    .map(o => ({ ...o, profit: o.revenue - o.expenses }))
    .sort((a, b) => b.revenue - a.revenue)

  // === Vehicle Expense Breakdown by Type ===
  const vehicleExpenseBreakdown = (expenseByVehicleData as any[]).map((e: any) => {
    const vehicle = vehiclesList.find((veh: any) => veh.id === e.vehicleId)
    return {
      vehicleId: e.vehicleId,
      plateNo: vehicle?.plateNo || 'Unknown',
      type: e.type as string,
      amount: e._sum.amount || 0,
    }
  })

  // === Revenue by Vehicle ===
  const revenueByVehicle = revenueByVehicleData.map(v => {
    const vehicle = vehiclesList.find(veh => veh.id === v.vehicleId)
    const rev = v._sum.ownerFreightAmount || 0
    const exp = v._sum.partyFreightAmount || 0
    const vExpenses = vehicleExpenseBreakdown.filter((e: any) => e.vehicleId === v.vehicleId)
    const fuel = vExpenses.find((e: any) => e.type === 'FUEL')?.amount || 0
    const maintenance = vExpenses.find((e: any) => e.type === 'MAINTENANCE')?.amount || 0
    const toll = vExpenses.find((e: any) => e.type === 'TOLL')?.amount || 0
    const driverAdvance = vExpenses.find((e: any) => e.type === 'DRIVER_ADVANCE')?.amount || 0
    const otherExp = vExpenses.filter((e: any) => !['FUEL','MAINTENANCE','TOLL','DRIVER_ADVANCE'].includes(e.type)).reduce((a: number, e: any) => a + e.amount, 0)
    const totalRunningExp = fuel + maintenance + toll + driverAdvance + otherExp
    return {
      plateNo: vehicle?.plateNo || 'Unknown',
      ownerName: '—',
      revenue: rev,
      payout: exp, // partyFreightAmount
      expenses: totalRunningExp,
      trips: v._count.id || 0,
      weight: v._sum.weight || 0,
      profit: rev - exp - totalRunningExp,
      fuel,
      maintenance,
      toll,
      driverAdvance,
      otherExp,
    }
  }).sort((a, b) => b.revenue - a.revenue)

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
    ownerPayout: vehiclePayoutCost,
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
    vehicleExpenseBreakdown,
    topVehicles,
    topProjects,
    recentTrips: recentTripsData.map(t => {
      let dateStr = 'Unknown'
      try {
        if (t.date) {
          dateStr = new Date(t.date).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
        }
      } catch (e) {
        console.error('Date parsing error', e)
      }
      return {
        id: t.id,
        date: dateStr,
        vehicle: t.vehicle?.plateNo || 'Unknown',
        project: t.project?.projectName || 'Unknown',
        weight: t.weight || 0,
        amount: t.ownerFreightAmount || 0,
      }
    }),
    recentExpenses: recentExpensesData.map(e => {
      let dateStr = 'Unknown'
      try {
        if (e.date) {
          dateStr = new Date(e.date).toLocaleDateString()
        }
      } catch (e) {
        console.error('Date parsing error', e)
      }
      return {
        id: e.id,
        date: dateStr,
        vehicle: e.vehicle?.plateNo || 'Unknown',
        type: (e.type || 'Other').replace(/_/g, ' '),
        amount: e.amount || 0,
      }
    }),
    projects: projectsList.map(p => ({ id: p.id, name: p.projectName })),
    owners: ownersList.map(o => ({ id: o.id, name: o.ownerName })),
    vehicles: vehiclesList.map(v => ({ id: v.id, plateNo: v.plateNo })),
    periodLabel: periodLabels[filters.period] || 'All Time',
  }
}
