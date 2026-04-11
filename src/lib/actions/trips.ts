'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createTrip(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const vehicleId = formData.get('vehicleId') as string
  const projectId = formData.get('projectId') as string
  const weight = parseFloat(formData.get('weight') as string)
  const ratePerTon = parseFloat(formData.get('ratePerTon') as string)
  const dateStr = formData.get('date') as string
  const timeStr = formData.get('time') as string

  if (!vehicleId || !projectId || isNaN(weight) || isNaN(ratePerTon)) {
    throw new Error('Missing or invalid required fields')
  }

  // Combine date and time
  let tripDate = new Date()
  if (dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = (timeStr || '00:00').split(':').map(Number)
    tripDate = new Date(year, month - 1, day, hours, minutes)
  }

  const trip = await prisma.trip.create({
    data: {
      vehicleId,
      projectId,
      weight,
      ratePerTon,
      totalAmount: weight * ratePerTon,
      date: tripDate,
    }
  })

  revalidatePath('/dashboard/trips')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/settlements')
  
  return trip
}
