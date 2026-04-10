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

  if (!projectName || !location) {
    throw new Error('Missing required fields')
  }

  const project = await prisma.project.create({
    data: {
      projectName,
      location,
      transporterId
    }
  })

  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  return project
}
