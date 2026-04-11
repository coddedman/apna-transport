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
