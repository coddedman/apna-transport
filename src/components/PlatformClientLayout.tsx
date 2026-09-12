'use client'
import { SidebarProvider, useSidebar } from '@/lib/context/SidebarContext'
import PlatformSidebar from '@/components/PlatformSidebar'

function Shell({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()
  return <div className="app-layout"><PlatformSidebar />{isOpen && <button className="platform-backdrop" aria-label="Close navigation" onClick={close} />}<div className="main-content">{children}</div></div>
}
export default function PlatformClientLayout({ children }: { children: React.ReactNode }) {
  return <SidebarProvider><Shell>{children}</Shell></SidebarProvider>
}
