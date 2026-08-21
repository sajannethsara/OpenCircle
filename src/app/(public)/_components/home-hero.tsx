import * as React from "react"
import Link from "next/link"
import { Shield, Users, GitPullRequest, Award, ArrowRight, CircleDot } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function HomeHero() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-xl border border-border/60 bg-card p-6 md:p-10 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted px-3 py-1 text-xs font-semibold text-foreground">
          <CircleDot className="h-3.5 w-3.5" />
          <span>Faculty of IT Batch 23 • University of Moratuwa</span>
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Empowering Sri Lankan Engineering Batches
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            OpenCircle (OC) is an open-source platform bridging the gap between academics and industry readiness by orchestrating student-led software projects for upcoming internships.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/projects"
            className={buttonVariants({ size: "lg", className: "font-semibold" })}
          >
            Explore Active Projects
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/rules"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            View Tier System & Rules
          </Link>
        </div>
      </div>

      {/* Metrics & Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border/50 bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Core Principle</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-foreground">"Ask Once, Help All"</p>
          <p className="text-xs text-muted-foreground">Public Q&A & transparent batch learning</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Model</span>
            <GitPullRequest className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-foreground">Software Firm</p>
          <p className="text-xs text-muted-foreground">Maintainers, PRs & agile issue boards</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Ranking</span>
            <Award className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-foreground">Gamified Tiers</p>
          <p className="text-xs text-muted-foreground">8 Ranks from Warrior to Mythical Glory</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Batch Target</span>
            <Shield className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-foreground">Internship Ready</p>
          <p className="text-xs text-muted-foreground">Industry-standard production software</p>
        </div>
      </div>
    </div>
  )
}
