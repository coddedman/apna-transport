'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function getVehicles() {
  const session = await auth()
  if (!session?.user?.transporterId) return []

  return await prisma.vehicle.findMany({
    where: {
      owner: {
        transporterId: session.user.transporterId
      }
    },
    include: {
      owner: true,
      trips: true,
    }
  })
}

export async function registerVehicle(data: { plateNo: string, ownerId: string }) {
  const session = await auth()
  if (!session?.user?.transporterId) throw new Error('Unauthorized')

  return await prisma.vehicle.create({
    data: {
      plateNo: data.plateNo,
      ownerId: data.ownerId,
    }
  })
}
