import {
  Sparkles,
  Zap,
  HeartPulse,
  Users,
  PackageCheck,
  Clock,
  RefreshCw,
  Sliders,
} from "lucide-react"

export interface DimensionItem {
  id: string
  name: string
  weight: string
  metrics: string
  whyItMatters: string
  icon: typeof Sparkles
  colorClass: string
  badgeColor: string
}

export interface PrincipleItem {
  id: string
  title: string
  description: string
  icon: typeof Clock
}

export interface TierScoreMapping {
  badgeId: string
  name: string
  minScore: number
  maxScore: number
  scoreRange: string
  subtitle: string
  badgeSrc: string
  glowClass: string
  benefits: string
}

export const RANKING_HEADER_DATA = {
  title: "How OpenCircle Ranks Projects",
  subtitle:
    "Great open-source projects aren’t defined by vanity metrics or legacy star counts. OpenCircle evaluates repositories using a multi-dimensional, snapshot-based health model designed to highlight active, sustainable, and reliable software.",
  scoringNote:
    "Rank icons featured here are sourced from Mobile Legends: Bang Bang. All rights and intellectual property belong to Moonton.",
  formula:
    "Final Score = 25% Popularity + 25% Activity + 20% Health + 15% Community + 15% Release Stability",
}

export const CORE_DIMENSIONS: DimensionItem[] = [
  {
    id: "popularity",
    name: "Popularity",
    weight: "25%",
    metrics: "GitHub Stars (70%) & Forks (30%)",
    whyItMatters:
      "Measures broad developer interest and codebase reuse across the network.",
    icon: Sparkles,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    id: "activity",
    name: "Activity",
    weight: "25%",
    metrics: "90-day Commits (40%), Recent PRs (30%), & Push Recency (30%)",
    whyItMatters:
      "Tracks active development momentum and code velocity without favoring inactive legacy repos.",
    icon: Zap,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    id: "health",
    name: "Health",
    weight: "20%",
    metrics: "Issue Resolution (40%), PR Merge Rate (30%), & Maintenance Recency (30%)",
    whyItMatters:
      "Reflects maintainer responsiveness and efficient triage practices.",
    icon: HeartPulse,
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  {
    id: "community",
    name: "Community",
    weight: "15%",
    metrics: "90-day Active Contributors (60%) & Unique PR Authors (40%)",
    whyItMatters:
      "Measures healthy shared ownership versus single-maintainer bottlenecks.",
    icon: Users,
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    id: "release",
    name: "Release Stability",
    weight: "15%",
    metrics: "Latest Release Recency (50%) & 365-day Release Frequency (50%)",
    whyItMatters:
      "Rewards steady shipping cadences, production versioning, and software stability.",
    icon: PackageCheck,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
]

export const FAIRNESS_PRINCIPLES: PrincipleItem[] = [
  {
    id: "fixed-windows",
    title: "Fixed Observation Windows",
    description:
      "90 days for daily activity and contributor metrics; 365 days for release tracking. Older projects gain no unfair advantages simply from their age.",
    icon: Clock,
  },
  {
    id: "synchronized-snapshots",
    title: "Synchronized Snapshots",
    description:
      "All calculations evaluate the exact same time window per refresh cycle, ensuring deterministic comparisons across the entire ecosystem.",
    icon: RefreshCw,
  },
  {
    id: "context-aware",
    title: "Context-Aware Scoring",
    description:
      "Repositories without formal GitHub releases or closed PR histories are handled via neutral data fallbacks rather than unfair automatic penalties.",
    icon: Sliders,
  },
]

export const TIER_SCORE_MAPPINGS: TierScoreMapping[] = [
  {
    badgeId: "warrior",
    name: "Warrior",
    minScore: 0,
    maxScore: 19,
    scoreRange: "0 – 19",
    subtitle: "Initial MVP Foundation",
    badgeSrc: "/Ranking/warrior.png",
    glowClass: "rank-glow-warrior",
    benefits: "Listed on /Projects feed & initial open-source directory index",
  },
  {
    badgeId: "elite",
    name: "Elite",
    minScore: 20,
    maxScore: 34,
    scoreRange: "20 – 34",
    subtitle: "Active Development",
    badgeSrc: "/Ranking/elite.png",
    glowClass: "rank-glow-elite",
    benefits: "Custom status badge & community support highlights",
  },
  {
    badgeId: "master",
    name: "Master",
    minScore: 35,
    maxScore: 49,
    scoreRange: "35 – 49",
    subtitle: "Production Ready",
    badgeSrc: "/Ranking/master.png",
    glowClass: "rank-glow-master",
    benefits: "Featured placement on /Home platform showcase banner",
  },
  {
    badgeId: "grandmaster",
    name: "Grand Master",
    minScore: 50,
    maxScore: 64,
    scoreRange: "50 – 64",
    subtitle: "Batch Benchmark",
    badgeSrc: "/Ranking/grandmaster.png",
    glowClass: "rank-glow-grandmaster",
    benefits: "Batch benchmark project for technical showcases",
  },
  {
    badgeId: "epic",
    name: "Epic",
    minScore: 65,
    maxScore: 74,
    scoreRange: "65 – 74",
    subtitle: "Ecosystem Scale",
    badgeSrc: "/Ranking/epic.png",
    glowClass: "rank-glow-epic",
    benefits: "Dedicated showcase section & sponsor priority listing",
  },
  {
    badgeId: "legend",
    name: "Legend",
    minScore: 75,
    maxScore: 84,
    scoreRange: "75 – 84",
    subtitle: "Cross-Batch Icon",
    badgeSrc: "/Ranking/legend.png",
    glowClass: "rank-glow-legend",
    benefits: "Hall of Fame highlight & partner ecosystem exposure",
  },
  {
    badgeId: "mythic",
    name: "Mythic",
    minScore: 85,
    maxScore: 94,
    scoreRange: "85 – 94",
    subtitle: "Flagship Solution",
    badgeSrc: "/Ranking/mythic.png",
    glowClass: "rank-glow-mythic",
    benefits: "Global OpenCircle banner & permanent legendary status",
  },
  {
    badgeId: "mythicalglory",
    name: "Mythical Glory",
    minScore: 95,
    maxScore: 100,
    scoreRange: "95 – 100",
    subtitle: "Hall of Fame Legacy",
    badgeSrc: "/Ranking/mythicalglory.png",
    glowClass: "rank-glow-mythicalglory",
    benefits: "Pinnacle Hall of Fame status & permanent OpenCircle Legacy Award",
  },
]
