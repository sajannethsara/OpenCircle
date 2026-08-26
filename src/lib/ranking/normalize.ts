/**
 * normalize.ts
 *
 * The single normalization entry point for the OpenCircle ranking engine.
 *
 * All scoring functions in ranking-engine.ts call these helpers instead of
 * inlining arithmetic. This means switching normalization strategy later
 * requires changing one constant in ranking-config.ts — zero engine changes.
 */

import type { NormalizationConfig, RecencyTier } from "./ranking-types";
import { MISSING_DATA_NEUTRAL_SCORE } from "./ranking-config";

// ─── Core Normalization ───────────────────────────────────────────────────────

/**
 * Normalize a raw metric value to the range [0, 100] using the configured strategy.
 *
 * Rules:
 *   - value ≤ 0        → 0
 *   - ceiling ≤ 0      → 0  (guard against bad config)
 *   - result is always clamped to [0, 100]
 *
 * @param value   The raw metric value (e.g. star count, commit count).
 * @param config  Normalization strategy and ceiling from ranking-config.ts.
 * @returns       A score in [0, 100].
 */
export function normalize(value: number, config: NormalizationConfig): number {
  if (value <= 0) return 0;
  if (config.ceiling <= 0) return 0;

  let raw: number;

  switch (config.strategy) {
    case "linear-ceiling":
      // v1 default: simple linear scale, capped at ceiling
      // score = 100 × value / ceiling
      raw = (100 * value) / config.ceiling;
      break;

    case "logarithmic":
      // Compresses outliers — useful when one project has 100× more activity
      // than others but shouldn't score 100× higher.
      // score = 100 × log(1 + value) / log(1 + ceiling)
      raw = (100 * Math.log(1 + value)) / Math.log(1 + config.ceiling);
      break;

    case "sqrt":
      // Moderate outlier compression — between linear and logarithmic.
      // score = 100 × √value / √ceiling
      raw = (100 * Math.sqrt(value)) / Math.sqrt(config.ceiling);
      break;

    default: {
      // Exhaustive check — TypeScript should catch unknown strategies,
      // but provide a safe runtime fallback.
      const _exhaustive: never = config.strategy;
      void _exhaustive;
      raw = (100 * value) / config.ceiling;
    }
  }

  return clamp(raw, 0, 100);
}

// ─── Recency Scoring ─────────────────────────────────────────────────────────

/**
 * Score a recency event (last push, latest release) using a piecewise tier table.
 *
 * IMPORTANT: Always pass `snapshotTime`, never `new Date()`, so that
 * rankings are reproducible for a given snapshot.
 *
 * @param eventDate     The timestamp of the event (push, release, etc.).
 * @param snapshotTime  The ranking snapshot time — use this as "now".
 * @param tiers         Piecewise tier table (must be sorted ascending by maxDays).
 * @returns             A score in [0, 100], or null if eventDate is null.
 *                      null signals "metric unavailable" (not zero activity).
 */
export function calculateRecencyScore(
  eventDate: Date | null,
  snapshotTime: Date,
  tiers: RecencyTier[]
): number | null {
  if (eventDate === null) return null;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSince = (snapshotTime.getTime() - eventDate.getTime()) / msPerDay;

  // Walk tiers in order; return the score for the first tier that applies.
  for (const tier of tiers) {
    if (daysSince <= tier.maxDays) {
      return tier.score;
    }
  }

  // Fallback: older than every tier → 0
  return 0;
}

// ─── Weighted Average with Missing Data Redistribution ───────────────────────

/**
 * Compute a weighted average from a set of scored items, some of which
 * may be null (metric unavailable).
 *
 * Missing data policy:
 *   - null means "metric unavailable — exclude from calculation"
 *   - The null item's weight is redistributed proportionally among available items
 *   - If ALL items are null, returns MISSING_DATA_NEUTRAL_SCORE (50)
 *     to avoid unfairly penalizing projects with sparse GitHub data
 *
 * @param items  Array of { score: number | null, weight: number }.
 * @returns      A score in [0, 100].
 *
 * @example
 *   // Issue score null, PR merge rate 80, maintenance 60:
 *   weightedAverage([
 *     { score: null, weight: 0.40 },
 *     { score: 80,   weight: 0.40 },
 *     { score: 60,   weight: 0.20 },
 *   ])
 *   // available weight total = 0.40 + 0.20 = 0.60
 *   // redistributed: 80 × (0.40/0.60) + 60 × (0.20/0.60)
 *   //              = 80 × 0.667 + 60 × 0.333
 *   //              = 53.33 + 20 = 73.33
 */
export function weightedAverage(
  items: Array<{ score: number | null; weight: number }>
): number {
  const available = items.filter(
    (item): item is { score: number; weight: number } => item.score !== null
  );

  if (available.length === 0) {
    return MISSING_DATA_NEUTRAL_SCORE;
  }

  const totalAvailableWeight = available.reduce((sum, i) => sum + i.weight, 0);

  if (totalAvailableWeight === 0) {
    return MISSING_DATA_NEUTRAL_SCORE;
  }

  const result = available.reduce(
    (sum, item) => sum + item.score * (item.weight / totalAvailableWeight),
    0
  );

  return clamp(result, 0, 100);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Clamp a value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parse an ISO 8601 date string into a Date object.
 * Returns null if the string is null, empty, or invalid.
 */
export function parseDate(isoString: string | null | undefined): Date | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return d;
}
