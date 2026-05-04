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

  return (
    <div className="app-layout">
      <PlatformSidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
