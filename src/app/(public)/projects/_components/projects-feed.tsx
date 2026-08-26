"use client"

import * as React from "react"
import { FolderGit2, Plus, Loader2, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectCard, ProjectData } from "./project-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useRanking } from "@/hooks/use-ranking"

interface ProjectsFeedProps {
  projectType?: "running" | "upcoming"
}

export function ProjectsFeed({ projectType = "running" }: ProjectsFeedProps) {
  const isRunning = projectType === "running"
  const [projects, setProjects] = React.useState<ProjectData[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  // Background ranking sync from client IP
  const { refreshRankings, isRefreshing } = useRanking()
  const hasAutoRunRef = React.useRef(false)

  // Search
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  // Add Project Dialog Form State
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false)
  const [githubUrlInput, setGithubUrlInput] = React.useState<string>("")
  const [branchInput, setBranchInput] = React.useState<string>("main")
  const [docFolderInput, setDocFolderInput] = React.useState<string>("docs")
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const fetchProjects = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = isRunning ? "/api/projects/running" : "/api/projects/upcoming"
      const res = await fetch(endpoint)
      const data = await res.json()

      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data)
      } else {
        throw new Error(data.error || "Failed to load projects")
      }
    } catch (err) {
      console.error("Fetch projects error:", err)
      setError(err instanceof Error ? err.message : "Error fetching projects")
    } finally {
      setLoading(false)
    }
  }, [isRunning])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Background refresh ranking mechanism using user's browser / public IP
  React.useEffect(() => {
    if (projects.length > 0 && !hasAutoRunRef.current && !isRefreshing) {
      const needsCalculation = projects.some((p) => p.score === 0)
      if (needsCalculation) {
        hasAutoRunRef.current = true
        refreshRankings()
          .then(() => {
            fetchProjects()
          })
          .catch((err) => {
            console.error("Background client ranking sync error:", err)
          })
      }
    }
  }, [projects, isRefreshing, refreshRankings, fetchProjects])

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrlInput.trim()) return

    setSubmitting(true)
    setFormError(null)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUrl: githubUrlInput.trim(),
          branch: branchInput.trim() || "main",
          docFolder: docFolderInput.trim() || "docs",
          type: projectType,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add project")
      }

      setDialogOpen(false)
      setGithubUrlInput("")
      setBranchInput("main")
      setDocFolderInput("docs")
      fetchProjects()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add project")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isRunning ? "Running Projects" : "Upcoming Projects"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRunning
              ? "Explore active batch repositories, maintainer contacts, and open contribution tags."
              : "Discover new project proposals, upcoming batch initiatives, and early-stage ideas awaiting contributors."}
          </p>
        </div>

        {/* Add Project Modal */}
        {/* <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Propose Project
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Provide a GitHub repository URL. Details like name, description, and README will be automatically fetched.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddProject} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 rounded bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

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

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog> */}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Fetching projects...</span>
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
          <FolderGit2 className="h-10 w-10 text-muted-foreground/50" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No {isRunning ? "running" : "upcoming"} projects found</h3>
            <p className="text-xs text-muted-foreground">
              Click &quot;Propose Project&quot; above to submit a GitHub repository to the database.
            </p>
          </div>
        </div>
      )}

      {/* Project Cards Grid */}
      {!loading && !error && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
