/**
 * ranking-engine.ts
 *
 * Pure deterministic ranking engine for the OpenCircle GitHub Ranking System.
 *
 * CRITICAL RULES — must never be violated:
 *   1. Zero GitHub API calls — engine operates only on ProjectFeatures data.
 *   2. Zero calls to new Date() — all time is parameterized via RankingSnapshot.
 *   3. Zero randomness — same input always produces same output.
 *   4. Zero side effects — no cache reads/writes, no HTTP, no console.log.
 *
 * Data flow:
 *   GitHub API → Data Collector → ProjectFeatures → THIS FILE → score + badge
 */

import type {
  ProjectFeatures,
  RankingSnapshot,
  CategoryScores,
  ProjectRankingResult,
} from "./ranking-types";
import type { RankBadge } from "@/generated/prisma/enums";
import {
  CATEGORY_WEIGHTS,
  POPULARITY_WEIGHTS,
  ACTIVITY_WEIGHTS,
  HEALTH_WEIGHTS,
  COMMUNITY_WEIGHTS,
  RELEASE_WEIGHTS,
  SCORING_CEILINGS,
  DEFAULT_NORMALIZATION_STRATEGY,
  BADGE_THRESHOLDS,
  PUSH_RECENCY_TIERS,
  RELEASE_RECENCY_TIERS,
  FORK_SCORE_PENALTY,
  MISSING_DATA_NEUTRAL_SCORE,
} from "./ranking-config";
import {
  normalize,
  calculateRecencyScore,
  weightedAverage,
  clamp,
  parseDate,
} from "./normalize";

// ─── Popularity ───────────────────────────────────────────────────────────────

/**
 * Score for GitHub stars.
 * Uses the configured ceiling; exceeding the ceiling still earns 100.
 */
export function calculateStarScore(stars: number): number {
  return normalize(stars, {
    strategy: DEFAULT_NORMALIZATION_STRATEGY,
    ceiling: SCORING_CEILINGS.stars,
  });
}

/**
 * Score for GitHub forks.
 */
export function calculateForkScore(forks: number): number {
  return normalize(forks, {
    strategy: DEFAULT_NORMALIZATION_STRATEGY,
    ceiling: SCORING_CEILINGS.forks,
  });
}

/**
 * Weighted combination of star and fork scores.
 * Stars receive 70% weight (broader interest), forks 30% (repository reuse).
 */
export function calculatePopularityScore(
  stars: number,
  forks: number
): number {
  return weightedAverage([
    { score: calculateStarScore(stars), weight: POPULARITY_WEIGHTS.stars },
    { score: calculateForkScore(forks), weight: POPULARITY_WEIGHTS.forks },
  ]);
}

// ─── Activity ─────────────────────────────────────────────────────────────────

/**
 * Score for commits made in the 90-day observation window.
 */
export function calculateCommitScore(recentCommits: number): number {
  return normalize(recentCommits, {
    strategy: DEFAULT_NORMALIZATION_STRATEGY,
    ceiling: SCORING_CEILINGS.recentCommits,
  });
}

/**
 * Score for pull requests created in the 90-day observation window.
 */
export function calculatePRActivityScore(recentPRs: number): number {
  return normalize(recentPRs, {
    strategy: DEFAULT_NORMALIZATION_STRATEGY,
    ceiling: SCORING_CEILINGS.recentPRs,
  });
}

/**
 * Score for how recently the repository was pushed to.
 * Uses snapshotTime — never new Date() — for reproducibility.
 *
 * Returns 0 if lastPush is null (no push ever recorded).
 * Note: null lastPush is treated as zero here (not unavailable) because
 * "no push" is a real signal of inactivity, not a data collection failure.
 */
export function calculatePushRecencyScore(
  lastPush: string | null,
  snapshotTime: Date
): number {
  const pushDate = parseDate(lastPush);
  const score = calculateRecencyScore(pushDate, snapshotTime, PUSH_RECENCY_TIERS);
  return score ?? 0; // null date → treat as zero activity, not unavailable
}

/**
 * Weighted combination of commit, PR, and push recency scores.
 */
export function calculateActivityScore(
  features: Pick<ProjectFeatures, "recentCommits" | "recentPRs" | "lastPush">,
  snapshotTime: Date
): number {
  return weightedAverage([
    {
      score: calculateCommitScore(features.recentCommits),
      weight: ACTIVITY_WEIGHTS.commits,
    },
    {
      score: calculatePRActivityScore(features.recentPRs),
      weight: ACTIVITY_WEIGHTS.prActivity,
    },
    {
      score: calculatePushRecencyScore(features.lastPush, snapshotTime),
      weight: ACTIVITY_WEIGHTS.pushRecency,
    },
  ]);
}

// ─── Health ───────────────────────────────────────────────────────────────────

/**
 * Issue resolution rate: closed / (closed + open).
 *
 * Returns null if both counts are zero (no issues — metric unavailable).
 * This prevents penalizing projects that simply don't use GitHub Issues.
 */
export function calculateIssueManagementScore(
  closedIssues: number,
  openIssues: number
): number | null {
  const total = closedIssues + openIssues;
  if (total === 0) return null;
  return clamp((100 * closedIssues) / total, 0, 100);
}

/**
 * PR quality rate: merged / (merged + closed-unmerged).
 *
 * Returns null if there are no closed PRs (no history — metric unavailable).
 * This prevents penalizing projects with low PR volume.
 */
export function calculatePRMergeRateScore(
  mergedPRs: number,
  closedUnmergedPRs: number
): number | null {
  const total = mergedPRs + closedUnmergedPRs;
  if (total === 0) return null;
  return clamp((100 * mergedPRs) / total, 0, 100);
}

/**
 * Maintenance recency score — measures whether the repo is actively maintained.
 *
 * Deliberately avoids double-counting pushed_at (already in Activity).
 * Instead uses binary signals from recent PR and issue activity:
 *   +40 pts — has any merged PR in last 30 days
 *   +30 pts — has any recent PR activity in last 30 days (recentPRs > 0 in window)
 *   +30 pts — has any issue activity in last 30 days (approximated from open issues)
 *
 * Since we don't collect per-PR timestamps in the feature dataset (would require
 * full pagination), we approximate from:
 *   - recentPRs count (proxy for "recent PR activity")
 *   - recentCommits (proxy for "recent issue responsiveness")
 * This is documented as an approximation and can be refined later.
 */
export function calculateMaintenanceScore(
  features: Pick<ProjectFeatures, "recentPRs" | "recentCommits" | "mergedPRs">,
  _snapshotTime: Date
): number {
  // snapshotTime is passed for future use (e.g., if we collect per-PR timestamps)
  let score = 0;

  // Signal 1: Any PRs in the 90d window → project is receiving contributions
  if (features.recentPRs > 0) score += 40;

  // Signal 2: Any commits in the 90d window → project is being coded
  if (features.recentCommits > 0) score += 30;

  // Signal 3: Any merged PRs ever → project has active review/merge process
  if (features.mergedPRs > 0) score += 30;

  return clamp(score, 0, 100);
}

/**
 * Weighted combination of issue management, PR merge rate, and maintenance.
 * Uses weight redistribution for null (unavailable) sub-metrics.
 */
export function calculateHealthScore(
  features: Pick<
    ProjectFeatures,
    "openIssues" | "closedIssues" | "mergedPRs" | "closedUnmergedPRs" | "recentPRs" | "recentCommits"
  >,
  snapshotTime: Date
): number {
  const issueScore = calculateIssueManagementScore(
    features.closedIssues,
    features.openIssues
  );
  const prMergeScore = calculatePRMergeRateScore(
    features.mergedPRs,
    features.closedUnmergedPRs
  );
  const maintenanceScore = calculateMaintenanceScore(features, snapshotTime);

  return weightedAverage([
    { score: issueScore, weight: HEALTH_WEIGHTS.issueManagement },
    { score: prMergeScore, weight: HEALTH_WEIGHTS.prMergeRate },
    { score: maintenanceScore, weight: HEALTH_WEIGHTS.maintenance },
  ]);
}

// ─── Community ────────────────────────────────────────────────────────────────

/**
 * Score for number of distinct contributors active in the 90-day window.
 *
 * Note: if /stats/contributors returned a 202 after retries, the caller
 * stores activeContributors = -1 as a sentinel for "unavailable".
 * This function treats -1 as null (unavailable).
 */
export function calculateActiveContributorScore(
  activeContributors: number
): number | null {
  if (activeContributors < 0) return null; // sentinel: API unavailable
  return normalize(activeContributors, {
    strategy: DEFAULT_NORMALIZATION_STRATEGY,
    ceiling: SCORING_CEILINGS.activeContributors,
  });
}

/**
 * Score for number of unique PR authors in the 90-day window.
 */
export function calculateUniquePRAuthorScore(
  uniquePRAuthors: number
): number {
  return normalize(uniquePRAuthors, {
    strategy: DEFAULT_NORMALIZATION_STRATEGY,
    ceiling: SCORING_CEILINGS.uniquePRAuthors,
  });
}

/**
 * Weighted combination of active contributor and unique PR author scores.
 */
export function calculateCommunityScore(
  features: Pick<ProjectFeatures, "activeContributors" | "uniquePRAuthors">
): number {
  return weightedAverage([
    {
      score: calculateActiveContributorScore(features.activeContributors),
      weight: COMMUNITY_WEIGHTS.activeContributors,
    },
    {
      score: calculateUniquePRAuthorScore(features.uniquePRAuthors),
      weight: COMMUNITY_WEIGHTS.prAuthors,
    },
  ]);
}

// ─── Release Stability ────────────────────────────────────────────────────────

/**
 * Score for how recently the latest release was published.
 *
 * Returns null if latestReleaseDate is null (no releases ever).
 * This signals "metric unavailable" so weight redistribution applies
 * rather than penalizing projects that don't use GitHub Releases.
 */
export function calculateReleaseRecencyScore(
  latestReleaseDate: string | null,
  snapshotTime: Date
): number | null {
  const releaseDate = parseDate(latestReleaseDate);
  return calculateRecencyScore(releaseDate, snapshotTime, RELEASE_RECENCY_TIERS);
}

/**
 * Score for number of releases in the last 365 days.
 *
 * Returns null if releasesLastYear is 0 AND latestReleaseDate is null
 * (project has never made a release — metric genuinely unavailable).
 * Returns 0 if releasesLastYear is 0 but releases exist (just no recent ones).
 */
export function calculateReleaseFrequencyScore(
  releasesLastYear: number,
  latestReleaseDate: string | null
): number | null {
  // If there have been no releases ever, this metric is unavailable
  if (releasesLastYear === 0 && latestReleaseDate === null) return null;

  return normalize(releasesLastYear, {
    strategy: DEFAULT_NORMALIZATION_STRATEGY,
    ceiling: SCORING_CEILINGS.releasesPerYear,
  });
}

/**
 * Weighted combination of release recency and frequency.
 * Both may be null for projects with no GitHub releases —
 * in that case returns MISSING_DATA_NEUTRAL_SCORE (50).
 */
export function calculateReleaseStabilityScore(
  features: Pick<ProjectFeatures, "latestReleaseDate" | "releasesLastYear">,
  snapshotTime: Date
): number {
  const recencyScore = calculateReleaseRecencyScore(
    features.latestReleaseDate,
    snapshotTime
  );
  const frequencyScore = calculateReleaseFrequencyScore(
    features.releasesLastYear,
    features.latestReleaseDate
  );

  return weightedAverage([
    { score: recencyScore, weight: RELEASE_WEIGHTS.recency },
    { score: frequencyScore, weight: RELEASE_WEIGHTS.frequency },
  ]);
}

// ─── Final Score ──────────────────────────────────────────────────────────────

/**
 * Combine the five category scores into a final project score.
 *
 * Formula:
 *   Score = 0.25 × Popularity
 *         + 0.25 × Activity
 *         + 0.20 × Health
 *         + 0.15 × Community
 *         + 0.15 × ReleaseStability
 *
 * @returns A float in [0, 100] (not yet rounded).
 */
export function calculateProjectScore(categoryScores: CategoryScores): number {
  const raw =
    CATEGORY_WEIGHTS.popularity * categoryScores.popularity +
    CATEGORY_WEIGHTS.activity * categoryScores.activity +
    CATEGORY_WEIGHTS.health * categoryScores.health +
    CATEGORY_WEIGHTS.community * categoryScores.community +
    CATEGORY_WEIGHTS.releaseStability * categoryScores.releaseStability;

  return clamp(raw, 0, 100);
}

// ─── Badge Assignment ─────────────────────────────────────────────────────────

/**
 * Map a final integer score [0, 100] to a RankBadge.
 *
 * @param score  Integer score, clamped [0, 100].
 * @returns      The corresponding RankBadge enum value.
 */
export function calculateRankBadge(score: number): RankBadge {
  // Walk thresholds in order; find the first range that contains the score.
  for (const tier of BADGE_THRESHOLDS) {
    if (score >= tier.min && score <= tier.max) {
      return tier.badge;
    }
  }
  // Fallback — should never be reached if thresholds cover 0–100 completely.
  return "warrior";
}

// ─── Single Project Ranking ───────────────────────────────────────────────────

/**
 * Calculate the complete ranking for a single project.
 *
 * Because scoring is ABSOLUTE (uses configured ceilings, not cross-project
 * max), this function is independent — it does not need the full project pool.
 *
 * @param projectId  The database project ID.
 * @param repoKey    "owner/repo" string.
 * @param features   Full feature dataset for this project.
 * @param snapshot   The ranking snapshot (provides snapshotTime).
 * @returns          Complete ProjectRankingResult.
 */
export function calculateRanking(
  projectId: string,
  repoKey: string,
  features: ProjectFeatures,
  snapshot: RankingSnapshot
): ProjectRankingResult {
  const { snapshotTime } = snapshot;

  const categoryScores: CategoryScores = {
    popularity: calculatePopularityScore(features.stars, features.forks),
    activity: calculateActivityScore(features, snapshotTime),
    health: calculateHealthScore(features, snapshotTime),
    community: calculateCommunityScore(features),
    releaseStability: calculateReleaseStabilityScore(features, snapshotTime),
  };

  const rawContinuous = calculateProjectScore(categoryScores);
  const rawScore = Math.round(rawContinuous);
  const clampedRaw = clamp(rawScore, 0, 100);

  // Apply fork penalty after rounding
  let finalScore = clampedRaw;
  if (features.isFork) {
    finalScore = clamp(Math.round(clampedRaw * FORK_SCORE_PENALTY), 0, 100);
  }

  return {
    projectId,
    repoKey,
    score: finalScore,
    badge: calculateRankBadge(finalScore),
    categoryScores,
    isFork: features.isFork,
    rawScoreBeforeForkPenalty: clampedRaw,
  };
}

// ─── All Projects ─────────────────────────────────────────────────────────────

/**
 * Calculate rankings for all projects in the feature dataset.
 *
 * Projects are processed in sorted order by projectId to guarantee
 * stable, deterministic output regardless of Map iteration order.
 *
 * @param allFeatures  Map of projectId → { repoKey, features }.
 * @param snapshot     The ranking snapshot used for all calculations.
 * @returns            Array of ProjectRankingResult, sorted by score DESC.
 */
export function calculateAllRankings(
  allFeatures: Map<string, { repoKey: string; features: ProjectFeatures }>,
  snapshot: RankingSnapshot
): ProjectRankingResult[] {
  // Sort by projectId for deterministic processing order
  const sortedEntries = Array.from(allFeatures.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const results = sortedEntries.map(([projectId, { repoKey, features }]) =>
    calculateRanking(projectId, repoKey, features, snapshot)
  );

  // Return sorted by score descending for convenient leaderboard use
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Create a RankingSnapshot from a given point in time.
 * Always pass a specific date — never call this with new Date() inside
 * the engine itself.
 *
 * @param snapshotTime  The moment this ranking cycle began.
 * @returns             A complete RankingSnapshot.
 */
export function createSnapshot(snapshotTime: Date): RankingSnapshot {
  const msPerDay = 24 * 60 * 60 * 1000;
  return {
    snapshotTime,
    observationStart: new Date(snapshotTime.getTime() - 90 * msPerDay),
    observationEnd: snapshotTime,
    releaseWindowStart: new Date(snapshotTime.getTime() - 365 * msPerDay),
  };
}
