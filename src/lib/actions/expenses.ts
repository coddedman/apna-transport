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

  if (!vehicleId || isNaN(amount) || !type) {
    throw new Error('Missing or invalid required fields')
  }

  const expenseDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()

  const expense = await prisma.expense.create({
    data: {
      vehicleId,
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
