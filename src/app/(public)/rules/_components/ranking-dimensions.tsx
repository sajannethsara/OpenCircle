import * as React from "react"
import { Layers } from "lucide-react"
import { CORE_DIMENSIONS } from "./ranking-data"

export function RankingDimensions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          The Five Core Dimensions
        </h2>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/40 bg-muted/50 text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4 w-44">Dimension</th>
              <th className="py-3 px-4 w-20 text-center">Weight</th>
              <th className="py-3 px-4 w-1/3">What We Measure</th>
              <th className="py-3 px-4">Why It Matters</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {CORE_DIMENSIONS.map((dim) => {
              const Icon = dim.icon
              return (
                <tr key={dim.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-md border ${dim.colorClass}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span>{dim.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold ${dim.badgeColor}`}
                    >
                      {dim.weight}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-foreground font-medium">
                    {dim.metrics}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                    {dim.whyItMatters}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Cards View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
        {CORE_DIMENSIONS.map((dim) => {
          const Icon = dim.icon
          return (
            <div
              key={dim.id}
              className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-sm hover:border-border transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md border ${dim.colorClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm text-foreground">
                      {dim.name}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold ${dim.badgeColor}`}
                  >
                    {dim.weight}
                  </span>
                </div>

                <div className="font-mono text-xs text-foreground font-medium pt-1">
                  {dim.metrics}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {dim.whyItMatters}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
