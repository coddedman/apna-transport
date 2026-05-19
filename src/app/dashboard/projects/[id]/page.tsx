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
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Link href="/dashboard/projects" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                ← Projects
              </Link>
            </div>
            <h1 className="page-title">🧮 {project.projectName}</h1>
            <p className="page-subtitle">📍 {project.location} · Rate Calculator & Scenario Modelling</p>
          </div>
        </div>
      </header>

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
