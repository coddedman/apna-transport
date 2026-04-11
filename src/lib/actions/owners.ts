'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function getOwners() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []

  return await prisma.owner.findMany({
    where: { transporterId },
    include: {
      vehicles: true,
      user: { select: { email: true } },
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
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!ownerName || !phone) {
    throw new Error('Owner name and phone are required')
  }

  // If email+password provided, create a login account for the owner
  let userId: string | undefined

  if (email && password) {
    // Check if email already taken
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new Error('This email is already registered')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'OWNER',
        mustChangePassword: true,
        transporterId,
      }
    })
    userId = user.id
  }

  const owner = await prisma.owner.create({
    data: {
      ownerName,
      phone,
      transporterId,
      userId: userId || null,
    }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/vehicles')
  return owner
}
