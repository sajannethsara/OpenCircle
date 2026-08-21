"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { FolderGit2, ExternalLink, GitBranch, Folder, Star, ArrowRight } from "lucide-react"
import { Ranking } from "@/lib/rankings"
import { ReadmeDialog } from "./readme-dialog"
import { Button } from "@/components/ui/button"

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

interface ProjectCardProps {
  project: ProjectData
}

export function ProjectCard({ project }: ProjectCardProps) {
  const rankInfo = Ranking.getByName(project.badge)
  const badgeSrc = Ranking.getBadgeSrc(project.badge)
  const glowClass = Ranking.getGlowClass(project.badge)
  const isRunning = project.type === "running"

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col justify-between space-y-4 hover:border-border transition-all shadow-sm group relative overflow-hidden">
      <div className="space-y-3">
        {/* Top Bar: Title & Rank Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 font-semibold text-foreground overflow-hidden">
            <FolderGit2 className="h-5 w-5 shrink-0 text-primary" />
            {isRunning ? (
              <Link
                href={`/projects/${project.id}`}
                className="truncate text-base font-bold tracking-tight hover:text-primary transition-colors"
              >
                {project.name}
              </Link>
            ) : (
              <span className="truncate text-base font-bold tracking-tight">{project.name}</span>
            )}
          </div>

          {/* Badge Image with Glow */}
          <div
            className="relative h-9 w-9 shrink-0 flex items-center justify-center"
            title={rankInfo?.name || project.badge}
          >
            <div className={`absolute -inset-1.5 rounded-full blur-md opacity-85 pointer-events-none ${glowClass}`} />
            <Image
              src={badgeSrc}
              alt={rankInfo?.name || project.badge}
              fill
              sizes="36px"
              className="object-contain relative z-10 filter drop-shadow-sm"
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2rem]">
          {project.description || "No description provided for this repository."}
        </p>

        {/* Tags / Metadata Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded bg-accent/60 px-2 py-0.5 font-mono text-accent-foreground">
            <GitBranch className="h-3 w-3" />
            {project.branch}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-accent/60 px-2 py-0.5 font-mono text-accent-foreground">
            <Folder className="h-3 w-3" />
            {project.docFolder}
          </span>
          {project.score > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 font-mono font-semibold">
              <Star className="h-3 w-3 fill-amber-500/20" />
              {project.score} pts
            </span>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="border-t border-border/40 pt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* README Modal */}
          <ReadmeDialog projectName={project.name} readmeUrl={project.readmeUrl} />

          {/* Details Link Button (Only for running projects) */}
          {isRunning && (
            <Link href={`/projects/${project.id}`}>
              <Button size="sm" variant="default" className="h-8 text-xs gap-1 font-semibold">
                <span>Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {/* GitHub Link */}
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <span>Repo</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}