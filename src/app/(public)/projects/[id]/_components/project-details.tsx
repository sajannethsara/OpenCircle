"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  FolderGit2,
  GitBranch,
  Folder,
  Star,
  ExternalLink,
  Users,
  AlertCircle,
  Loader2,
  FileText,
  BookOpen,
  Code,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Ranking } from "@/lib/rankings"
import { MdxViewer } from "@/components/mdx"
import { GithubRepo, GithubRepoExtraData } from "@/lib/github"

export interface ProjectData {
  id: string
  name: string
  description: string
  githubUrl: string
  branch: string
  readmeUrl: string
  docFolder: string
  type: string
  score: number
  badge: string
}

interface ProjectDetailsProps {
  projectId: string
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const [project, setProject] = React.useState<ProjectData | null>(null)
  const [dbLoading, setDbLoading] = React.useState<boolean>(true)
  const [dbError, setDbError] = React.useState<string | null>(null)

  // GitHub Extra Data State
  const [githubExtra, setGithubExtra] = React.useState<GithubRepoExtraData | null>(null)
  const [ghLoading, setGhLoading] = React.useState<boolean>(false)
  const [ghError, setGhError] = React.useState<string | null>(null)

  // Markdown Document Viewing State
  const [activeTab, setActiveTab] = React.useState<"readme" | "docs" | "contributors" | "issues">("readme")
  const [readmeContent, setReadmeContent] = React.useState<string>("")
  const [readmeLoading, setReadmeLoading] = React.useState<boolean>(false)

  // Doc Folder file selection
  const [selectedDocUrl, setSelectedDocUrl] = React.useState<string | null>(null)
  const [docContent, setDocContent] = React.useState<string>("")
  const [docLoading, setDocLoading] = React.useState<boolean>(false)

  // Selected Issue for Tab 4
  const [selectedIssueId, setSelectedIssueId] = React.useState<number | null>(null)

  // 1. Fetch DB project details
  const fetchDbProject = React.useCallback(async () => {
    setDbLoading(true)
    setDbError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setProject(data.data)
      } else {
        throw new Error(data.error || "Project not found")
      }
    } catch (err) {
      console.error("Fetch DB project error:", err)
      setDbError(err instanceof Error ? err.message : "Failed to load project")
    } finally {
      setDbLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    fetchDbProject()
  }, [fetchDbProject])

  // 2. Fetch GitHub Extra Data on Client Side
  const fetchGithubExtraData = React.useCallback(async (p: ProjectData) => {
    setGhLoading(true)
    setGhError(null)
    try {
      const githubRepo = new GithubRepo(p.githubUrl, p.branch)
      const extraData = await githubRepo.getRepoExtraData(p.docFolder)
      setGithubExtra(extraData)

      if (extraData.mdFileUrls && extraData.mdFileUrls.length > 0) {
        setSelectedDocUrl(extraData.mdFileUrls[0])
      }

      if (extraData.issues && extraData.issues.length > 0) {
        setSelectedIssueId(extraData.issues[0].id)
      }
    } catch (err) {
      console.error("Fetch GitHub extra data error:", err)
      setGhError("Failed to fetch live GitHub repository details.")
    } finally {
      setGhLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (project && project.type === "running") {
      fetchGithubExtraData(project)
    }
  }, [project, fetchGithubExtraData])

  // 3. Fetch README Content
  React.useEffect(() => {
    if (project?.readmeUrl && activeTab === "readme" && !readmeContent) {
      setReadmeLoading(true)
      fetch(project.readmeUrl)
        .then((res) => res.text())
        .then((text) => setReadmeContent(text))
        .catch((err) => console.error("Readme fetch error:", err))
        .finally(() => setReadmeLoading(false))
    }
  }, [project, activeTab, readmeContent])

  // 4. Fetch Selected Documentation File Content
  React.useEffect(() => {
    if (selectedDocUrl && activeTab === "docs") {
      setDocLoading(true)
      fetch(selectedDocUrl)
        .then((res) => res.text())
        .then((text) => setDocContent(text))
        .catch((err) => console.error("Doc fetch error:", err))
        .finally(() => setDocLoading(false))
    }
  }, [selectedDocUrl, activeTab])

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading project details...</span>
      </div>
    )
  }

  if (dbError || !project) {
    return (
      <div className="space-y-4">
        <Link href="/projects/running">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Running Projects
          </Button>
        </Link>
        <div className="p-8 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{dbError || "Project not found"}</span>
        </div>
      </div>
    )
  }

  // Business Logic Enforcement: Details page is only available for running projects
  if (project.type !== "running") {
    return (
      <div className="space-y-4">
        <Link href="/projects/running">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Running Projects
          </Button>
        </Link>
        <div className="p-8 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Upcoming / Non-Running Project</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Detailed documentation and GitHub integration are exclusively available for active <strong>Running</strong> projects.
          </p>
        </div>
      </div>
    )
  }

  const rankInfo = Ranking.getByName(project.badge)
  const badgeSrc = Ranking.getBadgeSrc(project.badge)
  const glowClass = Ranking.getGlowClass(project.badge)

  const selectedIssue = githubExtra?.issues?.find((i) => i.id === selectedIssueId) || githubExtra?.issues?.[0]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/projects/running">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Running Projects
        </Button>
      </Link>

      {/* Project Header Card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <FolderGit2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>

                {/* Badge Image with Glow */}
                <div
                  className="relative h-8 w-8 shrink-0 flex items-center justify-center"
                  title={rankInfo?.name || project.badge}
                >
                  <div className={`absolute -inset-1 rounded-full blur-md opacity-85 pointer-events-none ${glowClass}`} />
                  <Image
                    src={badgeSrc}
                    alt={rankInfo?.name || project.badge}
                    fill
                    sizes="32px"
                    className="object-contain relative z-10 filter drop-shadow-sm"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {project.description || "No description provided for this repository."}
              </p>
            </div>
          </div>

          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button size="sm" className="gap-1.5 text-xs font-semibold">
              <span>View Repository</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>

        {/* Metadata Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/60 px-2.5 py-1 font-mono text-accent-foreground">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            Branch: {project.branch}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/60 px-2.5 py-1 font-mono text-accent-foreground">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            Doc Folder: {project.docFolder}
          </span>
          {project.score > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 font-mono font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-500/20" />
              Score: {project.score} pts ({rankInfo?.name || project.badge})
            </span>
          )}
          {githubExtra?.collaborators && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-muted-foreground font-mono">
              <Users className="h-3.5 w-3.5" />
              {githubExtra.collaborators.length} Contributors
            </span>
          )}
          {githubExtra?.issues && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-muted-foreground font-mono">
              <AlertCircle className="h-3.5 w-3.5" />
              {githubExtra.issues.length} Open Issues
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto">
        <Button
          variant={activeTab === "readme" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("readme")}
          className="gap-1.5 text-xs font-semibold"
        >
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span>README.md</span>
        </Button>

        <Button
          variant={activeTab === "docs" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("docs")}
          className="gap-1.5 text-xs font-semibold"
        >
          <FileText className="h-3.5 w-3.5 text-blue-500" />
          <span>Documentation ({githubExtra?.mdFileUrls?.length || 0} files)</span>
        </Button>

        <Button
          variant={activeTab === "contributors" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("contributors")}
          className="gap-1.5 text-xs font-semibold"
        >
          <Users className="h-3.5 w-3.5 text-emerald-500" />
          <span>Contributors ({githubExtra?.collaborators?.length || 0})</span>
        </Button>

        <Button
          variant={activeTab === "issues" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("issues")}
          className="gap-1.5 text-xs font-semibold"
        >
          <Code className="h-3.5 w-3.5 text-amber-500" />
          <span>Open Issues ({githubExtra?.issues?.length || 0})</span>
        </Button>
      </div>

      {/* GitHub Extra Data Loading Bar */}
      {ghLoading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/40 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Fetching live GitHub repository metadata, contributors, and open issues...</span>
        </div>
      )}

      {ghError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{ghError}</span>
        </div>
      )}

      {/* TAB 1: README.md */}
      {activeTab === "readme" && (
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm min-h-[400px]">
          {readmeLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-medium">Loading README.md...</span>
            </div>
          ) : readmeContent ? (
            <MdxViewer content={readmeContent} />
          ) : (
            <div className="flex items-center justify-center p-12 text-muted-foreground text-xs">
              <span>No README documentation available for this repository.</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Documentation (Doc Folder) */}
      {activeTab === "docs" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Selector Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Files in /{project.docFolder}
            </h3>

            {githubExtra?.mdFileUrls && githubExtra.mdFileUrls.length > 0 ? (
              <div className="space-y-1">
                {githubExtra.mdFileUrls.map((url) => {
                  const filename = decodeURIComponent(url.split("/").pop() || "doc.md")
                  const isSelected = selectedDocUrl === url

                  return (
                    <button
                      key={url}
                      onClick={() => setSelectedDocUrl(url)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : "hover:bg-accent/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{filename}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                No .md documentation files found in /{project.docFolder}.
              </div>
            )}
          </div>

          {/* Doc Content Viewer */}
          <div className="lg:col-span-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm min-h-[400px]">
            {docLoading ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs font-medium">Loading documentation file...</span>
              </div>
            ) : docContent ? (
              <MdxViewer content={docContent} />
            ) : (
              <div className="flex items-center justify-center p-12 text-muted-foreground text-xs">
                <span>Select a documentation file from the list to view.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Contributors */}
      {activeTab === "contributors" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {githubExtra?.collaborators && githubExtra.collaborators.length > 0 ? (
              githubExtra.collaborators.map((contributor) => (
                <a
                  key={contributor.username}
                  href={contributor.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:border-border hover:bg-accent/30 transition-all shadow-sm group"
                >
                  <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden border border-border">
                    <Image
                      src={contributor.avatar || "/OC.svg"}
                      alt={contributor.username}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {contributor.username}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {contributor.contributions} contributions
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-muted-foreground text-xs">
                No contributors data fetched for this repository.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Open Issues with Markdown Body & Assignees */}
      {activeTab === "issues" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issues List Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Open Issues ({githubExtra?.issues?.length || 0})
            </h3>

            {githubExtra?.issues && githubExtra.issues.length > 0 ? (
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {githubExtra.issues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id

                  return (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={`w-full text-left p-3 rounded-lg text-xs space-y-1.5 transition-colors border ${
                        isSelected
                          ? "bg-accent border-primary/50 text-foreground font-medium shadow-sm"
                          : "bg-card border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-500">#{issue.number}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          @{issue.user}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug">
                        {issue.title}
                      </h4>

                      {/* Assigned Persons Avatars */}
                      {issue.assignees && issue.assignees.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground">Assigned:</span>
                          <div className="flex items-center -space-x-1 overflow-hidden">
                            {issue.assignees.map((assignee) => (
                              <div
                                key={assignee.username}
                                className="relative h-4 w-4 rounded-full overflow-hidden border border-border shrink-0"
                                title={`Assigned to @${assignee.username}`}
                              >
                                <Image
                                  src={assignee.avatar || "/OC.svg"}
                                  alt={assignee.username}
                                  fill
                                  sizes="16px"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                No open issues found for this repository.
              </div>
            )}
          </div>

          {/* Selected Issue Detail & Markdown Body Viewer */}
          <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm min-h-[450px]">
            {selectedIssue ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/40 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-amber-500">#{selectedIssue.number}</span>
                      <h3 className="text-lg font-bold text-foreground">{selectedIssue.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>Opened by <strong>@{selectedIssue.user}</strong></span>
                      <span>•</span>
                      <span>{new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <a
                    href={selectedIssue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <span>View on GitHub</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>

                {/* Assigned Persons */}
                {selectedIssue.assignees && selectedIssue.assignees.length > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/30">
                    <span className="font-semibold text-muted-foreground shrink-0">Assigned To:</span>
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedIssue.assignees.map((assignee) => (
                        <a
                          key={assignee.username}
                          href={assignee.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          <div className="relative h-5 w-5 rounded-full overflow-hidden border border-border shrink-0">
                            <Image
                              src={assignee.avatar || "/OC.svg"}
                              alt={assignee.username}
                              fill
                              sizes="20px"
                              className="object-cover"
                            />
                          </div>
                          <span>@{assignee.username}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issue Markdown Body Description */}
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Issue Description
                  </h4>
                  {selectedIssue.body ? (
                    <MdxViewer content={selectedIssue.body} />
                  ) : (
                    <div className="p-6 rounded-lg bg-muted/30 text-xs text-muted-foreground font-mono">
                      No description provided for this issue.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-12 text-muted-foreground text-xs">
                Select an open issue from the list to view details and markdown body description.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
