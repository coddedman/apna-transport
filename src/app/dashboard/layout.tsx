import Sidebar from '@/components/Sidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard — Hyva Transport',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Force password change on first login
  if ((session.user as any)?.mustChangePassword) {
    redirect('/change-password')
  }

  // Super Admins should use the /platform view
  if ((session.user as any)?.role === 'SUPER_ADMIN') {
    redirect('/platform')
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
