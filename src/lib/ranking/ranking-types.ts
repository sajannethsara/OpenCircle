/**
 * ranking-types.ts
 *
 * Shared TypeScript interfaces and types for the OpenCircle ranking system.
 * Used by ranking-engine.ts, ranking-cache.ts, github-data-collector.ts,
 * and use-ranking.ts.
 */

import type { RankBadge } from "@/generated/prisma/enums";

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Strategy for normalizing raw metric values to [0, 100].
 * The strategy is configured globally in ranking-config.ts.
 *
 * linear-ceiling : min(100, 100 × value / ceiling)           [v1 default]
 * logarithmic    : min(100, 100 × log(1+value) / log(1+ceiling))
 * sqrt           : min(100, 100 × √value / √ceiling)
 */
export type NormalizationStrategy = "linear-ceiling" | "logarithmic" | "sqrt";

export interface NormalizationConfig {
  strategy: NormalizationStrategy;
  ceiling: number;
}

/** A single tier in a piecewise recency scoring function. */
export interface RecencyTier {
  /** Days elapsed since the event. Use Infinity for the catch-all last tier. */
  maxDays: number;
  /** Score assigned when daysSinceEvent <= maxDays and > previous tier's maxDays. */
  score: number;
}

// ─── Feature Dataset ─────────────────────────────────────────────────────────

/**
 * Normalized feature dataset for a single project.
 * Produced by github-data-collector.ts.
 * Consumed exclusively by ranking-engine.ts (no API calls inside engine).
 */
export interface ProjectFeatures {
  // Popularity
  stars: number;
  forks: number;

  // Activity
  recentCommits: number;    // commits in last 90 days
  recentPRs: number;        // PRs created in last 90 days
  lastPush: string | null;  // ISO 8601 timestamp of last push

  // Health
  openIssues: number;         // open issues (excluding open PRs)
  closedIssues: number;       // all-time closed issues
  mergedPRs: number;          // all-time merged PRs
  closedUnmergedPRs: number;  // all-time closed but not merged PRs

  // Community
  activeContributors: number; // contributors with ≥1 commit in 90d window
  uniquePRAuthors: number;    // distinct PR authors in 90d window

  // Release Stability
  latestReleaseDate: string | null; // ISO 8601 timestamp of latest release
  releasesLastYear: number;         // release count in last 365 days

  // Metadata
  isFork: boolean; // whether the GitHub repo is a fork
}

// ─── Cache ────────────────────────────────────────────────────────────────────

/**
 * Feature groups correspond to cache TTL buckets.
 * Each group has its own fetchedAt timestamp so only stale groups
 * trigger re-fetches.
 */
export type FeatureGroup =
  | "repository" // stars, forks, pushed_at, fork flag
  | "activity"   // recentCommits, recentPRs
  | "health"     // openIssues, closedIssues, mergedPRs, closedUnmergedPRs
  | "community"  // activeContributors, uniquePRAuthors
  | "releases";  // latestReleaseDate, releasesLastYear

/** Per-group timestamps stored alongside cached feature data. */
export type FeatureGroupTimestamps = Partial<Record<FeatureGroup, string>>; // ISO 8601

/** A single IndexedDB cache record for one repository. */
export interface CachedProjectData {
  /** "owner/repo" — the IndexedDB primary key. */
  repoKey: string;
  /** Partial feature data — groups may be missing until first fetch. */
  features: Partial<ProjectFeatures>;
  /** fetchedAt timestamp per feature group. */
  timestamps: FeatureGroupTimestamps;
}

// ─── Ranking Snapshot ────────────────────────────────────────────────────────

/**
 * Defines the observation period for a ranking calculation cycle.
 * All recency and window calculations must use snapshotTime, not new Date().
 * This guarantees reproducibility: same snapshot + same features = same score.
 */
export interface RankingSnapshot {
  snapshotTime: Date;
  /** snapshotTime − 90 days */
  observationStart: Date;
  /** snapshotTime (same as snapshotTime, named for clarity) */
  observationEnd: Date;
  /** snapshotTime − 365 days */
  releaseWindowStart: Date;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/** Intermediate per-category scores, each in [0, 100]. */
export interface CategoryScores {
  popularity: number;
  activity: number;
  health: number;
  community: number;
  releaseStability: number;
}

/** Final output for one project from the ranking engine. */
export interface ProjectRankingResult {
  projectId: string;
  repoKey: string;                         // "owner/repo"
  score: number;                           // integer, clamped [0, 100]
  badge: RankBadge;
  categoryScores: CategoryScores;
  isFork: boolean;
  /**
   * Score before the fork penalty was applied.
   * Equals score if isFork is false.
   * Useful for transparency/debugging.
   */
  rawScoreBeforeForkPenalty: number;
}

// ─── Collector ───────────────────────────────────────────────────────────────

/** Options passed to the data collector. */
export interface CollectorOptions {
  /** Optional GitHub Personal Access Token (raises limit to 5000 req/hr). */
  token?: string;
  /** Progress callback for UI feedback during long collection runs. */
  onProgress?: (message: string) => void;
}

/** Input record for a project passed to the collector. */
export interface ProjectInput {
  id: string;
  githubUrl: string;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

/** Shape of the batch ranking update sent to POST /api/projects/rankings. */
export interface RankingUpdatePayload {
  results: Array<{
    projectId: string;
    score: number;
    badge: RankBadge;
  }>;
}
