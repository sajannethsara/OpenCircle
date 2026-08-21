import * as React from "react"
import { ShieldCheck, Clock, Layers, GitBranch, ArrowRight } from "lucide-react"

const maintainerSlas = [
  {
    icon: ShieldCheck,
    title: "1. Code Quality & Architectural Oversight",
    subtitle: "Project Standard Custodian",
    description: "Maintainers drive technical decisions, establish repository architecture standards, enforce test coverage requirements, and ensure clean CI/CD automation pipelines.",
  },
  {
    icon: Clock,
    title: "2. PR Review SLA (<7 Days)",
    subtitle: "Active Review Responsiveness",
    description: "All contributor Pull Requests must receive constructive code reviews or merge approvals within 7 days. Zero stale PRs (>7 days) is a mandatory requirement for Elite tier and above.",
  },
  {
    icon: Layers,
    title: "3. Issue Board Curation",
    subtitle: "Agile Task Management",
    description: "Curate project backlog boards weekly. Label accessible entry-level tasks with 'good-first-issue' and assign tasks promptly to interested student contributors upon request.",
  },
  {
    icon: GitBranch,
    title: "4. Tier Level-Up & Rotation",
    subtitle: "Self-Sustaining Ecosystem",
    description: "Lead your repository through tier promotions from Warrior to Mythical Glory. Train active contributors to take over maintainer responsibilities to ensure project continuity across academic terms.",
  },
]

export default function MaintainerRulesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6" />
          Maintainer Governance & SLAs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Responsibilities, review SLAs, and repository management guidelines for project leads.
        </p>
      </div>

      {/* SLA Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {maintainerSlas.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border/60 bg-card p-6 space-y-3 shadow-sm hover:border-border transition-colors flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs font-medium text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Maintainer SLA Standard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
