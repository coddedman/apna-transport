import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VehicleDetailClient from '@/components/analytics/VehicleDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v = await prisma.vehicle.findUnique({ where: { id }, select: { plateNo: true } })
  return { title: `${v?.plateNo ?? 'Vehicle'} Analytics — Hyva Transport` }
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, owner: { transporterId } },
    include: {
      owner: true,
      project: true,
      trips: {
        include: { project: true },
        orderBy: { date: 'desc' },
      },
      expenses: {
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!vehicle) notFound()

  const data = {
    id: vehicle.id,
    plateNo: vehicle.plateNo,
    ownerName: vehicle.owner.ownerName,
    ownerPhone: vehicle.owner.phone,
    ownerId: vehicle.owner.id,
    currentProject: vehicle.project?.projectName ?? null,
    trips: vehicle.trips.map(t => ({
      id: t.id,
      date: t.date.toISOString(),
      invoiceNo: t.invoiceNo,
      lrNo: t.lrNo,
      weight: t.weight,
      partyRate: t.partyRate,
      ownerRate: t.ownerRate,
      partyFreightAmount: t.partyFreightAmount,
      ownerFreightAmount: t.ownerFreightAmount,
      project: { projectName: t.project.projectName },
    })),
    expenses: vehicle.expenses.map(e => ({
      id: e.id,
      date: e.date.toISOString(),
      amount: e.amount,
      type: e.type as string,
      remarks: e.remarks,
    })),
  }

  return (
    <div className="page-body">
      <div style={{ marginBottom: '16px' }}>
        <Link href="/dashboard/vehicles" style={{ fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          ← Back to Vehicles
        </Link>
      </div>
      <VehicleDetailClient data={data} />
    </div>
  )
}
