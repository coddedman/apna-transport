
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard — Apna Transport',
}

import DashboardClientLayout from '@/components/DashboardClientLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardClientLayout>
      {children}
    </DashboardClientLayout>
  )
}
