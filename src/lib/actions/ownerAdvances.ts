'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createOwnerAdvance(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const ownerId   = formData.get('ownerId') as string
  const amount    = parseFloat(formData.get('amount') as string)
  const remarks   = formData.get('remarks') as string
  const projectId = formData.get('projectId') as string

  if (!ownerId || isNaN(amount) || amount <= 0) {
    throw new Error('Owner and a valid amount are required')
  }

  // Verify the owner belongs to this transporter
  const owner = await prisma.owner.findFirst({
    where: { id: ownerId, transporterId }
  })
  if (!owner) throw new Error('Owner not found')

  await prisma.ownerAdvance.create({
    data: {
      ownerId,
      amount,
      remarks: remarks || null,
      projectId: projectId || null,
    }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/expenses')
}
