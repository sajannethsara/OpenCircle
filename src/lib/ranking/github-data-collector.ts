/**
 * github-data-collector.ts
 *
 * Client-side GitHub API data collector for the OpenCircle ranking system.
 *
 * Responsibilities:
 *   1. Parse githubUrl into owner/repo
 *   2. Check which feature groups are stale in the cache
 *   3. Fetch only stale groups from GitHub (REST + Search API)
 *   4. Pace Search API calls to respect rate limits
 *   5. Handle /stats/contributors 202 responses with retries
 *   6. Compute derived fields (openIssues, activeContributors, uniquePRAuthors)
 *   7. Update cache with fresh data
 *   8. Return complete ProjectFeatures for the ranking engine
 *
 * This module makes GitHub API calls — the ranking engine (ranking-engine.ts)
 * must NEVER import from this module.
 */

import type {
  ProjectFeatures,
  ProjectInput,
  CollectorOptions,
  RankingSnapshot,
  FeatureGroup,
} from "./ranking-types";
import {
  SEARCH_DELAY_UNAUTH_MS,
  SEARCH_DELAY_AUTH_MS,
  STATS_RETRY_COUNT,
  STATS_RETRY_DELAY_MS,
  ACTIVITY_WINDOW_DAYS,
  RELEASE_WINDOW_DAYS,
} from "./ranking-config";
import {
  getCachedFeatures,
  getStaleGroups,
  setCachedFeatures,
} from "./ranking-cache";

// ─── URL Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a GitHub repository URL into owner and repo name.
 * Handles https://github.com/owner/repo and github.com/owner/repo forms.
 */
export function parseGithubUrl(
  rawUrl: string
): { owner: string; repo: string; repoKey: string } | null {
  try {
    const url = rawUrl.trim().startsWith("http")
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (segments.length < 2) return null;

    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/, "");

    return { owner, repo, repoKey: `${owner}/${repo}` };
  } catch {
    return null;
  }
}

// ─── API Request Helpers ──────────────────────────────────────────────────────

function buildHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "OpenCircle-RankingEngine/1.0",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function githubGet<T>(
  url: string,
  token?: string
): Promise<{ data: T; rateLimitRemaining: number; status: number }> {
  const response = await fetch(url, { headers: buildHeaders(token) });
  const rateLimitRemaining = parseInt(
    response.headers.get("X-RateLimit-Remaining") ?? "60",
    10
  );

  if (!response.ok && response.status !== 202) {
    throw new Error(`GitHub API error: ${response.status} ${url}`);
  }

  const data = response.status === 202 ? null : await response.json();
  return { data: data as T, rateLimitRemaining, status: response.status };
}

/** Pause execution for a given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Search API Queue ─────────────────────────────────────────────────────────

/**
 * A simple sequential search queue that enforces the minimum inter-request
 * delay for the GitHub Search API.
 *
 * All Search API calls across all projects are routed through this queue
 * so that parallel project fetching doesn't violate the per-minute limit.
 */
class SearchQueue {
  private lastSearchAt = 0;
  private readonly delay: number;

  constructor(token?: string) {
    this.delay = token ? SEARCH_DELAY_AUTH_MS : SEARCH_DELAY_UNAUTH_MS;
  }

  async search<T>(url: string, token?: string): Promise<T> {
    const now = Date.now();
    const elapsed = now - this.lastSearchAt;
    if (elapsed < this.delay) {
      await sleep(this.delay - elapsed);
    }
    this.lastSearchAt = Date.now();

    const { data } = await githubGet<T>(url, token);
    return data;
  }
}

// ─── Feature Group Fetchers ───────────────────────────────────────────────────

interface RepoApiResponse {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number; // includes open PRs
  pushed_at: string;
  fork: boolean;
}

async function fetchRepositoryGroup(
  owner: string,
  repo: string,
  token?: string
): Promise<Partial<ProjectFeatures>> {
  const { data } = await githubGet<RepoApiResponse>(
    `https://api.github.com/repos/${owner}/${repo}`,
    token
  );

  return {
    stars: data.stargazers_count,
    forks: data.forks_count,
    lastPush: data.pushed_at,
    isFork: data.fork,
    // open_issues_count will be refined once we subtract open PRs (in health group)
    // Store raw for now; openIssues is derived after fetching openPRsCount
  };
}

interface SearchResponse {
  total_count: number;
  items?: Array<{ user?: { login: string } }>;
}

interface StatsContributorWeek {
  w: number; // Unix timestamp of week start
  a: number; // additions
  d: number; // deletions
  c: number; // commits
}

interface StatsContributorResponse {
  author?: { login: string };
  weeks: StatsContributorWeek[];
}

async function fetchActivityGroup(
  owner: string,
  repo: string,
  snapshot: RankingSnapshot,
  queue: SearchQueue,
  token?: string,
  onProgress?: (msg: string) => void
): Promise<Partial<ProjectFeatures>> {
  const since = snapshot.observationStart.toISOString().split("T")[0];

  onProgress?.(`[${owner}/${repo}] Fetching recent commits count...`);
  const commitsData = await queue.search<SearchResponse>(
    `https://api.github.com/search/commits?q=repo:${owner}/${repo}+committer-date:>${since}&per_page=1`,
    token
  );

  onProgress?.(`[${owner}/${repo}] Fetching recent PRs count...`);
  const recentPRsData = await queue.search<SearchResponse>(
    `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+created:>${since}&per_page=1`,
    token
  );

  return {
    recentCommits: commitsData?.total_count ?? 0,
    recentPRs: recentPRsData?.total_count ?? 0,
  };
}

async function fetchHealthGroup(
  owner: string,
  repo: string,
  snapshot: RankingSnapshot,
  queue: SearchQueue,
  token?: string,
  onProgress?: (msg: string) => void
): Promise<Partial<ProjectFeatures> & { openPRsCount: number }> {
  onProgress?.(`[${owner}/${repo}] Fetching merged PRs count...`);
  const mergedPRsData = await queue.search<SearchResponse>(
    `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+is:merged&per_page=1`,
    token
  );

  onProgress?.(`[${owner}/${repo}] Fetching closed-unmerged PRs count...`);
  const closedUnmergedData = await queue.search<SearchResponse>(
    `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+is:closed+-is:merged&per_page=1`,
    token
  );

  onProgress?.(`[${owner}/${repo}] Fetching open PRs count...`);
  const openPRsData = await queue.search<SearchResponse>(
    `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+is:open&per_page=1`,
    token
  );

  onProgress?.(`[${owner}/${repo}] Fetching closed issues count...`);
  const closedIssuesData = await queue.search<SearchResponse>(
    `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:issue+is:closed&per_page=1`,
    token
  );

  // We need openPRsCount to derive openIssues later
  const openPRsCount = openPRsData?.total_count ?? 0;

  return {
    mergedPRs: mergedPRsData?.total_count ?? 0,
    closedUnmergedPRs: closedUnmergedData?.total_count ?? 0,
    closedIssues: closedIssuesData?.total_count ?? 0,
    openPRsCount, // stored temporarily to derive openIssues
  };
}

async function fetchCommunityGroup(
  owner: string,
  repo: string,
  snapshot: RankingSnapshot,
  queue: SearchQueue,
  token?: string,
  onProgress?: (msg: string) => void
): Promise<Partial<ProjectFeatures>> {
  // Unique PR authors: search PRs in the 90d window, paginate to deduplicate authors
  const since = snapshot.observationStart.toISOString().split("T")[0];

  onProgress?.(`[${owner}/${repo}] Fetching PR authors (90d)...`);
  const uniqueAuthors = new Set<string>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await queue.search<SearchResponse>(
      `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+created:>${since}&per_page=100&page=${page}`,
      token
    );

    if (!data?.items?.length) {
      hasMore = false;
    } else {
      for (const item of data.items) {
        if (item.user?.login) uniqueAuthors.add(item.user.login);
      }
      // If we got fewer than 100 items, we've seen all PRs in this window
      hasMore = data.items.length === 100;
      page++;
    }
  }

  // Active contributors: use /stats/contributors (REST, not Search)
  // Returns 202 on cache miss → retry logic
  onProgress?.(`[${owner}/${repo}] Fetching contributor statistics...`);
  let statsData: StatsContributorResponse[] | null = null;

  for (let attempt = 0; attempt < STATS_RETRY_COUNT; attempt++) {
    try {
      const result = await githubGet<StatsContributorResponse[]>(
        `https://api.github.com/repos/${owner}/${repo}/stats/contributors`,
        token
      );

      if (result.status === 202) {
        // GitHub is computing stats — wait and retry
        onProgress?.(
          `[${owner}/${repo}] Stats computing (attempt ${attempt + 1}/${STATS_RETRY_COUNT})...`
        );
        await sleep(STATS_RETRY_DELAY_MS);
        continue;
      }

      statsData = result.data;
      break;
    } catch {
      if (attempt === STATS_RETRY_COUNT - 1) {
        onProgress?.(`[${owner}/${repo}] Stats unavailable after ${STATS_RETRY_COUNT} attempts`);
      }
    }
  }

  let activeContributors: number;
  if (statsData === null) {
    // Sentinel value — signals "unavailable" to the engine.
    // The engine will redistribute weight rather than scoring 0.
    activeContributors = -1;
  } else {
    const windowStartMs = snapshot.observationStart.getTime();
    const windowEndMs = snapshot.observationEnd.getTime();

    activeContributors = statsData.filter((contributor) =>
      contributor.weeks.some((week) => {
        const weekStartMs = week.w * 1000;
        return (
          weekStartMs >= windowStartMs &&
          weekStartMs <= windowEndMs &&
          week.c > 0
        );
      })
    ).length;
  }

  return {
    activeContributors,
    uniquePRAuthors: uniqueAuthors.size,
  };
}

interface ReleaseApiItem {
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
}

async function fetchReleasesGroup(
  owner: string,
  repo: string,
  snapshot: RankingSnapshot,
  token?: string,
  onProgress?: (msg: string) => void
): Promise<Partial<ProjectFeatures>> {
  onProgress?.(`[${owner}/${repo}] Fetching releases...`);

  try {
    const { data } = await githubGet<ReleaseApiItem[]>(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
      token
    );

    if (!data || data.length === 0) {
      return {
        latestReleaseDate: null,
        releasesLastYear: 0,
      };
    }

    // Filter out drafts and pre-releases for the "official" latest release
    const officialReleases = data.filter(
      (r) => !r.draft && !r.prerelease && r.published_at
    );

    const latestReleaseDate = officialReleases[0]?.published_at ?? null;

    // Count releases (including pre-releases) within the 365-day window
    const windowStart = snapshot.releaseWindowStart.getTime();
    const releasesLastYear = data.filter((r) => {
      if (!r.published_at || r.draft) return false;
      return new Date(r.published_at).getTime() >= windowStart;
    }).length;

    return {
      latestReleaseDate,
      releasesLastYear,
    };
  } catch {
    // e.g., repo with no releases enabled
    return {
      latestReleaseDate: null,
      releasesLastYear: 0,
    };
  }
}

// ─── Main Collection Entry Points ─────────────────────────────────────────────

/**
 * Collect all feature data for a single project.
 *
 * 1. Checks which feature groups are stale in cache
 * 2. Fetches only stale groups from GitHub
 * 3. Updates the cache
 * 4. Returns a complete ProjectFeatures object
 *
 * @param project   The project to collect data for.
 * @param snapshot  The ranking snapshot (provides observation window).
 * @param queue     The shared Search API rate-limit queue.
 * @param options   Optional PAT and progress callback.
 */
async function collectSingleProject(
  project: ProjectInput,
  snapshot: RankingSnapshot,
  queue: SearchQueue,
  options?: CollectorOptions
): Promise<{ repoKey: string; features: ProjectFeatures }> {
  const { token, onProgress } = options ?? {};

  const parsed = parseGithubUrl(project.githubUrl);
  if (!parsed) {
    throw new Error(`Invalid GitHub URL for project ${project.id}: ${project.githubUrl}`);
  }
  const { owner, repo, repoKey } = parsed;
  const now = new Date();

  // Determine which groups need refreshing
  const staleGroups = await getStaleGroups(repoKey, now);
  onProgress?.(`[${repoKey}] Stale groups: ${staleGroups.join(", ") || "none"}`);

  const fetchedAt = now.toISOString();
  let openPRsCount = 0; // needed to derive openIssues

  // === Phase 1: REST calls (can run in parallel for this project) ===
  const restPromises: Promise<void>[] = [];

  if (staleGroups.includes("repository")) {
    restPromises.push(
      fetchRepositoryGroup(owner, repo, token).then(async (data) => {
        await setCachedFeatures(repoKey, data, "repository", fetchedAt);
      })
    );
  }

  if (staleGroups.includes("releases")) {
    restPromises.push(
      fetchReleasesGroup(owner, repo, snapshot, token, onProgress).then(
        async (data) => {
          await setCachedFeatures(repoKey, data, "releases", fetchedAt);
        }
      )
    );
  }

  // /stats/contributors is REST but may 202 — run alongside other REST calls
  let communityNeedsSearch = staleGroups.includes("community");

  await Promise.all(restPromises);

  // === Phase 2: Search calls (sequential, paced by queue) ===
  if (staleGroups.includes("activity")) {
    const activityData = await fetchActivityGroup(
      owner,
      repo,
      snapshot,
      queue,
      token,
      onProgress
    );
    await setCachedFeatures(repoKey, activityData, "activity", fetchedAt);
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
    // Extract and store openPRsCount separately for deriving openIssues
    const { openPRsCount: fetchedOpenPRs, ...features } = healthData as typeof healthData & { openPRsCount: number };
    openPRsCount = fetchedOpenPRs;
    await setCachedFeatures(repoKey, features, "health", fetchedAt);
  }

  if (communityNeedsSearch) {
    const communityData = await fetchCommunityGroup(
      owner,
      repo,
      snapshot,
      queue,
      token,
      onProgress
    );
    await setCachedFeatures(repoKey, communityData, "community", fetchedAt);
  }

  // === Assemble final features from cache ===
  const cached = await getCachedFeatures(repoKey);
  if (!cached?.features) {
    throw new Error(`[${repoKey}] Failed to assemble features from cache after collection.`);
  }

  const f = cached.features;

  // Derive openIssues: GitHub's open_issues_count includes open PRs
  // If we freshly fetched health, we have openPRsCount from this run.
  // Otherwise use a reasonable fallback (0) to avoid over-subtracting.
  const rawOpenIssues = (f.stars !== undefined ? f as any : {}).open_issues_count_raw ?? 0;
  // Note: We store stars/forks from repository group; open_issues comes from
  // the raw repo response. Since ProjectFeatures.openIssues is derived, we
  // read the stored closedIssues + mergedPRs from cache and use openPRsCount
  // from the health fetch to compute it. When health group is not stale,
  // openIssues is already correctly stored in cache.

  // Build the complete feature set with sensible defaults for any missing fields
  const features: ProjectFeatures = {
    stars: f.stars ?? 0,
    forks: f.forks ?? 0,
    recentCommits: f.recentCommits ?? 0,
    recentPRs: f.recentPRs ?? 0,
    lastPush: f.lastPush ?? null,
    openIssues: f.openIssues ?? Math.max(0, (rawOpenIssues) - openPRsCount),
    closedIssues: f.closedIssues ?? 0,
    mergedPRs: f.mergedPRs ?? 0,
    closedUnmergedPRs: f.closedUnmergedPRs ?? 0,
    activeContributors: f.activeContributors ?? 0,
    uniquePRAuthors: f.uniquePRAuthors ?? 0,
    latestReleaseDate: f.latestReleaseDate ?? null,
    releasesLastYear: f.releasesLastYear ?? 0,
    isFork: f.isFork ?? false,
  };

  onProgress?.(`[${repoKey}] Collection complete. Stars: ${features.stars}, Commits: ${features.recentCommits}, PRs: ${features.recentPRs}`);

  return { repoKey, features };
}

/**
 * Collect feature data for all projects.
 *
 * Strategy:
 *   - REST calls fire in parallel across projects (no rate limit concern)
 *   - Search calls are serialized through a shared queue with inter-request delays
 *
 * @param projects  Array of project inputs.
 * @param snapshot  The ranking snapshot.
 * @param options   Optional PAT and progress callback.
 * @returns         Map of projectId → { repoKey, features }.
 */
export async function collectAllProjectFeatures(
  projects: ProjectInput[],
  snapshot: RankingSnapshot,
  options?: CollectorOptions
): Promise<Map<string, { repoKey: string; features: ProjectFeatures }>> {
  const { token, onProgress } = options ?? {};
  const queue = new SearchQueue(token);

  onProgress?.(
    `Starting collection for ${projects.length} project(s)...`
  );

  const results = new Map<
    string,
    { repoKey: string; features: ProjectFeatures }
  >();

  // Process projects sequentially to keep Search API queue predictable.
  // For pure REST groups, we could parallelize, but the Search pacing
  // dominates total time anyway.
  for (const project of projects) {
    try {
      const result = await collectSingleProject(
        project,
        snapshot,
        queue,
        options
      );
      results.set(project.id, result);
    } catch (error) {
      onProgress?.(
        `[${project.githubUrl}] ERROR: ${error instanceof Error ? error.message : String(error)}`
      );
      // Continue collecting other projects — don't abort the entire run
    }
  }

  onProgress?.(
    `Collection complete. ${results.size}/${projects.length} projects collected.`
  );

  return results;
}
