import { auth } from '@/lib/auth'
import PageHeader from '@/components/PageHeader'
import EmployeeDirectory from '@/components/employees/EmployeeDirectory'
import AddEmployeeButton from '@/components/employees/AddEmployeeButton'
import { getEmployees, getEmployeeSummary } from '@/lib/actions/employees'

export const metadata = {
  title: 'Employees — Apna Transport',
  description: 'Staff directory, designations and monthly payroll',
}

export default async function EmployeesPage() {
  const session = await auth()
  const transporterId = (session?.user as { transporterId?: string } | undefined)?.transporterId
  if (!transporterId) return <div>Unauthorized</div>

  const [employees, summary] = await Promise.all([
    getEmployees(),
    getEmployeeSummary(),
  ])

  return (
    <div className="page-container">
      <PageHeader
        title="Employees"
        subtitle="Staff, designations & payroll"
      >
        <AddEmployeeButton />
      </PageHeader>
      <div className="page-body">
        <EmployeeDirectory employees={employees} summary={summary} />
      </div>
    </div>
  )
}
