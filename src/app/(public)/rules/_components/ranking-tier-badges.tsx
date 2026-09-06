import * as React from "react"
import Image from "next/image"
import { Award, ArrowRight, ShieldCheck } from "lucide-react"
import { TIER_SCORE_MAPPINGS } from "./ranking-data"

export function RankingTierBadges() {
  const row1 = TIER_SCORE_MAPPINGS.slice(0, 4)
  const row2 = TIER_SCORE_MAPPINGS.slice(4, 8)

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Tier Badges & Score Thresholds
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Your project&apos;s normalized final score automatically maps directly to its official tier badge:
        </p>
      </div>

      {/* Tier Progression Cards (2 Rows x 4 Items) */}
      <div className="space-y-6">
        {/* Row 1: Ranks 1-4 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          {row1.map((t, idx) => (
            <div
              key={t.badgeId}
              className="relative rounded-xl border border-border/70 bg-card p-4 text-center flex flex-col items-center justify-center space-y-3 hover:border-border hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="absolute top-2.5 right-2.5 rounded bg-accent/80 px-2 py-0.5 text-[10px] font-mono font-bold text-primary z-20 border border-border/40">
                Score {t.scoreRange}
              </div>

              {/* Badge & Glow Container */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 transition-transform group-hover:scale-105 duration-200 flex items-center justify-center">
                <div
                  className={`absolute -inset-2 rounded-full blur-xl opacity-80 pointer-events-none ${t.glowClass}`}
                />
                <Image
                  src={t.badgeSrc}
                  alt={t.name}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-contain filter drop-shadow-md relative z-10"
                />
              </div>

              <div className="relative z-10 space-y-0.5">
                <div className="font-bold text-base text-foreground tracking-tight">
                  {t.name}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {t.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Flow Connector Between Row 1 and Row 2 */}
        <div className="flex items-center justify-center gap-2 py-1 text-muted-foreground/60">
          <div className="h-px bg-border/60 flex-1" />
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/40 px-3.5 py-1 rounded-full border border-border/40">
            <span>Score Higher to Unlock High Tier Badges</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="h-px bg-border/60 flex-1" />
        </div>

        {/* Row 2: Ranks 5-8 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          {row2.map((t, idx) => (
            <div
              key={t.badgeId}
              className="relative rounded-xl border border-border/70 bg-card p-4 text-center flex flex-col items-center justify-center space-y-3 hover:border-border hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="absolute top-2.5 right-2.5 rounded bg-accent/80 px-2 py-0.5 text-[10px] font-mono font-bold text-primary z-20 border border-border/40">
                Score {t.scoreRange}
              </div>

              {/* Badge & Glow Container */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 transition-transform group-hover:scale-105 duration-200 flex items-center justify-center">
                <div
                  className={`absolute -inset-2 rounded-full blur-xl opacity-80 pointer-events-none ${t.glowClass}`}
                />
                <Image
                  src={t.badgeSrc}
                  alt={t.name}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-contain filter drop-shadow-md relative z-10"
                />
              </div>

              <div className="relative z-10 space-y-0.5">
                <div className="font-bold text-base text-foreground tracking-tight">
                  {t.name}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {t.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements & Benefits Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/40 font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Tier Score Ranges & Platform Recognition
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/40 bg-muted/50 text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tier Badge</th>
                <th className="py-3 px-4 text-center">Score Threshold</th>
                <th className="py-3 px-4">Platform Benefits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {TIER_SCORE_MAPPINGS.map((row) => (
                <tr key={row.badgeId} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
                        <div
                          className={`absolute -inset-1 rounded-full blur-md opacity-70 pointer-events-none ${row.glowClass}`}
                        />
                        <Image
                          src={row.badgeSrc}
                          alt={row.name}
                          fill
                          sizes="32px"
                          className="object-contain relative z-10"
                        />
                      </div>
                      <span className="text-sm font-bold">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-mono font-bold text-primary">
                      {row.scoreRange}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-foreground font-medium">
                    {row.benefits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
