import * as React from "react"
import { RankingHeader } from "./ranking-header"
import { RankingDimensions } from "./ranking-dimensions"
import { RankingPrinciples } from "./ranking-principles"
import { RankingTierBadges } from "./ranking-tier-badges"
import { RANKING_HEADER_DATA } from "./ranking-data"

export function RulesOverview() {
  return (
    <div className="space-y-12 pb-8">
      {/* Hero Header & Formula */}
      <RankingHeader />

      {/* The Five Core Dimensions */}
      <RankingDimensions />

      {/* Transparent & Fair by Design */}
      <RankingPrinciples />

      {/* Tier Badges Grid & Table */}
      <RankingTierBadges />

      {/* Scoring Note */}
      <p className="flex items-center justify-center text-xs text-muted-foreground/80 font-medium">
        {RANKING_HEADER_DATA.scoringNote}
      </p>
    </div>
  )
}
