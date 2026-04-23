'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getVehicles() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []

  return await prisma.vehicle.findMany({
    where: {
      owner: {
        transporterId: transporterId
      }
    },
    include: {
      owner: true,
      project: true,
      trips: {
        include: { project: true }
      },
      expenses: {
        include: { project: true }
      }
    },
    orderBy: {
      plateNo: 'asc'
    }
  })
}

export async function createVehicle(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const plateNo = formData.get('plateNo') as string
  const ownerId = formData.get('ownerId') as string
  const projectId = formData.get('projectId') as string

  if (!plateNo || !ownerId) {
    throw new Error('Missing required fields')
  }

  // Check for duplicate plate number within the same transporter
  const existing = await prisma.vehicle.findFirst({
    where: {
      plateNo: plateNo.toUpperCase(),
      owner: { transporterId }
    }
  })
  if (existing) {
    throw new Error(`Vehicle with plate ${plateNo.toUpperCase()} already exists`)
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      plateNo: plateNo.toUpperCase(),
      ownerId: ownerId,
      projectId: projectId || null,
    }
  })

  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard')
  return vehicle
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const ownerId = formData.get('ownerId') as string
  const projectId = formData.get('projectId') as string

  // Verify vehicle belongs to this transporter
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, owner: { transporterId } }
  })
  if (!vehicle) throw new Error('Vehicle not found')

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...(ownerId ? { ownerId } : {}),
      projectId: projectId || null,
    }
  })

  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard')
}

export async function deleteVehicle(vehicleId: string) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, owner: { transporterId } },
    include: { _count: { select: { trips: true, expenses: true } } }
  })

  if (!vehicle) throw new Error('Vehicle not found')

  if (vehicle._count.trips > 0 || vehicle._count.expenses > 0) {
    throw new Error(`Cannot delete: ${vehicle._count.trips} trip(s) and ${vehicle._count.expenses} expense(s) exist`)
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } })

  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/owners')
}
