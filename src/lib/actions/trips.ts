'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'

// Helper: find the applicable rate for a project on a given date
async function resolveRates(projectId: string, tripDate: Date, project: { partyRate: number; ownerRate: number }) {
  // Check if there's a rate period covering this date
  const period = await prisma.ratePeriod.findFirst({
    where: {
      projectId,
      periodStart: { lte: tripDate },
      periodEnd: { gte: tripDate },
    }
  })

  if (period) {
    return { partyRate: period.partyRate, ownerRate: period.ownerRate, source: 'period' as const }
  }

  return { partyRate: project.partyRate || 0, ownerRate: project.ownerRate, source: 'project' as const }
}

export async function createTrip(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const vehicleId = formData.get('vehicleId') as string
  const projectId = formData.get('projectId') as string
  const weight = parseFloat(formData.get('weight') as string)
  const dateStr = formData.get('date') as string
  const timeStr = formData.get('time') as string

  if (!vehicleId || !projectId || isNaN(weight)) {
    throw new Error('Missing or invalid required fields')
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new Error('Project not found')

  // Combine date and time
  let tripDate = new Date()
  if (dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = (timeStr || '00:00').split(':').map(Number)
    tripDate = new Date(year, month - 1, day, hours, minutes)
  }

  // Resolve rates: check rate period first, then fall back to project defaults
  const { partyRate, ownerRate } = await resolveRates(projectId, tripDate, project)

  const invoiceNo = formData.get('invoiceNo') as string
  const lrNo = formData.get('lrNo') as string

  const trip = await prisma.trip.create({
    data: {
      vehicleId,
      projectId,
      weight,
      partyRate,
      ownerRate,
      invoiceNo,
      lrNo,
      partyFreightAmount: weight * partyRate,
      ownerFreightAmount: weight * ownerRate,
      date: tripDate,
    }
  })

  revalidateDashboard()
  
  return trip
}

export async function updateTrip(tripId: string, formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const vehicleId = formData.get('vehicleId') as string
  const projectId = formData.get('projectId') as string
  const weight = parseFloat(formData.get('weight') as string)
  const dateStr = formData.get('date') as string
  const timeStr = formData.get('time') as string

  if (!tripId || !vehicleId || !projectId || isNaN(weight)) {
    throw new Error('Missing or invalid required fields')
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.transporterId !== transporterId) throw new Error('Project not found')

  // Combine date and time
  let tripDate = undefined
  if (dateStr && timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)
    tripDate = new Date(year, month - 1, day, hours, minutes)
  }

  // Resolve rates: check rate period first, then fall back to project defaults
  const rateDate = tripDate || new Date()
  const { partyRate, ownerRate } = await resolveRates(projectId, rateDate, project)

  const invoiceNo = formData.get('invoiceNo') as string
  const lrNo = formData.get('lrNo') as string

  const trip = await prisma.trip.update({
    where: { 
      id: tripId,
      project: { transporterId } // Ensure security
    },
    data: {
      vehicleId,
      projectId,
      weight,
      partyRate,
      ownerRate,
      invoiceNo,
      lrNo,
      partyFreightAmount: weight * partyRate,
      ownerFreightAmount: weight * ownerRate,
      ...(tripDate && { date: tripDate })
    }
  })

  revalidateDashboard()
  
  return trip
}

export async function deleteTrip(tripId: string) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  // Verify trip belongs to this transporter
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, project: { transporterId } }
  })

  if (!trip) throw new Error('Trip not found')

  await prisma.trip.delete({ where: { id: tripId } })

  revalidateDashboard()
}
