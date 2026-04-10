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
