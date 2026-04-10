import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Dashboard — Hyva Transport',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
