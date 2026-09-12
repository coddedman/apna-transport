import PlatformClientLayout from '@/components/PlatformClientLayout'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Platform Admin — Apna Transport',
}

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <PlatformClientLayout>{children}</PlatformClientLayout>
  )
}
