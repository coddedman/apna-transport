'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function getTransporters() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized: Super Admin access required')
  }

  return await prisma.transporter.findMany({
    include: {
      _count: {
        select: {
          users: true,
          projects: true,
          owners: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTransporterDetails(id: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized: Super Admin access required')
  }

  return await prisma.transporter.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      projects: true,
      owners: {
        include: {
          _count: {
            select: { vehicles: true },
          },
        },
      },
      _count: {
        select: {
          users: true,
          projects: true,
          owners: true,
        },
      },
    },
  })
}

export interface TenantMetrics {
  trips: number
  weight: number
  revenue: number      // partyFreightAmount — what clients are billed
  ownerPayout: number  // ownerFreightAmount — what vehicle owners are paid
  vehicles: number
  billed: number
  received: number
  lastActivity: Date | null
}

const EMPTY_METRICS: TenantMetrics = {
  trips: 0, weight: 0, revenue: 0, ownerPayout: 0, vehicles: 0, billed: 0, received: 0, lastActivity: null,
}

/**
 * Operational metrics per transporter, keyed by transporterId.
 * Four fixed queries regardless of tenant count — Trip/Vehicle reach the tenant
 * through a relation, so we map them up in memory rather than N queries per tenant.
 */
export async function getTenantMetrics(): Promise<Record<string, TenantMetrics>> {
  const session = await auth()
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized: Super Admin access required')
  }

  const [projects, tripsByProject, owners, billsByTenant] = await Promise.all([
    prisma.project.findMany({ select: { id: true, transporterId: true } }),
    prisma.trip.groupBy({
      by: ['projectId'],
      _sum: { partyFreightAmount: true, ownerFreightAmount: true, weight: true },
      _count: { id: true },
      _max: { date: true },
    }),
    prisma.owner.findMany({ select: { transporterId: true, _count: { select: { vehicles: true } } } }),
    prisma.partyBill.groupBy({
      by: ['transporterId'],
      _sum: { billAmount: true, receivedAmount: true },
    }),
  ])

  const tenantByProject = new Map(projects.map(p => [p.id, p.transporterId]))
  const metrics: Record<string, TenantMetrics> = {}
  const forTenant = (id: string) => (metrics[id] ??= { ...EMPTY_METRICS })

  for (const p of projects) forTenant(p.transporterId)

  for (const t of tripsByProject) {
    const tenantId = tenantByProject.get(t.projectId)
    if (!tenantId) continue
    const m = forTenant(tenantId)
    m.trips += t._count.id || 0
    m.weight += t._sum.weight || 0
    m.revenue += t._sum.partyFreightAmount || 0
    m.ownerPayout += t._sum.ownerFreightAmount || 0
    if (t._max.date && (!m.lastActivity || t._max.date > m.lastActivity)) m.lastActivity = t._max.date
  }

  for (const o of owners) forTenant(o.transporterId).vehicles += o._count.vehicles

  for (const b of billsByTenant) {
    const m = forTenant(b.transporterId)
    m.billed += b._sum.billAmount || 0
    m.received += b._sum.receivedAmount || 0
  }

  return metrics
}

export async function getPlatformStats() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized: Super Admin access required')
  }

  const [transporterCount, userCount, projectCount, vehicleCount] =
    await Promise.all([
      prisma.transporter.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.vehicle.count(),
    ])

  return { transporterCount, userCount, projectCount, vehicleCount }
}

export async function onboardTransporter(formData: FormData) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized: Super Admin access required')
  }

  const name = formData.get('name') as string
  const registration = formData.get('registration') as string
  const adminEmail = formData.get('adminEmail') as string
  const adminPassword = formData.get('adminPassword') as string

  if (!name || !adminEmail || !adminPassword) {
    throw new Error('Name, admin email, and password are required')
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  })
  if (existingUser) {
    throw new Error('A user with this email already exists')
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const result = await prisma.$transaction(async (tx) => {
    const transporter = await tx.transporter.create({
      data: {
        name,
        registration: registration || null,
      },
    })

    const user = await tx.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ORG_ADMIN',
        transporterId: transporter.id,
      },
    })

    return { transporter, user }
  })

  return {
    transporterId: result.transporter.id,
    transporterName: result.transporter.name,
    adminEmail: result.user.email,
  }
}
