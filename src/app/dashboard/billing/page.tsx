import { auth } from '@/lib/auth'
import { getVehiclesWithRates, getOwnersWithRates } from '@/lib/actions/billing'
import { getProjects } from '@/lib/actions/projects'
import PageHeader from '@/components/PageHeader'
import BillGenerator from '@/components/billing/BillGenerator'

export const metadata = {
  title: 'Bill Generator — Hyva Transport',
  description: 'Generate weekly and monthly settlement bills per vehicle or owner',
}

export default async function BillingPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const [vehicles, owners, projects] = await Promise.all([
    getVehiclesWithRates(),
    getOwnersWithRates(),
    getProjects(),
  ])

  const projectDefaultOwnerRate = projects[0]?.ownerRate ?? 125

  return (
    <div className="page-container">
      <PageHeader
        title="🧾 Bill Generator"
        subtitle="Generate weekly & monthly settlements per vehicle or owner"
      />
      <BillGenerator
        vehicles={vehicles as any}
        owners={owners as any}
        projectDefaultOwnerRate={projectDefaultOwnerRate}
      />
    </div>
  )
}
