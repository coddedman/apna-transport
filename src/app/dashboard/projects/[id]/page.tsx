import PageHeader from '@/components/PageHeader'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ProjectRateCalculator from '@/components/projects/ProjectRateCalculator'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id }, select: { projectName: true } })
  return { title: project ? `${project.projectName} — Rate Calculator` : 'Project' }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, projectName: true, location: true, partyRate: true, ownerRate: true, transporterId: true },
  })

  if (!project || project.transporterId !== transporterId) notFound()

  return (
    <>
      <PageHeader title={project.projectName} subtitle={`${project.location || "Project"} · Rate calculator & scenario modelling`}><Link href="/dashboard/projects" className="btn btn-secondary">← Projects</Link></PageHeader>

      <div className="page-body">
        <ProjectRateCalculator
          projectId={project.id}
          projectName={project.projectName}
          partyRate={project.partyRate}
          ownerRate={project.ownerRate}
          isPage={true}
        />
      </div>
    </>
  )
}
