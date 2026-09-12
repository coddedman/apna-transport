import { auth } from '@/lib/auth'
import PageHeader from '@/components/PageHeader'
import BillTracker from '@/components/receivables/BillTracker'
import { getPartyBills, getReceivableSummary, getProjectWisePending, getReceivableFormData, getOverallPartyPayments, getUnbilledWork } from '@/lib/actions/receivables'

export const metadata = {
  title: 'Bill Tracker — Apna Transport',
  description: 'Track party bills, record payments, and monitor receivables',
}

export default async function BillsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const [bills, summary, projectWise, projects, overallPayments, unbilledWork] = await Promise.all([
    getPartyBills(),
    getReceivableSummary(),
    getProjectWisePending(),
    getReceivableFormData(),
    getOverallPartyPayments(),
    getUnbilledWork(),
  ])

  return (
    <div className="page-container">
      <PageHeader
        title="Client Billing"
        subtitle="Track submitted bills, record payments, and monitor receivables"
      />
      <div className="page-body">
        <BillTracker
          bills={bills as any}
          summary={summary}
          projectWise={projectWise}
          projects={projects}
          unbilledWork={unbilledWork}
          overallPayments={overallPayments as any}
        />
      </div>
    </div>
  )
}
