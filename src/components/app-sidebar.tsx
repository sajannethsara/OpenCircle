"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  CircleDot,
  FolderGit2,
  Calendar,
  ScrollText,
  ChevronRight,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { OpenCircleLogo } from "@/components/oc-logo"

const platformNavItems = [
  {
    title: "Home",
    url: "/",
    icon: CircleDot,
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
  },
]

const projectsSubItems = [
  {
    title: "Running",
    url: "/projects/running",
  },
  {
    title: "Upcoming",
    url: "/projects/upcoming",
  },
]

const rulesSubItems = [
  {
    title: "Ranking",
    url: "/rules/ranking",
  },
  {
    title: "Developer",
    url: "/rules/developer",
  },
  {
    title: "Maintainer",
    url: "/rules/maintainer",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const isRulesActive = pathname.startsWith("/rules")
  const isProjectsActive = pathname.startsWith("/projects")

  const [rulesOpen, setRulesOpen] = React.useState(true)
  const [projectsOpen, setProjectsOpen] = React.useState(true)

  React.useEffect(() => {
    if (isRulesActive) {
      setRulesOpen(true)
    }
  }, [isRulesActive])

  React.useEffect(() => {
    if (isProjectsActive) {
      setProjectsOpen(true)
    }
  }, [isProjectsActive])

  const handleRulesParentClick = () => {
    if (!rulesOpen) {
      setRulesOpen(true)
    }
  }

  const handleProjectsParentClick = () => {
    if (!projectsOpen) {
      setProjectsOpen(true)
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      {/* Header with OpenCircle logo */}
      <SidebarHeader className="border-b border-border/40 p-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold text-foreground px-2 py-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full transition-all"
        >
          <OpenCircleLogo className="h-8 w-8 shrink-0 text-foreground" />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="text-sm font-bold leading-tight tracking-tight truncate">OpenCircle</span>
            <span className="text-[11px] font-medium text-muted-foreground truncate">Platform ⭕</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-0">
        {/* Platform Navigation Group */}
        <SidebarGroup className="group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
            Platform Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home */}
              {platformNavItems.slice(0, 1).map((item) => {
                const isActive = pathname === item.url
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

              {/* Collapsible Projects Parent linking to /projects/running */}
              <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    nativeButton={false}
                    render={
                      <SidebarMenuButton
                        render={
                          <Link
                            href="/projects/running"
                            onClick={handleProjectsParentClick}
                            className="flex w-full items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <FolderGit2 className="h-4 w-4 shrink-0" />
                              <span className="text-sm group-data-[collapsible=icon]:hidden">Projects</span>
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                                projectsOpen ? "rotate-90" : ""
                              }`}
                            />
                          </Link>
                        }
                        isActive={isProjectsActive}
                        tooltip="Projects"
                        className={
                          isProjectsActive
                            ? "font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }
                      />
                    }
                  />
                  <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub>
                      {projectsSubItems.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.url ||
                          (subItem.url === "/projects/running" && pathname === "/projects")
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              render={
                                <Link href={subItem.url} className="w-full">
                                  <span>{subItem.title}</span>
                                </Link>
                              }
                              isActive={isSubActive}
                              className={
                                isSubActive
                                  ? "font-medium text-foreground bg-accent/60"
                                  : "text-muted-foreground hover:text-foreground"
                              }
                            />
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Remaining main items (Events) */}
              {platformNavItems.slice(1).map((item) => {
                const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
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

              {/* Collapsible Rules & Governance Parent linking directly to /rules/ranking */}
              <Collapsible open={rulesOpen} onOpenChange={setRulesOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    nativeButton={false}
                    render={
                      <SidebarMenuButton
                        render={
                          <Link
                            href="/rules/ranking"
                            onClick={handleRulesParentClick}
                            className="flex w-full items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <ScrollText className="h-4 w-4 shrink-0" />
                              <span className="text-sm group-data-[collapsible=icon]:hidden">Rules & Ranks</span>
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                                rulesOpen ? "rotate-90" : ""
                              }`}
                            />
                          </Link>
                        }
                        isActive={isRulesActive}
                        tooltip="Rules & Ranks"
                        className={
                          isRulesActive
                            ? "font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }
                      />
                    }
                  />
                  <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub>
                      {rulesSubItems.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.url ||
                          (subItem.url === "/rules/ranking" && pathname === "/rules")
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              render={
                                <Link href={subItem.url} className="w-full">
                                  <span>{subItem.title}</span>
                                </Link>
                              }
                              isActive={isSubActive}
                              className={
                                isSubActive
                                  ? "font-medium text-foreground bg-accent/60"
                                  : "text-muted-foreground hover:text-foreground"
                              }
                            />
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* Batch Info Group */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Batch Info
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 py-1 text-xs text-muted-foreground">
            <div className="rounded-md bg-muted/50 p-2.5 space-y-1.5 border border-border/40">
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>Faculty of IT</span>
                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-mono">B23</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Univ. of Moratuwa student-led software development.
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center gap-3 rounded-md p-2 hover:bg-accent/50 transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-7 w-7 border border-border shrink-0">
            <AvatarFallback className="text-[10px] font-bold bg-muted">B23</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="text-xs font-semibold truncate">Batch 23 UoM</span>
            <span className="text-[10px] text-muted-foreground truncate">Open Source Community</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
