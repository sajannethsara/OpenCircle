"use client"

import * as React from "react"
import Image from "next/image"
import {
  FolderGit2,
  CheckCircle,
  Clock,
  PlayCircle,
  Plus,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Ranking } from "@/lib/rankings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface ProjectData {
  id: string
  name: string
  description: string
  githubUrl: string
  branch: string
  readmeUrl: string
  docFolder: string
  type: "running" | "upcoming" | "pending" | "custom"
  score: number
  badge: string
  createdAt: string
}

const BADGES = [
  "warrior",
  "elite",
  "master",
  "grandmaster",
  "epic",
  "legend",
  "mythic",
  "mythicalglory",
]

export function AdminProjectsManager() {
  const [projects, setProjects] = React.useState<ProjectData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"all" | "pending" | "running" | "upcoming">("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Edit Dialog State
  const [editingProject, setEditingProject] = React.useState<ProjectData | null>(null)
  const [editType, setEditType] = React.useState<string>("running")
  const [editScore, setEditScore] = React.useState<number>(0)
  const [editBadge, setEditBadge] = React.useState<string>("warrior")
  const [editBranch, setEditBranch] = React.useState<string>("main")
  const [editDocFolder, setEditDocFolder] = React.useState<string>("docs")
  const [updating, setUpdating] = React.useState(false)

  // Add Project Dialog State
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [githubUrlInput, setGithubUrlInput] = React.useState("")
  const [branchInput, setBranchInput] = React.useState("main")
  const [docFolderInput, setDocFolderInput] = React.useState("docs")
  const [typeInput, setTypeInput] = React.useState("running")
  const [submitting, setSubmitting] = React.useState(false)

  const fetchProjects = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data)
      } else {
        throw new Error(data.error || "Failed to fetch projects")
      }
    } catch (err) {
      console.error("Admin fetch projects error:", err)
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleUpdateStatus = async (id: string, newType: "running" | "upcoming" | "pending") => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        fetchProjects()
      } else {
        alert(data.error || "Failed to update project status")
      }
    } catch (err) {
      console.error("Error updating project status:", err)
    }
  }

  const handleOpenEdit = (project: ProjectData) => {
    setEditingProject(project)
    setEditType(project.type)
    setEditScore(project.score)
    setEditBadge(project.badge)
    setEditBranch(project.branch)
    setEditDocFolder(project.docFolder)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          score: editScore,
          badge: editBadge,
          branch: editBranch,
          docFolder: editDocFolder,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update project")
      }

      setEditingProject(null)
      fetchProjects()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating project")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        fetchProjects()
      } else {
        alert(data.error || "Failed to delete project")
      }
    } catch (err) {
      console.error("Error deleting project:", err)
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrlInput.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUrl: githubUrlInput.trim(),
          branch: branchInput.trim() || "main",
          docFolder: docFolderInput.trim() || "docs",
          type: typeInput,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add project")
      }

      setAddDialogOpen(false)
      setGithubUrlInput("")
      setBranchInput("main")
      setDocFolderInput("docs")
      fetchProjects()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding project")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProjects = projects.filter((p) => {
    const matchesTab = activeTab === "all" || p.type === activeTab
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesQuery
  })

  const pendingCount = projects.filter((p) => p.type === "pending").length
  const runningCount = projects.filter((p) => p.type === "running").length
  const upcomingCount = projects.filter((p) => p.type === "upcoming").length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-primary" />
            Manage Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve pending project submissions, assign tier ranks, update scores, and manage repositories.
          </p>
        </div>

        {/* Add Project Modal */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger
            render={
              <Button className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Add New Project
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Provide a GitHub repository URL. Details like repository name and README will be automatically fetched.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddProject} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">GitHub URL</label>
                <Input
                  placeholder="https://github.com/owner/repo"
                  value={githubUrlInput}
                  onChange={(e) => setGithubUrlInput(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Branch</label>
                  <Input
                    placeholder="main"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Doc Folder</label>
                  <Input
                    placeholder="docs"
                    value={docFolderInput}
                    onChange={(e) => setDocFolderInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Initial Status</label>
                <select
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                >
                  <option value="running">Running</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <Button
            variant={activeTab === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className="text-xs"
          >
            All ({projects.length})
          </Button>
          <Button
            variant={activeTab === "pending" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("pending")}
            className="text-xs relative"
          >
            <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
            Pending ({pendingCount})
          </Button>
          <Button
            variant={activeTab === "running" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("running")}
            className="text-xs"
          >
            <PlayCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
            Running ({runningCount})
          </Button>
          <Button
            variant={activeTab === "upcoming" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("upcoming")}
            className="text-xs"
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
            Upcoming ({upcomingCount})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Loading projects...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border/60 bg-card text-center space-y-3">
          <FolderGit2 className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-bold text-foreground">No projects found in this view</h3>
        </div>
      )}

      {/* Projects Table */}
      {!loading && !error && filteredProjects.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 bg-muted/50 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Badge / Rank</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProjects.map((project) => {
                  const rankInfo = Ranking.getByName(project.badge)
                  const badgeSrc = Ranking.getBadgeSrc(project.badge)

                  return (
                    <tr key={project.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{project.name}</span>
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                          <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-md">
                            {project.description || "No description provided."}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {project.type === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            Pending Approval
                          </span>
                        )}
                        {project.type === "running" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <PlayCircle className="h-3 w-3" />
                            Running
                          </span>
                        )}
                        {project.type === "upcoming" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            <CheckCircle className="h-3 w-3" />
                            Upcoming
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="relative h-6 w-6 shrink-0">
                            <Image
                              src={badgeSrc}
                              alt={project.badge}
                              fill
                              sizes="24px"
                              className="object-contain"
                            />
                          </div>
                          <span className="font-semibold text-foreground capitalize">
                            {rankInfo?.name || project.badge}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                        {project.score} pts
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Approve buttons if pending */}
                          {project.type === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                onClick={() => handleUpdateStatus(project.id, "running")}
                              >
                                Approve to Running
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                                onClick={() => handleUpdateStatus(project.id, "upcoming")}
                              >
                                Approve to Upcoming
                              </Button>
                            </>
                          )}

                          {/* Edit Project Dialog */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(project)}
                            title="Edit Project Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete Project Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(project.id, project.name)}
                            title="Delete Project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={Boolean(editingProject)} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Project: {editingProject.name}</DialogTitle>
              <DialogDescription>
                Modify tier rank, score, category type, and repository configurations.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Project Status</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                >
                  <option value="running">Running</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Rank Badge</label>
                  <select
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground capitalize"
                  >
                    {BADGES.map((b) => (
                      <option key={b} value={b} className="capitalize">
                        {Ranking.getByName(b)?.name || b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Score (Points)</label>
                  <Input
                    type="number"
                    value={editScore}
                    onChange={(e) => setEditScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Branch</label>
                  <Input
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Doc Folder</label>
                  <Input
                    value={editDocFolder}
                    onChange={(e) => setEditDocFolder(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
