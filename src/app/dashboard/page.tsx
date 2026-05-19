import { auth } from '@/lib/auth'
import Link from 'next/link'
import DashboardAnalytics from '@/components/analytics/DashboardAnalytics'

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as any
  const transporterId = user?.transporterId

  // Security guard for platform owners who strayed here
  if (!transporterId) {
    return (
      <div className="page-body">
        <div className="card">
          <div className="card-body">
            You do not have a Transporter ID assigned. If you are a Super Admin, please go to the <Link href="/platform" style={{color: 'var(--color-accent)'}}>Platform Dashboard</Link>.
          </div>
        </div>
      </div>
    )
  }

  return <DashboardAnalytics />
}
