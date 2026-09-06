import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  ExternalLink,
  ScrollText,
  FolderGit2,
  ChevronRight,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { HeroLottie } from "./hero-lottie"

function DiscordIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.91-72.13ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.92,53.87,53,48.8,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.92,96.1,53,91,65.69,84.69,65.69Z" />
    </svg>
  )
}

export function HomeHero() {
  return (
    <div className="space-y-12 lg:space-y-16 py-4 md:py-8">
      {/* Hero Section (Two Columns: Lottie Left, Clean Typography Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Lottie Animation */}
        <div className="lg:col-span-6 w-full flex justify-center order-first">
          <HeroLottie />
        </div>

        {/* Right Column: Clean Typography & CTAs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Learn. Build. Contribute.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl font-normal">
              A collaborative space for students to build real software, learn from each other, and become better engineers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/projects/running"
              className={buttonVariants({ size: "lg", className: "font-medium" })}
            >
              See Running Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="https://www.oc23.dev/events"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ size: "lg", variant: "outline", className: "font-medium" })}
            >
              View Upcoming events
              <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/40 pt-8">
        {/* 1. Join to Discord */}
        <a
          href="https://discord.gg/Yg2sxyqMD"
          target="_blank"
          rel="noreferrer"
          className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-background/60 p-5 hover:bg-muted/40 hover:border-border transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5865F2]/10 text-[#5865F2]">
                <DiscordIcon className="h-5 w-5" />
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                Join to Discord
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Connect with maintainers, collaborate in real-time, and get batch support.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground pt-4 transition-colors">
            <span>Join server</span>
            <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </a>

        {/* 2. View rules and ranks */}
        <Link
          href="/rules/ranking"
          className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-background/60 p-5 hover:bg-muted/40 hover:border-border transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ScrollText className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                View rules and ranks
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Explore the 8-tier progression system, maintainer guidelines, and scoring criteria.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground pt-4 transition-colors">
            <span>Learn ranking</span>
            <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 3. See upcoming projects */}
        <Link
          href="/projects/upcoming"
          className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-background/60 p-5 hover:bg-muted/40 hover:border-border transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                See upcoming projects
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Discover pipeline initiatives and prepare to contribute to the next batch sprint.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground pt-4 transition-colors">
            <span>Explore pipeline</span>
            <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  )
}
