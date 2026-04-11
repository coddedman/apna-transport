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

  let userId: string | undefined

  if (email && password) {
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
      defaultPassword: password || null, // Store plaintext for admin visibility
    }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/vehicles')
  return owner
}

export async function updateOwner(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const ownerId = formData.get('ownerId') as string
  const ownerName = formData.get('ownerName') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const resetPassword = formData.get('resetPassword') as string

  if (!ownerId || !ownerName || !phone) {
    throw new Error('Owner name and phone are required')
  }

  // Get existing owner
  const existing = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: { user: true }
  })

  if (!existing || existing.transporterId !== transporterId) {
    throw new Error('Owner not found')
  }

  // If owner has a linked user account, update email
  if (existing.userId && existing.user) {
    const updateData: any = {}

    if (email && email !== existing.user.email) {
      // Check if new email is taken
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken && emailTaken.id !== existing.userId) {
        throw new Error('This email is already registered')
      }
      updateData.email = email
    }

    // If resetting password
    if (resetPassword) {
      updateData.password = await bcrypt.hash(resetPassword, 10)
      updateData.mustChangePassword = true
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: updateData,
      })
    }
  }

  // If no user exists but email+resetPassword provided, create one
  if (!existing.userId && email && resetPassword) {
    const emailTaken = await prisma.user.findUnique({ where: { email } })
    if (emailTaken) throw new Error('This email is already registered')

    const hashedPassword = await bcrypt.hash(resetPassword, 10)
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'OWNER',
        mustChangePassword: true,
        transporterId,
      }
    })

    await prisma.owner.update({
      where: { id: ownerId },
      data: {
        ownerName,
        phone,
        userId: newUser.id,
        defaultPassword: resetPassword,
      }
    })

    revalidatePath('/dashboard/owners')
    return
  }

  // Update owner record
  await prisma.owner.update({
    where: { id: ownerId },
    data: {
      ownerName,
      phone,
      ...(resetPassword ? { defaultPassword: resetPassword } : {}),
    }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/vehicles')
}
