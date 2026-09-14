/**
 * server-ranking-sync.ts
 *
 * Server-side headless ranking sync engine for OpenCircle.
 *
 * Designed to run:
 *   1. Inside scheduled GitHub Actions workflows (CLI)
 *   2. Inside Next.js API route handlers (/api/admin/rankings)
 *
 * Key features:
 *   - Authenticated with GITHUB_PAT (5,000 req/hr, 30 search req/min)
 *   - Database-backed tiered retention (Neon PostgreSQL):
 *       • repository: 24 hours (Daily)
 *       • activity:   24 hours (Daily)
 *       • health:      7 days (Weekly)
 *       • community:   7 days (Weekly)
 *       • releases:   14 days (Bi-weekly)
 *   - Only fetches stale feature groups; reuses fresh groups from DB
 *   - Atomic updates to score, badge, ranking_metrics, and last_ranked_at
 */

import { db } from "@/lib/db";
import { DB_RETENTION_TTLS } from "./ranking-config";
import { createSnapshot, calculateRanking } from "./ranking-engine";
import {
  parseGithubUrl,
  SearchQueue,
  fetchRepositoryGroup,
  fetchActivityGroup,
  fetchHealthGroup,
  fetchCommunityGroup,
  fetchReleasesGroup,
} from "./github-data-collector";
import type {
  FeatureGroup,
  FeatureGroupTimestamps,
  ProjectFeatures,
  StoredRankingMetrics,
  ProjectRankingResult,
  RankingSnapshot,
} from "./ranking-types";

export interface SyncOptions {
  /** Override or provide GitHub PAT. Defaults to process.env.GITHUB_PAT or process.env.GITHUB_TOKEN */
  token?: string;
  /** Force refetch of all feature groups regardless of retention TTL */
  forceAll?: boolean;
  /** Limit sync to specific project IDs */
  projectIds?: string[];
  /** Progress logger callback */
  onProgress?: (message: string) => void;
}

export interface SyncProjectSummary {
  projectId: string;
  repoKey: string;
  score: number;
  badge: string;
  staleGroups: FeatureGroup[];
  isFork: boolean;
}

export interface SyncResult {
  success: boolean;
  totalProjects: number;
  updatedProjects: number;
  skippedProjects: number;
  durationMs: number;
  results: SyncProjectSummary[];
  errors: Array<{ projectId: string; error: string }>;
}

/**
 * Determine which feature groups are stale based on DB retention TTLs.
 */
export function getStaleGroupsFromDB(
  timestamps: FeatureGroupTimestamps = {},
  now: Date,
  forceAll = false
): FeatureGroup[] {
  const groups: FeatureGroup[] = [
    "repository",
    "activity",
    "health",
    "community",
    "releases",
  ];

  if (forceAll) return groups;

  return groups.filter((group) => {
    const fetchedAtStr = timestamps[group];
    if (!fetchedAtStr) return true; // never fetched

    const fetchedAt = new Date(fetchedAtStr);
    const ttl = DB_RETENTION_TTLS[group];
    return now.getTime() - fetchedAt.getTime() > ttl;
  });
}

/**
 * Sync rankings for all projects (or filtered subset) directly against Neon DB.
 */
export async function syncAllProjectRankings(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const token =
    options.token ||
    process.env.GITHUB_PAT ||
    process.env.GITHUB_TOKEN ||
    undefined;

  const onProgress = options.onProgress ?? ((msg) => console.log(`[RankSync] ${msg}`));
  const queue = new SearchQueue(token);
  const now = new Date();
  const snapshot: RankingSnapshot = createSnapshot(now);

  onProgress(
    `Starting server ranking sync at ${now.toISOString()} (Token provided: ${Boolean(token)})`
  );

  // Fetch target projects from Neon
  const whereClause = options.projectIds?.length
    ? { id: { in: options.projectIds } }
    : {};

  const projects = await db.project.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });

  onProgress(`Found ${projects.length} project(s) to process.`);

  const results: SyncProjectSummary[] = [];
  const errors: Array<{ projectId: string; error: string }> = [];

  for (const project of projects) {
    try {
      const parsed = parseGithubUrl(project.githubUrl);
      if (!parsed) {
        onProgress(`[${project.id}] Skipped: Invalid GitHub URL (${project.githubUrl})`);
        errors.push({ projectId: project.id, error: `Invalid GitHub URL: ${project.githubUrl}` });
        continue;
      }

      const { owner, repo, repoKey } = parsed;
      const storedMetrics = (project.rankingMetrics as unknown as StoredRankingMetrics) ?? null;
      const existingTimestamps: FeatureGroupTimestamps = storedMetrics?.timestamps ?? {};
      const existingFeatures: Partial<ProjectFeatures> = storedMetrics?.features ?? {};

      const staleGroups = getStaleGroupsFromDB(
        existingTimestamps,
        now,
        options.forceAll
      );

      onProgress(
        `[${repoKey}] Stale groups to fetch: ${
          staleGroups.length > 0 ? staleGroups.join(", ") : "none (all cached within retention)"
        }`
      );

      const updatedTimestamps: FeatureGroupTimestamps = { ...existingTimestamps };
      const mergedFeatures: Partial<ProjectFeatures> = { ...existingFeatures };
      const fetchedAt = now.toISOString();

      let openPRsCount = 0;

      // Phase 1: REST Calls
      const restPromises: Promise<void>[] = [];

      if (staleGroups.includes("repository")) {
        restPromises.push(
          fetchRepositoryGroup(owner, repo, token).then((data) => {
            Object.assign(mergedFeatures, data);
            updatedTimestamps.repository = fetchedAt;
          })
        );
      }

      if (staleGroups.includes("releases")) {
        restPromises.push(
          fetchReleasesGroup(owner, repo, snapshot, token, onProgress).then((data) => {
            Object.assign(mergedFeatures, data);
            updatedTimestamps.releases = fetchedAt;
          })
        );
      }

      await Promise.all(restPromises);

      // Phase 2: Sequential Search Calls
      if (staleGroups.includes("activity")) {
        const activityData = await fetchActivityGroup(
          owner,
          repo,
          snapshot,
          queue,
          token,
          onProgress
        );
        Object.assign(mergedFeatures, activityData);
        updatedTimestamps.activity = fetchedAt;
      }

      if (staleGroups.includes("health")) {
        const healthData = await fetchHealthGroup(
          owner,
          repo,
          snapshot,
          queue,
          token,
          onProgress
        );
        const { openPRsCount: prCount, ...hFeatures } = healthData;
        openPRsCount = prCount;
        Object.assign(mergedFeatures, hFeatures);
        updatedTimestamps.health = fetchedAt;
      }

      if (staleGroups.includes("community")) {
        const communityData = await fetchCommunityGroup(
          owner,
          repo,
          snapshot,
          queue,
          token,
          onProgress
        );
        Object.assign(mergedFeatures, communityData);
        updatedTimestamps.community = fetchedAt;
      }

      // Assemble final features with complete fallbacks
      const rawOpenIssues = (mergedFeatures as any).open_issues_count_raw ?? 0;
      const completeFeatures: ProjectFeatures = {
        stars: mergedFeatures.stars ?? 0,
        forks: mergedFeatures.forks ?? 0,
        recentCommits: mergedFeatures.recentCommits ?? 0,
        recentPRs: mergedFeatures.recentPRs ?? 0,
        lastPush: mergedFeatures.lastPush ?? null,
        openIssues:
          mergedFeatures.openIssues ?? Math.max(0, rawOpenIssues - openPRsCount),
        closedIssues: mergedFeatures.closedIssues ?? 0,
        mergedPRs: mergedFeatures.mergedPRs ?? 0,
        closedUnmergedPRs: mergedFeatures.closedUnmergedPRs ?? 0,
        activeContributors: mergedFeatures.activeContributors ?? 0,
        uniquePRAuthors: mergedFeatures.uniquePRAuthors ?? 0,
        latestReleaseDate: mergedFeatures.latestReleaseDate ?? null,
        releasesLastYear: mergedFeatures.releasesLastYear ?? 0,
        isFork: mergedFeatures.isFork ?? false,
      };

      // Run pure deterministic ranking engine
      const rankingResult: ProjectRankingResult = calculateRanking(
        project.id,
        repoKey,
        completeFeatures,
        snapshot
      );

      // Structure stored metrics JSON for DB
      const newMetricsToStore: StoredRankingMetrics = {
        repoKey,
        features: completeFeatures,
        categoryScores: rankingResult.categoryScores,
        timestamps: updatedTimestamps,
        lastCalculatedAt: fetchedAt,
      };

      // Atomically update Neon DB
      await db.project.update({
        where: { id: project.id },
        data: {
          score: rankingResult.score,
          badge: rankingResult.badge,
          rankingMetrics: newMetricsToStore as any,
          lastRankedAt: now,
        },
      });

      results.push({
        projectId: project.id,
        repoKey,
        score: rankingResult.score,
        badge: rankingResult.badge,
        staleGroups,
        isFork: rankingResult.isFork,
      });

      onProgress(
        `✓ [${repoKey}] Synced: Score=${rankingResult.score}, Badge=${rankingResult.badge}`
      );
    } catch (projectErr) {
      const errorMsg =
        projectErr instanceof Error ? projectErr.message : String(projectErr);
      onProgress(`✗ [${project.githubUrl}] Error: ${errorMsg}`);
      errors.push({ projectId: project.id, error: errorMsg });
    }
  }

  const durationMs = Date.now() - startTime;
  onProgress(
    `Sync complete in ${(durationMs / 1000).toFixed(2)}s: ${results.length} updated, ${
      errors.length
    } errors.`
  );

  return {
    success: errors.length === 0,
    totalProjects: projects.length,
    updatedProjects: results.length,
    skippedProjects: errors.length,
    durationMs,
    results,
    errors,
  };
}
