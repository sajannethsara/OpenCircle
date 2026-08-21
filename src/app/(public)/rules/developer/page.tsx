import * as React from "react"
import { Code2, GitPullRequest, CheckCircle2, MessageSquare, Award, ArrowRight } from "lucide-react"

const guidelines = [
  {
    icon: MessageSquare,
    title: "1. Public Technical Communication",
    subtitle: '"Ask Once, Help All"',
    description: "Private DMs for technical help are strictly discouraged. All bug reports, technical queries, and architectural questions must be asked in public channels or GitHub Discussions so the entire batch learns together.",
  },
  {
    icon: GitPullRequest,
    title: "2. Clean Branching & Commit Standards",
    subtitle: "Conventional Commits & Clean History",
    description: "Always create a feature branch off the main branch (e.g. feat/auth-flow or fix/nav-alignment). Write descriptive commit messages and ensure your code compiles cleanly without linter warnings.",
  },
  {
    icon: CheckCircle2,
    title: "3. PR Review & Checklist",
    subtitle: "Self-Review & Test Verification",
    description: "Verify that all unit tests pass before requesting review. Include screenshots or terminal outputs in PR descriptions. Comment on issues tagged with 'good-first-issue' to request assignment before starting work.",
  },
  {
    icon: Award,
    title: "4. Permanent Collaborator Pathway",
    subtitle: "Earn Direct Branch Write Access",
    description: "Once you achieve 3 merged non-trivial Pull Requests and active participation in community discussions, you earn the Permanent Collaborator badge and direct write access to project repositories!",
  },
]

export default function DeveloperRulesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Code2 className="h-6 w-6" />
          Developer Contribution Guidelines
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Standardized software engineering pathways for student contributors in Batch 23.
        </p>
      </div>

      {/* Guidelines Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {guidelines.map((item) => (
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
              <span>OpenCircle Core Policy</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
