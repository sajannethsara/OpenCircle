import * as React from "react"
import { verifyAdminSession } from "@/lib/auth"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "./_components/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/40 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              OpenCircle Admin Workspace 🔒
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
