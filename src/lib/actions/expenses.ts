'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ExpenseType } from '@prisma/client'

export async function createExpense(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const vehicleId = formData.get('vehicleId') as string
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as ExpenseType
  const remarks = formData.get('remarks') as string
  const dateStr = formData.get('date') as string
  const projectId = formData.get('projectId') as string

  if (!vehicleId || isNaN(amount) || !type) {
    throw new Error('Missing or invalid required fields')
  }

  // Verify vehicle belongs to this transporter
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, owner: { transporterId } }
  })
  if (!vehicle) throw new Error('Vehicle not found')

  const expenseDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()

  const expense = await prisma.expense.create({
    data: {
      vehicleId,
      projectId: projectId || null,
      amount,
      type,
      remarks,
      date: expenseDate,
    }
  })

  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/settlements')
  
  return expense
}

export async function updateExpense(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const expenseId = formData.get('expenseId') as string
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as ExpenseType
  const remarks = formData.get('remarks') as string
  const dateStr = formData.get('date') as string
  const projectId = formData.get('projectId') as string
  const vehicleId = formData.get('vehicleId') as string

  if (!expenseId || isNaN(amount) || !type) {
    throw new Error('Missing or invalid required fields')
  }

  // Verify ownership
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId },
    include: { vehicle: { include: { owner: true } } }
  })
  if (!expense || expense.vehicle.owner.transporterId !== transporterId) {
    throw new Error('Expense not found')
  }

  const expenseDate = dateStr ? new Date(dateStr + 'T00:00:00') : expense.date

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      vehicleId: vehicleId || expense.vehicleId,
      projectId: projectId || null,
      amount,
      type,
      remarks: remarks || null,
      date: expenseDate,
    }
  })

  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/settlements')
}

export async function deleteExpense(expenseId: string) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId },
    include: { vehicle: { include: { owner: true } } }
  })
  if (!expense || expense.vehicle.owner.transporterId !== transporterId) {
    throw new Error('Expense not found')
  }

  await prisma.expense.delete({ where: { id: expenseId } })

  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/settlements')
}
