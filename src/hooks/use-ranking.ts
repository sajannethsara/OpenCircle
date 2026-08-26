"use client";

/**
 * use-ranking.ts
 *
 * React hook that orchestrates the full ranking pipeline:
 *   1. Fetch all projects from the database
 *   2. Create a ranking snapshot (snapshotTime = now)
 *   3. Collect GitHub features (cache-first, stale groups only)
 *   4. Run the pure ranking engine
 *   5. Persist results via POST /api/projects/rankings
 *
 * This is the only place where new Date() is allowed for the snapshot,
 * because the hook is the boundary between "real world time" and the
 * deterministic ranking engine.
 */

import { useState, useCallback } from "react";
import { createSnapshot, calculateAllRankings } from "@/lib/ranking/ranking-engine";
import { collectAllProjectFeatures } from "@/lib/ranking/github-data-collector";
import type { ProjectRankingResult, CollectorOptions } from "@/lib/ranking/ranking-types";

interface Project {
  id: string;
  githubUrl: string;
  name: string;
}

interface UseRankingReturn {
  /**
   * Trigger a full ranking refresh cycle.
   * - Fetches all projects from the DB
   * - Collects GitHub features (stale groups only, from cache otherwise)
   * - Calculates scores and badges
   * - Persists results to the database
   * @param options  Optional PAT and progress callback
   * @returns        Array of ProjectRankingResult, sorted by score DESC
   */
  refreshRankings: (
    options?: CollectorOptions
  ) => Promise<ProjectRankingResult[]>;

  /** Whether a ranking refresh is currently in progress. */
  isRefreshing: boolean;

  /** Log messages from the collection and ranking process for UI display. */
  progress: string[];

  /** Results from the most recent successful refresh. null until first run. */
  results: ProjectRankingResult[] | null;

  /** Error message if the last refresh failed. null if no error. */
  error: string | null;

  /** Clear error state. */
  clearError: () => void;

  /** Clear the progress log. */
  clearProgress: () => void;
}

export function useRanking(): UseRankingReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [results, setResults] = useState<ProjectRankingResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addProgress = useCallback((message: string) => {
    setProgress((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  }, []);

  const refreshRankings = useCallback(
    async (options?: CollectorOptions): Promise<ProjectRankingResult[]> => {
      if (isRefreshing) {
        throw new Error("A ranking refresh is already in progress.");
      }

      setIsRefreshing(true);
      setError(null);
      setProgress([]);

      try {
        // ── Step 1: Fetch all projects ────────────────────────────────────────
        addProgress("Fetching projects from database...");

        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const { data: projects }: { data: Project[] } = await response.json();

        if (!projects || projects.length === 0) {
          addProgress("No projects found. Nothing to rank.");
          return [];
        }

        addProgress(`Found ${projects.length} project(s) to rank.`);

        // ── Step 2: Create ranking snapshot ───────────────────────────────────
        //
        // new Date() is called ONCE here. This timestamp is passed to all
        // subsequent functions — never call new Date() inside the engine.

        const snapshotTime = new Date();
        const snapshot = createSnapshot(snapshotTime);

        addProgress(
          `Snapshot created: ${snapshotTime.toISOString()} | Window: ${snapshot.observationStart.toISOString().split("T")[0]} → ${snapshot.observationEnd.toISOString().split("T")[0]}`
        );

        // ── Step 3: Collect GitHub features ───────────────────────────────────
        addProgress("Starting GitHub data collection (cache-first)...");

        const progressAwareOptions: CollectorOptions = {
          ...options,
          onProgress: (msg: string) => {
            addProgress(msg);
            options?.onProgress?.(msg);
          },
        };

        const featureMap = await collectAllProjectFeatures(
          projects,
          snapshot,
          progressAwareOptions
        );

        if (featureMap.size === 0) {
          throw new Error(
            "Failed to collect features for any project. Check GitHub URL validity and network connection."
          );
        }

        addProgress(
          `Features collected for ${featureMap.size}/${projects.length} project(s).`
        );

        // ── Step 4: Calculate rankings ────────────────────────────────────────
        addProgress("Running ranking engine...");

        const rankingResults = calculateAllRankings(featureMap, snapshot);

        for (const result of rankingResults) {
          addProgress(
            `  ${result.repoKey}: score=${result.score}, badge=${result.badge}${result.isFork ? " (fork penalty applied)" : ""}`
          );
        }

        // ── Step 5: Persist to database ───────────────────────────────────────
        addProgress(
          `Persisting rankings for ${rankingResults.length} project(s)...`
        );

        const persistPayload = {
          results: rankingResults.map((r) => ({
            projectId: r.projectId,
            score: r.score,
            badge: r.badge,
          })),
        };

        const persistResponse = await fetch("/api/projects/rankings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(persistPayload),
        });

        if (!persistResponse.ok) {
          const errData = await persistResponse.json();
          throw new Error(
            `Failed to persist rankings: ${errData?.error ?? persistResponse.statusText}`
          );
        }

        const { updated } = await persistResponse.json();
        addProgress(`✓ Successfully persisted rankings for ${updated} project(s).`);

        setResults(rankingResults);
        return rankingResults;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error during ranking refresh";
        setError(message);
        addProgress(`ERROR: ${message}`);
        throw err;
      } finally {
        setIsRefreshing(false);
      }
    },
    [isRefreshing, addProgress]
  );

  const clearError = useCallback(() => setError(null), []);
  const clearProgress = useCallback(() => setProgress([]), []);

  return {
    refreshRankings,
    isRefreshing,
    progress,
    results,
    error,
    clearError,
    clearProgress,
  };
}
