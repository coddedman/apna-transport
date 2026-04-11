import { auth } from '@/lib/auth'
import Link from 'next/link'
import { fetchAnalytics } from '@/lib/actions/analytics'
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

  // Fetch initial analytics data server-side for instant load
  const initialData = await fetchAnalytics({ period: 'all' })

  return <DashboardAnalytics initialData={initialData} />
}
