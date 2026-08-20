"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  FolderGit2,
  Calendar,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Loader2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const adminNavItems = [
  {
    title: "Manage Projects",
    url: "/admin/projects",
    icon: FolderGit2,
  },
  {
    title: "Manage Events",
    url: "/admin/events",
    icon: Calendar,
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/admin/login")
      router.refresh()
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      {/* Header */}
      <SidebarHeader className="border-b border-border/40 p-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <Link
          href="/admin/projects"
          className="flex items-center gap-3 font-semibold text-foreground px-2 py-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full transition-all"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground p-1.5 shadow-sm">
            <ShieldCheck className="h-5 w-5 shrink-0" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="text-sm font-bold leading-tight tracking-tight truncate">OpenCircle</span>
            <span className="text-[11px] font-semibold text-primary truncate">Admin Panel 🔒</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-0">
        {/* Navigation Group */}
        <SidebarGroup className="group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
            Admin Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      }
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* Public Site Navigation */}
        <SidebarGroup className="group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
            Public Website
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link href="/" target="_blank" className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      <span className="text-sm group-data-[collapsible=icon]:hidden">View Live Platform</span>
                    </Link>
                  }
                  tooltip="View Live Platform"
                  className="text-muted-foreground hover:text-foreground"
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <button onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-3 text-destructive hover:text-destructive">
                  {loggingOut ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <LogOut className="h-4 w-4 shrink-0" />}
                  <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Sign Out</span>
                </button>
              }
              tooltip="Sign Out"
              className="hover:bg-destructive/10"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
