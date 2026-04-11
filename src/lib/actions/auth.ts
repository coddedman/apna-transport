'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  if (newPassword !== confirmPassword) {
    throw new Error('Passwords do not match')
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    }
  })

  // Clear the visible default password on the Owner record 
  // so admin sees null (meaning owner has set their own password)
  await prisma.owner.updateMany({
    where: { userId: session.user.id },
    data: { defaultPassword: null }
  })

  return { success: true }
}
