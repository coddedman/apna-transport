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
  const dateStr   = formData.get('date') as string

  if (!ownerId || isNaN(amount) || amount <= 0) {
    throw new Error('Owner and a valid amount are required')
  }

  const owner = await prisma.owner.findFirst({ where: { id: ownerId, transporterId } })
  if (!owner) throw new Error('Owner not found')

  const advanceDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()

  await prisma.ownerAdvance.create({
    data: { ownerId, amount, remarks: remarks || null, projectId: projectId || null, date: advanceDate }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/expenses')
}

export async function updateOwnerAdvance(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const advanceId = formData.get('advanceId') as string
  const amount    = parseFloat(formData.get('amount') as string)
  const remarks   = formData.get('remarks') as string
  const projectId = formData.get('projectId') as string
  const dateStr   = formData.get('date') as string

  if (!advanceId || isNaN(amount) || amount <= 0) {
    throw new Error('Valid advance ID and amount are required')
  }

  const advance = await prisma.ownerAdvance.findFirst({
    where: { id: advanceId },
    include: { owner: true }
  })
  if (!advance || advance.owner.transporterId !== transporterId) {
    throw new Error('Advance not found')
  }

  const advanceDate = dateStr ? new Date(dateStr + 'T00:00:00') : advance.date

  await prisma.ownerAdvance.update({
    where: { id: advanceId },
    data: { amount, remarks: remarks || null, projectId: projectId || null, date: advanceDate }
  })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/expenses')
}

export async function deleteOwnerAdvance(advanceId: string) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const advance = await prisma.ownerAdvance.findFirst({
    where: { id: advanceId },
    include: { owner: true }
  })
  if (!advance || advance.owner.transporterId !== transporterId) {
    throw new Error('Advance not found')
  }

  await prisma.ownerAdvance.delete({ where: { id: advanceId } })

  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/expenses')
}
