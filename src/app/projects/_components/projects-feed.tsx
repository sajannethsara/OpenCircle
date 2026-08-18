import * as React from "react"
import Image from "next/image"
import { FolderGit2, GitFork, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Ranking } from "@/lib/rankings"

const sampleProjects = [
  {
    id: "oc-platform",
    title: "OpenCircle Platform",
    description: "The official web platform orchestrating student projects, rank calculation, and event hubs.",
    rankingId: "mythical-glory",
    contributors: 24,
    prs: 1040,
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Shadcn"],
    status: "Seeking Contributors",
  },
  {
    id: "batch-benchmark",
    title: "Batch Benchmark Engine",
    description: "Automated benchmark suite evaluating code quality, PR resolution SLAs, and repo health.",
    rankingId: "grandmaster",
    contributors: 12,
    prs: 84,
    tags: ["Node.js", "GraphQL", "GitHub API"],
    status: "Solid Team",
  },
  {
    id: "help-desk-bot",
    title: "HelpDesk Discord Bot",
    description: "Discord bot archiving public queries into GitHub Discussions and tagging batch maintainers.",
    rankingId: "elite",
    contributors: 5,
    prs: 22,
    tags: ["Python", "Discord.py", "REST API"],
    status: "Seeking Contributors",
  },
  {
    id: "algo-vault",
    title: "Data Structures & Algorithms Vault",
    description: "Curated solution repository with automated test runners for interview prep.",
    rankingId: "mythic",
    contributors: 18,
    prs: 512,
    tags: ["C++", "Python", "GitHub Actions"],
    status: "Solid Team",
  },
  {
    id: "dev-hub-cli",
    title: "OpenCircle Dev CLI",
    description: "Command line tool for local project scaffolding and webhook payload testing.",
    rankingId: "master",
    contributors: 8,
    prs: 48,
    tags: ["Go", "CLI", "Docker"],
    status: "Seeking Contributors",
  },
  {
    id: "campus-connect",
    title: "Faculty Campus Hub",
    description: "Student directory and peer-to-peer mentoring calendar.",
    rankingId: "warrior",
    contributors: 4,
    prs: 6,
    tags: ["React", "Express", "PostgreSQL"],
    status: "Seeking Contributors",
  },
]

export function ProjectsFeed() {
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Running Projects</h1>
          <p className="text-sm text-muted-foreground">
            Explore active batch repositories, maintainer contacts, and open contribution tags.
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Propose Project
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Input placeholder="Search projects by name or stack..." className="w-full sm:w-80" />
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 sm:pb-0">
          <Button variant="secondary" size="sm">All</Button>
          <Button variant="ghost" size="sm">Seeking Contributors</Button>
          <Button variant="ghost" size="sm">Solid Team</Button>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sampleProjects.map((project) => {
          const rankInfo = Ranking.getByName(project.rankingId)
          const badgeSrc = Ranking.getBadgeSrc(project.rankingId)
          const glowClass = Ranking.getGlowClass(project.rankingId)

          return (
            <div key={project.id} className="rounded-xl border border-border/60 bg-card p-5 flex flex-col justify-between space-y-4 hover:border-border transition-colors shadow-sm">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 font-semibold text-foreground">
                    <FolderGit2 className="h-5 w-5 shrink-0" />
                    <span className="truncate text-base">{project.title}</span>
                  </div>

                  {/* Only PNG Badge with Radial Glow (No text, No card border) */}
                  <div
                    className="relative h-9 w-9 shrink-0 flex items-center justify-center"
                    title={rankInfo?.name || project.rankingId}
                  >
                    <div className={`absolute -inset-1.5 rounded-full blur-md opacity-85 pointer-events-none ${glowClass}`} />
                    <Image
                      src={badgeSrc}
                      alt={rankInfo?.name || project.rankingId}
                      fill
                      className="object-contain relative z-10 filter drop-shadow-sm"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded bg-accent/60 px-2 py-0.5 text-[10px] font-mono text-accent-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {project.contributors}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-3.5 w-3.5" />
                    {project.prs} PRs
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                  {project.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
