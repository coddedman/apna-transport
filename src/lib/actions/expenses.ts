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

  revalidatePath('/dashboard/settlements')
  
  return expense
}

export async function createMultipleExpenses(expensesData: {
  vehicleId: string
  amount: number
  type: string
  remarks?: string
  date: string
  projectId?: string
}[]) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  if (!expensesData || expensesData.length === 0) return { count: 0 }

  // Verify all vehicles belong to the transporter
  const vehicleIds = [...new Set(expensesData.map(e => e.vehicleId))]
  const validVehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleIds }, owner: { transporterId } },
    select: { id: true }
  })
  
  const validVehicleIds = new Set(validVehicles.map(v => v.id))
  
  const validData = expensesData
    .filter(e => validVehicleIds.has(e.vehicleId) && !isNaN(e.amount) && e.amount > 0)
    .map(e => ({
      vehicleId: e.vehicleId,
      projectId: e.projectId || null,
      amount: e.amount,
      type: e.type as ExpenseType,
      remarks: e.remarks || null,
      date: e.date ? new Date(e.date + 'T00:00:00') : new Date(),
    }))

  if (validData.length === 0) throw new Error('No valid expenses to log')

  const result = await prisma.expense.createMany({
    data: validData
  })

  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/settlements')
  
  return { count: result.count }
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
