import * as React from "react"
import { Scale } from "lucide-react"
import { FAIRNESS_PRINCIPLES } from "./ranking-data"

export function RankingPrinciples() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Transparent & Fair by Design
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FAIRNESS_PRINCIPLES.map((principle) => {
          const Icon = principle.icon
          return (
            <div
              key={principle.id}
              className="rounded-xl border border-border/60 bg-card p-5 space-y-3 shadow-sm hover:border-border transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {principle.title}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {principle.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
