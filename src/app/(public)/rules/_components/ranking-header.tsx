import * as React from "react"
import { ShieldCheck, Calculator } from "lucide-react"
import { RANKING_HEADER_DATA } from "./ranking-data"

export function RankingHeader() {
  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wide uppercase">
          <ShieldCheck className="h-4 w-4" />
          <span>OpenCircle Ranking Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {RANKING_HEADER_DATA.title}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed pb-3">
          {RANKING_HEADER_DATA.subtitle}
        </p>
      </div>

      {/* Formula Banner */}
      <div className=" p-4 sm:p-5 ">
        <div className="flex items-center justify-center gap-2 text-xs font-mono font-semibold text-primary mb-2">
          <Calculator className="h-4 w-4" />
          <span>Mathematical Weight Distribution</span>
        </div>
        <div className="flex justify-center items-center font-mono text-xs sm:text-sm font-bold text-foreground bg-background/80 dark:bg-card/80 border border-border/60 rounded-lg p-3 shadow-inner">
          <code>{RANKING_HEADER_DATA.formula}</code>
        </div>
      </div>
    </div>
  )
}
