/**
 * ranking-config.ts
 *
 * Central configuration for the OpenCircle GitHub Ranking System.
 * ALL tunable constants live here. Changing strategy or ceiling values
 * requires no changes to ranking-engine.ts, normalize.ts, or
 * github-data-collector.ts.
 */

import type { NormalizationStrategy, RecencyTier } from "./ranking-types";
import type { RankBadge } from "@/generated/prisma/enums";

// ─── Category Weights (must sum to exactly 1.0) ─────────────────────────────

export const CATEGORY_WEIGHTS = {
  popularity: 0.25,
  activity: 0.25,
  health: 0.20,
  community: 0.15,
  releaseStability: 0.15,
} as const;

// ─── Sub-Category Weights (each group must sum to exactly 1.0) ───────────────

export const POPULARITY_WEIGHTS = {
  stars: 0.70,
  forks: 0.30,
} as const;

export const ACTIVITY_WEIGHTS = {
  commits: 0.40,
  prActivity: 0.35,
  pushRecency: 0.25,
} as const;

export const HEALTH_WEIGHTS = {
  issueManagement: 0.40,
  prMergeRate: 0.40,
  maintenance: 0.20,
} as const;

export const COMMUNITY_WEIGHTS = {
  activeContributors: 0.50,
  prAuthors: 0.50,
} as const;

export const RELEASE_WEIGHTS = {
  recency: 0.60,
  frequency: 0.40,
} as const;

// ─── Absolute Scoring Ceilings ───────────────────────────────────────────────
//
// These are tuned for university batch open-source projects (not global
// projects like React or Linux). Reaching the ceiling earns 100; exceeding
// it still earns 100 (clamped). Adjust these to re-tune the entire system
// without touching any scoring logic.

export const SCORING_CEILINGS = {
  stars: 500,           // 500 stars is exceptional for a batch project
  forks: 100,           // 100 forks = significant community reuse
  recentCommits: 40,    // ~3 commits/week for 90 days = very active (tuned for smaller community)
  recentPRs: 30,        // ~2-3 PRs/week for 90 days = excellent velocity (tuned for smaller community)
  activeContributors: 10, // 10 active contributors in 90 days = outstanding (tuned for smaller community)
  uniquePRAuthors: 10,  // 10 distinct PR authors = broad participation (tuned for smaller community)
  releasesPerYear: 12,  // monthly releases = mature release engineering
} as const;

// ─── Normalization Strategy ───────────────────────────────────────────────────
//
// Change this one constant to swap the normalization strategy globally.
// Options: 'linear-ceiling' | 'logarithmic' | 'sqrt'
// v1 uses 'linear-ceiling'. Switch to 'logarithmic' here if outliers
// distort the metric distribution in real data.

export const DEFAULT_NORMALIZATION_STRATEGY: NormalizationStrategy =
  "linear-ceiling";

// ─── Observation Windows ──────────────────────────────────────────────────────

export const ACTIVITY_WINDOW_DAYS = 90;
export const RELEASE_WINDOW_DAYS = 365;

// ─── Recency Scoring Tiers ───────────────────────────────────────────────────
//
// Piecewise mapping: days since event → score.
// Must be sorted ascending by maxDays.

export const PUSH_RECENCY_TIERS: RecencyTier[] = [
  { maxDays: 7, score: 100 },
  { maxDays: 30, score: 90 },
  { maxDays: 90, score: 70 },
  { maxDays: 180, score: 40 },
  { maxDays: 365, score: 15 },
  { maxDays: Infinity, score: 0 },
];

export const RELEASE_RECENCY_TIERS: RecencyTier[] = [
  { maxDays: 7, score: 100 },
  { maxDays: 30, score: 90 },
  { maxDays: 90, score: 70 },
  { maxDays: 180, score: 40 },
  { maxDays: 365, score: 15 },
  { maxDays: Infinity, score: 0 },
];

// ─── Badge Thresholds ─────────────────────────────────────────────────────────
//
// Score-to-badge mapping. Must cover 0–100 with no gaps or overlaps.
// Sorted ascending by min.

export interface BadgeTier {
  min: number;
  max: number;
  badge: RankBadge;
}

export const BADGE_THRESHOLDS: BadgeTier[] = [
  { min: 0, max: 19, badge: "warrior" },
  { min: 20, max: 34, badge: "elite" },
  { min: 35, max: 49, badge: "master" },
  { min: 50, max: 64, badge: "grandmaster" },
  { min: 65, max: 74, badge: "epic" },
  { min: 75, max: 84, badge: "legend" },
  { min: 85, max: 94, badge: "mythic" },
  { min: 95, max: 100, badge: "mythicalglory" },
];

// ─── Cache TTLs (milliseconds) ────────────────────────────────────────────────
//
// Per feature group TTLs. Only stale groups are re-fetched on refresh.

export const CACHE_TTLS = {
  repository: 6 * 60 * 60 * 1000,  // 6h  — stars, forks, pushed_at, fork flag
  activity: 6 * 60 * 60 * 1000,    // 6h  — recent commits, recent PRs
  health: 12 * 60 * 60 * 1000,     // 12h — issue stats, PR merge rate
  community: 12 * 60 * 60 * 1000,  // 12h — contributors, PR authors
  releases: 12 * 60 * 60 * 1000,   // 12h — release recency + frequency
} as const;

// ─── Fork Penalty ─────────────────────────────────────────────────────────────
//
// Forks are flagged and their final score is multiplied by this factor.
// Policy: flag forks, apply penalty — do not exclude them entirely.
// A fork project's raw score is preserved in the result for transparency.

export const FORK_SCORE_PENALTY = 0.80;

// ─── GitHub Search API Pacing ─────────────────────────────────────────────────
//
// Unauthenticated Search API limit: 10 req/min
// Authenticated Search API limit:   30 req/min

export const SEARCH_DELAY_UNAUTH_MS = 7_000; // ~8.5 req/min — safe margin
export const SEARCH_DELAY_AUTH_MS = 2_000;   // ~30 req/min

// ─── Stats/Contributors Retry ─────────────────────────────────────────────────
//
// /repos/{owner}/{repo}/stats/contributors may return 202 on first call.
// Retry up to this many times with this delay between attempts.

export const STATS_RETRY_COUNT = 3;
export const STATS_RETRY_DELAY_MS = 3_000;

// ─── Missing Data Neutral Score ───────────────────────────────────────────────
//
// When ALL sub-metrics in a category are unavailable (null), return this
// neutral score instead of 0. Prevents unfair penalization of projects
// with sparse GitHub data.

export const MISSING_DATA_NEUTRAL_SCORE = 50;
