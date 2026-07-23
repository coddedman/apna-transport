import { auth } from '@/lib/auth'
import PageHeader from '@/components/PageHeader'
import TallyView from '@/components/tally/TallyView'

export const metadata = {
  title: 'Expense Tally — Hyva Transport',
  description: 'Log daily lumpsum expenses and reconcile with vehicle-level entries',
}

export default async function TallyPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  return (
    <>
      <PageHeader
        title="📊 Expense Tally"
        subtitle="Log daily lumpsum expenses and reconcile with vehicle-level entries"
      />
      <div className="page-body">
        <TallyView />
      </div>
    </>
  )
}
