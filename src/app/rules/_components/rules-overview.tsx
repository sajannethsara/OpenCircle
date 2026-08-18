import * as React from "react"
import Image from "next/image"
import { ShieldCheck, ArrowRight } from "lucide-react"
import { Ranking } from "@/lib/rankings"

export function RulesOverview() {
  const tierRows = Ranking.ALL
  const row1 = tierRows.slice(0, 4)
  const row2 = tierRows.slice(4, 8)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Transparency & Governance Rules</h1>
        <p className="text-sm text-muted-foreground">
          Clear contribution pathways and automated project tier rank requirements.
        </p>
      </div>

      {/* Tier Progression Cards (2 Rows x 4 Items) */}
      <div className="space-y-6">
        {/* Row 1: Ranks 1-4 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          {row1.map((t, idx) => (
            <div
              key={t.id}
              className="relative rounded-xl border border-border/70 bg-card p-4 text-center flex flex-col items-center justify-center space-y-3 hover:border-border hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="absolute top-2.5 right-2.5 rounded bg-accent/80 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground z-20">
                #{idx + 1}
              </div>

              {/* Badge & Glow Container */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 transition-transform group-hover:scale-105 duration-200 flex items-center justify-center">
                <div className={`absolute -inset-2 rounded-full blur-xl opacity-80 pointer-events-none ${t.glowClass}`} />
                <Image
                  src={t.badgeSrc}
                  alt={t.name}
                  fill
                  className="object-contain filter drop-shadow-md relative z-10"
                />
              </div>

              <div className="relative z-10">
                <div className="font-bold text-base text-foreground tracking-tight">{t.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {t.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Flow Connector Between Row 1 and Row 2 */}
        <div className="flex items-center justify-center gap-2 py-1 text-muted-foreground/60">
          <div className="h-px bg-border/60 flex-1" />
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/40">
            <span>Level Up to Advanced Ranks</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="h-px bg-border/60 flex-1" />
        </div>

        {/* Row 2: Ranks 5-8 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          {row2.map((t, idx) => (
            <div
              key={t.id}
              className="relative rounded-xl border border-border/70 bg-card p-4 text-center flex flex-col items-center justify-center space-y-3 hover:border-border hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="absolute top-2.5 right-2.5 rounded bg-accent/80 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground z-20">
                #{idx + 5}
              </div>

              {/* Badge & Glow Container */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 transition-transform group-hover:scale-105 duration-200 flex items-center justify-center">
                <div className={`absolute -inset-2 rounded-full blur-xl opacity-80 pointer-events-none ${t.glowClass}`} />
                <Image
                  src={t.badgeSrc}
                  alt={t.name}
                  fill
                  className="object-contain filter drop-shadow-md relative z-10"
                />
              </div>

              <div className="relative z-10">
                <div className="font-bold text-base text-foreground tracking-tight">{t.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {t.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/40 font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Rank Requirements & Platform Benefits
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/40 bg-muted/50 text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Requirements</th>
                <th className="py-3 px-4">Benefits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {tierRows.map((row) => (
                <tr key={row.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
                        <div className={`absolute -inset-1 rounded-full blur-md opacity-70 pointer-events-none ${row.glowClass}`} />
                        <Image
                          src={row.badgeSrc}
                          alt={row.name}
                          fill
                          className="object-contain relative z-10"
                        />
                      </div>
                      <span className="text-sm font-bold">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">{row.requirements}</td>
                  <td className="py-3.5 px-4 text-foreground font-medium">{row.benefits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
