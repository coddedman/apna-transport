'use client'
import { SessionProvider } from 'next-auth/react'
import { SidebarProvider, useSidebar } from '@/lib/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import MobileBottomNav from '@/components/MobileBottomNav'

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { toggle, close, isOpen } = useSidebar()
  
  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <Sidebar />
      
      <div className="flex-1 min-h-screen flex flex-col min-w-0 md:ml-[var(--sidebar-width)] transition-all duration-300">
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={close} />
        )}
        {children}
      </div>

      <MobileBottomNav />
    </div>
  )
}

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <LayoutInner>{children}</LayoutInner>
      </SidebarProvider>
    </SessionProvider>
  )
}
