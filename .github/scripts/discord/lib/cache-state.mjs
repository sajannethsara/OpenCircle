// .github/scripts/discord/lib/cache-state.mjs
//
// A tiny "latest write wins" state store built on top of GitHub Actions
// cache (@actions/cache). This is what lets push-debounce and the
// label/assignment digest remember things across otherwise-stateless
// workflow runs.
//
// How it works: cache entries are immutable once created, so we can't just
// "overwrite" a key. Instead every save() writes under a brand-new,
// timestamped key that shares a common prefix, and load() asks the cache
// service for the most recently created entry matching that prefix
// (restoreKeys does prefix matching and returns the newest match). This is
// a well-known pattern for using actions/cache as a lightweight KV store.
//
// This is deliberately "best effort": if a cache entry expires (unused for
// ~7 days) or two runs race, the worst case is an extra notification or a
// dropped queue entry — not a crash. That trade-off is intentional, since it
// avoids needing write access to the repo or any external service.

import { restoreCache, saveCache } from "@actions/cache";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const STATE_DIR = join(tmpdir(), "discord-notify-state");

function fileFor(prefix) {
  mkdirSync(STATE_DIR, { recursive: true });
  return join(STATE_DIR, `${sanitizePrefix(prefix)}.json`);
}

// Cache keys have restrictions on characters; keep them simple.
export function sanitizePrefix(str) {
  return String(str).replace(/[^a-zA-Z0-9._-]/g, "-");
}

/**
 * Load the most recently saved state for a prefix.
 * @returns {{ data: any, cacheKey: string | null }}
 */
export async function loadLatest(prefix, fallback) {
  const file = fileFor(prefix);
  const restoreKeys = [`${prefix}-`];
  let cacheKey = null;
  try {
    // The primary key intentionally never matches anything real — this
    // forces restoreCache to fall back to a prefix match via restoreKeys,
    // which returns the newest entry created with that prefix, if any.
    cacheKey = await restoreCache([file], `${prefix}-lookup-${Date.now()}`, restoreKeys);
  } catch (err) {
    console.warn(`[cache-state] restore failed for "${prefix}": ${err.message}`);
    return { data: fallback, cacheKey: null };
  }

  if (!cacheKey || !existsSync(file)) {
    return { data: fallback, cacheKey: null };
  }

  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    return { data, cacheKey };
  } catch {
    return { data: fallback, cacheKey };
  }
}

/**
 * Persist new state under a fresh key with the given prefix.
 * @returns {string} the new cache key
 */
export async function saveNew(prefix, data) {
  const file = fileFor(prefix);
  writeFileSync(file, JSON.stringify(data));
  const key = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await saveCache([file], key);
  } catch (err) {
    // Cache save can fail (e.g. rate limits, quota) — never let that crash
    // the notifier. Worst case: the next run just won't see this update.
    console.warn(`[cache-state] save failed for "${prefix}": ${err.message}`);
  }
  return key;
}
