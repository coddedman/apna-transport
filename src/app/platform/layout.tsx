import PlatformSidebar from '@/components/PlatformSidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Platform Admin — Hyva Transport',
}

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Only SUPER_ADMIN can access /platform
  if ((session.user as any)?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="app-layout">
      <PlatformSidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
