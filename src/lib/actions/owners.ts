'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getOwners() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []

  return await prisma.owner.findMany({
    where: { transporterId },
    include: {
      vehicles: true
    },
    orderBy: {
      ownerName: 'asc'
    }
  })
}

export async function createOwner(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const ownerName = formData.get('ownerName') as string
  const phone = formData.get('phone') as string

  if (!ownerName || !phone) {
    throw new Error('Missing required fields')
  }

  const owner = await prisma.owner.create({
    data: {
      ownerName,
      phone,
      transporterId
    }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/vehicles')
  return owner
}
