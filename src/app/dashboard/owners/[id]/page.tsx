import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OwnerDetailClient from '@/components/analytics/OwnerDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const owner = await prisma.owner.findUnique({ where: { id }, select: { ownerName: true } })
  return { title: `${owner?.ownerName ?? 'Owner'} Analytics — Hyva Transport` }
}

export default async function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const owner = await prisma.owner.findUnique({
    where: { id, transporterId },
    include: {
      advances: { include: { project: true }, orderBy: { date: 'desc' } },
      settlements: { orderBy: { createdAt: 'desc' } },
      vehicles: {
        include: {
          project: true,
          trips: {
            include: { project: true },
            orderBy: { date: 'desc' },
          },
          expenses: {
            orderBy: { date: 'desc' },
          },
        },
      },
    },
  })

  if (!owner) notFound()

  // Serialize dates for client
  const data = {
    id: owner.id,
    name: owner.ownerName,
    phone: owner.phone,
    advances: owner.advances.map(a => ({
      id: a.id, amount: a.amount, remarks: a.remarks,
      date: a.date.toISOString(),
      project: a.project ? { projectName: a.project.projectName } : null,
    })),
    settlements: owner.settlements.map(s => ({
      id: s.id, status: s.status, finalPayout: s.finalPayout,
      createdAt: s.createdAt.toISOString(),
    })),
    vehicles: owner.vehicles.map(v => ({
      id: v.id, plateNo: v.plateNo,
      project: v.project ? { projectName: v.project.projectName } : null,
      trips: v.trips.map(t => ({
        id: t.id, date: t.date.toISOString(),
        invoiceNo: t.invoiceNo, lrNo: t.lrNo,
        weight: t.weight, partyRate: t.partyRate, ownerRate: t.ownerRate,
        partyFreightAmount: t.partyFreightAmount, ownerFreightAmount: t.ownerFreightAmount,
        project: { projectName: t.project.projectName },
      })),
      expenses: v.expenses.map(e => ({
        id: e.id, date: e.date.toISOString(),
        amount: e.amount, type: e.type, remarks: e.remarks,
      })),
    })),
  }

  return (
    <div className="page-body">
      {/* Back link */}
      <div style={{ marginBottom: '16px' }}>
        <Link href="/dashboard/owners" style={{ fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Owners
        </Link>
      </div>
      <OwnerDetailClient data={data} />
    </div>
  )
}
