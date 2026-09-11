// TEMPORARY layout probe — delete after use.
import DashboardClientLayout from '@/components/DashboardClientLayout'

export default function ProbePage() {
  return (
    <DashboardClientLayout>
      <div id="probe-content" className="page-body">
        <div className="card" style={{ padding: 24 }}>probe content</div>
      </div>
    </DashboardClientLayout>
  )
}
