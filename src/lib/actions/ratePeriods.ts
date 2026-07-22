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

// ========================
// Rate Period CRUD
// ========================

export async function getRatePeriods(projectId: string) {
  const tid = await getTransporterId()
  const project = await prisma.project.findFirst({ where: { id: projectId, transporterId: tid } })
  if (!project) throw new Error('Project not found')

  return prisma.ratePeriod.findMany({
    where: { projectId },
    orderBy: { periodStart: 'desc' },
  })
}

export async function createRatePeriod(data: {
  projectId: string
  periodStart: string // ISO date
  periodEnd: string   // ISO date
  partyRate: number
  ownerRate: number
  label?: string
}) {
  const tid = await getTransporterId()
  const project = await prisma.project.findFirst({ where: { id: data.projectId, transporterId: tid } })
  if (!project) throw new Error('Project not found')

  if (data.partyRate < 0 || data.ownerRate < 0) throw new Error('Rates cannot be negative')

  const period = await prisma.ratePeriod.create({
    data: {
      projectId: data.projectId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      partyRate: data.partyRate,
      ownerRate: data.ownerRate,
      label: data.label || null,
    }
  })

  revalidateDashboard()
  return period
}

export async function updateRatePeriod(id: string, data: { partyRate: number; ownerRate: number }) {
  const tid = await getTransporterId()

  const period = await prisma.ratePeriod.findUnique({
    where: { id },
    include: { project: { select: { transporterId: true } } }
  })
  if (!period || period.project.transporterId !== tid) throw new Error('Rate period not found')

  await prisma.ratePeriod.update({
    where: { id },
    data: { partyRate: data.partyRate, ownerRate: data.ownerRate },
  })

  revalidateDashboard()
}

export async function deleteRatePeriod(id: string) {
  const tid = await getTransporterId()

  const period = await prisma.ratePeriod.findUnique({
    where: { id },
    include: { project: { select: { transporterId: true } } }
  })
  if (!period || period.project.transporterId !== tid) throw new Error('Rate period not found')

  await prisma.ratePeriod.delete({ where: { id } })
  revalidateDashboard()
}

// ========================
// Rate Lookup for a Date
// ========================

/**
 * Get the applicable rate for a project on a specific date.
 * Falls back to project default if no rate period is defined.
 */
export async function getActiveRateForDate(projectId: string, date: Date): Promise<{ partyRate: number; ownerRate: number; source: 'period' | 'project' }> {
  const period = await prisma.ratePeriod.findFirst({
    where: {
      projectId,
      periodStart: { lte: date },
      periodEnd: { gte: date },
    }
  })

  if (period) {
    return { partyRate: period.partyRate, ownerRate: period.ownerRate, source: 'period' }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { partyRate: true, ownerRate: true },
  })

  return {
    partyRate: project?.partyRate ?? 0,
    ownerRate: project?.ownerRate ?? 0,
    source: 'project',
  }
}

// ========================
// Auto-generate Fortnightly Periods
// ========================

/**
 * Generate fortnightly rate period slots for a project.
 * Creates periods for the next N months from a given start month.
 */
export async function generateFortnightlyPeriods(
  projectId: string,
  startYear: number,
  startMonth: number, // 0-indexed (JS month)
  monthsCount: number = 3,
) {
  const tid = await getTransporterId()
  const project = await prisma.project.findFirst({ where: { id: projectId, transporterId: tid } })
  if (!project) throw new Error('Project not found')

  const periods: { periodStart: Date; periodEnd: Date; label: string }[] = []

  for (let i = 0; i < monthsCount; i++) {
    const year = startYear + Math.floor((startMonth + i) / 12)
    const month = (startMonth + i) % 12

    const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'short' })

    // First half: 1st - 15th
    const firstStart = new Date(year, month, 1)
    const firstEnd = new Date(year, month, 15, 23, 59, 59, 999)
    periods.push({ periodStart: firstStart, periodEnd: firstEnd, label: `${monthName} 1-15, ${year}` })

    // Second half: 16th - last day
    const lastDay = new Date(year, month + 1, 0).getDate()
    const secondStart = new Date(year, month, 16)
    const secondEnd = new Date(year, month, lastDay, 23, 59, 59, 999)
    periods.push({ periodStart: secondStart, periodEnd: secondEnd, label: `${monthName} 16-${lastDay}, ${year}` })
  }

  let created = 0
  for (const p of periods) {
    // Skip if already exists
    const existing = await prisma.ratePeriod.findUnique({
      where: { projectId_periodStart: { projectId, periodStart: p.periodStart } }
    })
    if (existing) continue

    await prisma.ratePeriod.create({
      data: {
        projectId,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        partyRate: project.partyRate,
        ownerRate: project.ownerRate,
        label: p.label,
      }
    })
    created++
  }

  revalidateDashboard()
  return { created, total: periods.length }
}
