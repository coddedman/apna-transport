'use client'
import { SidebarProvider, useSidebar } from '@/lib/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import MobileBottomNav from '@/components/MobileBottomNav'

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { toggle, close } = useSidebar()
  
  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="main-content">
        <div className="sidebar-backdrop" onClick={close} />
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
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  )
}
