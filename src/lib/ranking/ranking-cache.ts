/**
 * ranking-cache.ts
 *
 * Client-side IndexedDB cache for the OpenCircle ranking feature dataset.
 *
 * Each project's features are stored per-group (repository, activity, health,
 * community, releases), each with its own fetchedAt timestamp. This allows
 * selective refresh — only stale groups trigger a GitHub API call.
 *
 * Browser-only: this module must never be imported from server-side code.
 */

import type {
  CachedProjectData,
  FeatureGroup,
  FeatureGroupTimestamps,
  ProjectFeatures,
} from "./ranking-types";
import { CACHE_TTLS } from "./ranking-config";

const DB_NAME = "opencircle-ranking-cache";
const DB_VERSION = 1;
const STORE_FEATURES = "features";

// ─── IndexedDB Helpers ────────────────────────────────────────────────────────

/**
 * Open (or create) the IndexedDB database.
 * Called lazily — only when the cache is first accessed.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FEATURES)) {
        // keyPath: repoKey ("owner/repo")
        db.createObjectStore(STORE_FEATURES, { keyPath: "repoKey" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Wrap an IDB request in a Promise.
 */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve the cached data for a repository.
 *
 * @param repoKey  "owner/repo" identifier.
 * @returns        CachedProjectData if exists, null otherwise.
 */
export async function getCachedFeatures(
  repoKey: string
): Promise<CachedProjectData | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_FEATURES, "readonly");
  const store = tx.objectStore(STORE_FEATURES);
  const result = await promisifyRequest<CachedProjectData | undefined>(
    store.get(repoKey)
  );
  return result ?? null;
}

/**
 * Update the cached features for a specific feature group.
 *
 * Merges the new partial features into any existing cached data, and records
 * a fresh fetchedAt timestamp for the specified group.
 *
 * @param repoKey    "owner/repo" identifier.
 * @param partial    The new feature data for this group.
 * @param group      Which feature group this data belongs to.
 * @param fetchedAt  ISO 8601 timestamp of when the data was fetched.
 */
export async function setCachedFeatures(
  repoKey: string,
  partial: Partial<ProjectFeatures>,
  group: FeatureGroup,
  fetchedAt: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_FEATURES, "readwrite");
  const store = tx.objectStore(STORE_FEATURES);

  // Fetch existing record (may not exist yet)
  const existing = await promisifyRequest<CachedProjectData | undefined>(
    store.get(repoKey)
  );

  const updated: CachedProjectData = {
    repoKey,
    features: {
      ...(existing?.features ?? {}),
      ...partial,
    },
    timestamps: {
      ...(existing?.timestamps ?? {}),
      [group]: fetchedAt,
    } as FeatureGroupTimestamps,
  };

  await promisifyRequest(store.put(updated));
}

/**
 * Determine which feature groups are stale for a repository.
 *
 * A group is stale if:
 *   - It has never been fetched (no timestamp), OR
 *   - Its fetchedAt timestamp is older than the configured TTL.
 *
 * @param repoKey  "owner/repo" identifier.
 * @param now      Current time (pass new Date() from the orchestrator).
 * @returns        Array of FeatureGroup names that need refreshing.
 */
export async function getStaleGroups(
  repoKey: string,
  now: Date
): Promise<FeatureGroup[]> {
  const cached = await getCachedFeatures(repoKey);
  const timestamps = cached?.timestamps ?? {};

  const groups: FeatureGroup[] = [
    "repository",
    "activity",
    "health",
    "community",
    "releases",
  ];

  return groups.filter((group) => {
    const fetchedAtStr = timestamps[group];
    if (!fetchedAtStr) return true; // never fetched

    const fetchedAt = new Date(fetchedAtStr);
    const ttl = CACHE_TTLS[group];
    return now.getTime() - fetchedAt.getTime() > ttl;
  });
}

/**
 * Get all cached feature data as a map of repoKey → features.
 * Returns only records where all feature groups have been fetched.
 *
 * Used by the orchestrator to build the input for calculateAllRankings().
 */
export async function getAllCachedFeatures(): Promise<
  Map<string, Partial<ProjectFeatures>>
> {
  const db = await openDB();
  const tx = db.transaction(STORE_FEATURES, "readonly");
  const store = tx.objectStore(STORE_FEATURES);

  return new Promise((resolve, reject) => {
    const result = new Map<string, Partial<ProjectFeatures>>();
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const record = cursor.value as CachedProjectData;
        result.set(record.repoKey, record.features);
        cursor.continue();
      } else {
        resolve(result);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all cached data. Useful for forcing a full refresh.
 */
export async function clearCache(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_FEATURES, "readwrite");
  const store = tx.objectStore(STORE_FEATURES);
  await promisifyRequest(store.clear());
}

/**
 * Delete the cached data for a single repository.
 */
export async function clearCachedFeatures(repoKey: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_FEATURES, "readwrite");
  const store = tx.objectStore(STORE_FEATURES);
  await promisifyRequest(store.delete(repoKey));
}

/**
 * Return basic cache statistics for debugging.
 */
export async function getCacheStats(): Promise<{
  entries: number;
  groups: Record<string, string[]>; // repoKey → fetched groups
}> {
  const db = await openDB();
  const tx = db.transaction(STORE_FEATURES, "readonly");
  const store = tx.objectStore(STORE_FEATURES);

  return new Promise((resolve, reject) => {
    const groups: Record<string, string[]> = {};
    let entries = 0;

    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const record = cursor.value as CachedProjectData;
        entries++;
        groups[record.repoKey] = Object.keys(record.timestamps ?? {});
        cursor.continue();
      } else {
        resolve({ entries, groups });
      }
    };

    request.onerror = () => reject(request.error);
  });
}
