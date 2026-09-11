'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidateDashboard } from '@/lib/actions/revalidate'
import { Designation, CostBucket } from '@prisma/client'

async function getTransporterId() {
  const session = await auth()
  const tid = (session?.user as { transporterId?: string } | undefined)?.transporterId
  if (!tid) throw new Error('Unauthorized')
  return tid
}

// Display labels live in the component — a 'use server' module may only export async functions.
const DESIGNATION_LABELS: Record<Designation, string> = {
  DRIVER: 'Driver',
  MECHANIC: 'Mechanic',
  FIELD_MANAGER: 'Field Manager',
  ACCOUNTANT: 'Accountant',
  DISPATCHER: 'Dispatcher',
  HR_ADMIN: 'HR / Admin',
  WEIGHBRIDGE_OPERATOR: 'Weighbridge Op.',
  OTHER: 'Other',
}

export async function getEmployees(designation?: Designation) {
  const tid = await getTransporterId()
  return prisma.employee.findMany({
    where: { transporterId: tid, ...(designation ? { designation } : {}) },
    orderBy: [{ designation: 'asc' }, { name: 'asc' }],
  })
}

export interface EmployeeSummary {
  total: number
  designations: number
  presentToday: number
  monthlyPayroll: number
  byDesignation: { designation: Designation; label: string; count: number }[]
}

export async function getEmployeeSummary(): Promise<EmployeeSummary> {
  const tid = await getTransporterId()

  const [grouped, payroll, onLeave] = await Promise.all([
    prisma.employee.groupBy({
      by: ['designation'],
      _count: { id: true },
      where: { transporterId: tid },
    }),
    prisma.employee.aggregate({
      _sum: { salary: true },
      _count: { id: true },
      where: { transporterId: tid },
    }),
    prisma.employee.count({ where: { transporterId: tid, onLeave: true } }),
  ])

  const total = payroll._count.id || 0

  return {
    total,
    designations: grouped.length,
    presentToday: total - onLeave,
    monthlyPayroll: payroll._sum.salary || 0,
    byDesignation: grouped
      .map(g => ({
        designation: g.designation,
        label: DESIGNATION_LABELS[g.designation],
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count),
  }
}

export async function createEmployee(data: {
  name: string
  phone?: string
  designation: Designation
  assignedTo?: string
  costBucket: CostBucket
  salary: number
}) {
  const tid = await getTransporterId()

  if (!data.name?.trim()) throw new Error('Name is required')
  if (data.salary < 0) throw new Error('Salary cannot be negative')

  const employee = await prisma.employee.create({
    data: {
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      designation: data.designation,
      assignedTo: data.assignedTo?.trim() || null,
      costBucket: data.costBucket,
      salary: data.salary,
      transporterId: tid,
    },
  })

  revalidateDashboard()
  return employee
}

export async function updateEmployee(
  employeeId: string,
  data: {
    name?: string
    phone?: string | null
    designation?: Designation
    assignedTo?: string | null
    costBucket?: CostBucket
    salary?: number
    onLeave?: boolean
  }
) {
  const tid = await getTransporterId()

  const existing = await prisma.employee.findFirst({ where: { id: employeeId, transporterId: tid } })
  if (!existing) throw new Error('Employee not found')
  if (data.salary !== undefined && data.salary < 0) throw new Error('Salary cannot be negative')

  await prisma.employee.update({ where: { id: employeeId }, data })
  revalidateDashboard()
}

export async function toggleEmployeeLeave(employeeId: string) {
  const tid = await getTransporterId()

  const existing = await prisma.employee.findFirst({ where: { id: employeeId, transporterId: tid } })
  if (!existing) throw new Error('Employee not found')

  await prisma.employee.update({
    where: { id: employeeId },
    data: { onLeave: !existing.onLeave },
  })
  revalidateDashboard()
}

export async function deleteEmployee(employeeId: string) {
  const tid = await getTransporterId()

  const existing = await prisma.employee.findFirst({ where: { id: employeeId, transporterId: tid } })
  if (!existing) throw new Error('Employee not found')

  await prisma.employee.delete({ where: { id: employeeId } })
  revalidateDashboard()
}
