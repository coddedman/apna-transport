import { auth } from '@/lib/auth'
import PageHeader from '@/components/PageHeader'
import BillTracker from '@/components/receivables/BillTracker'
import { getPartyBills, getReceivableSummary, getProjectWisePending, getReceivableFormData, getOverallPartyPayments } from '@/lib/actions/receivables'

export const metadata = {
  title: 'Bill Tracker — Hyva Transport',
  description: 'Track party bills, record payments, and monitor receivables',
}

export default async function BillsPage() {
  const session = await auth()
  const transporterId = (session?.user as any)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const [bills, summary, projectWise, projects, overallPayments] = await Promise.all([
    getPartyBills(),
    getReceivableSummary(),
    getProjectWisePending(),
    getReceivableFormData(),
    getOverallPartyPayments(),
  ])

  return (
    <div className="page-container">
      <PageHeader
        title="📄 Bill Tracker"
        subtitle="Track submitted bills, record payments, and monitor receivables"
      />
      <div className="page-body">
        <BillTracker
          bills={bills as any}
          summary={summary}
          projectWise={projectWise}
          projects={projects}
          overallPayments={overallPayments as any}
        />
      </div>
    </div>
  )
}
