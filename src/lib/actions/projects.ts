'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getProjects() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return []

  return await prisma.project.findMany({
    where: { transporterId },
    include: {
      trips: true
    },
    orderBy: {
      projectName: 'asc'
    }
  })
}

export async function createProject(formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const projectName = formData.get('projectName') as string
  const location = formData.get('location') as string
  const ownerRate = parseFloat(formData.get('ownerRate') as string) || 0

  if (!projectName || !location) {
    throw new Error('Missing required fields')
  }

  const project = await prisma.project.create({
    data: {
      projectName,
      location,
      ownerRate,
      transporterId
    }
  })

  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  return project
}

export async function updateProject(projectId: string, formData: FormData) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) throw new Error('Unauthorized')

  const projectName = formData.get('projectName') as string
  const location = formData.get('location') as string
  const ownerRate = parseFloat(formData.get('ownerRate') as string) || 0

  if (!projectName || !location) {
    throw new Error('Missing required fields')
  }

  const project = await prisma.project.update({
    where: { 
      id: projectId,
      transporterId: transporterId // Security check
    },
    data: {
      projectName,
      location,
      ownerRate,
    }
  })

  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  return project
}
