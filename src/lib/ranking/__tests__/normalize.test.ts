/**
 * normalize.test.ts
 *
 * Tests for normalize.ts — the pluggable normalization entry point.
 * Covers all three strategies, recency scoring, and weighted average
 * with missing data redistribution.
 */

import { describe, it, expect } from "vitest";
import {
  normalize,
  calculateRecencyScore,
  weightedAverage,
  clamp,
  parseDate,
} from "../normalize";
import { PUSH_RECENCY_TIERS, MISSING_DATA_NEUTRAL_SCORE } from "../ranking-config";

// ─── normalize() — linear-ceiling strategy ────────────────────────────────────

describe("normalize() — linear-ceiling", () => {
  const cfg = { strategy: "linear-ceiling" as const, ceiling: 500 };

  it("ceiling value → 100", () => {
    expect(normalize(500, cfg)).toBe(100);
  });

  it("half ceiling → 50", () => {
    expect(normalize(250, cfg)).toBe(50);
  });

  it("zero → 0", () => {
    expect(normalize(0, cfg)).toBe(0);
  });

  it("negative → 0", () => {
    expect(normalize(-100, cfg)).toBe(0);
  });

  it("above ceiling → clamped to 100", () => {
    expect(normalize(1000, cfg)).toBe(100);
    expect(normalize(999999, cfg)).toBe(100);
  });

  it("ceiling = 0 → 0 (guard against bad config)", () => {
    expect(normalize(100, { strategy: "linear-ceiling", ceiling: 0 })).toBe(0);
  });

  it("result is always in [0, 100]", () => {
    for (const v of [-100, 0, 1, 100, 500, 1000, 1e9]) {
      const result = normalize(v, cfg);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    }
  });
});

// ─── normalize() — logarithmic strategy ──────────────────────────────────────

describe("normalize() — logarithmic", () => {
  const cfg = { strategy: "logarithmic" as const, ceiling: 500 };

  it("ceiling value → 100", () => {
    expect(normalize(500, cfg)).toBeCloseTo(100, 5);
  });

  it("zero → 0", () => {
    expect(normalize(0, cfg)).toBe(0);
  });

  it("above ceiling → clamped to 100", () => {
    expect(normalize(10000, cfg)).toBe(100);
  });

  it("result is always in [0, 100]", () => {
    for (const v of [0, 1, 100, 500, 10000]) {
      const result = normalize(v, cfg);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    }
  });
});

// ─── normalize() — sqrt strategy ─────────────────────────────────────────────

describe("normalize() — sqrt", () => {
  const cfg = { strategy: "sqrt" as const, ceiling: 100 };

  it("ceiling value → 100", () => {
    expect(normalize(100, cfg)).toBeCloseTo(100, 5);
  });

  it("zero → 0", () => {
    expect(normalize(0, cfg)).toBe(0);
  });

  it("above ceiling → clamped to 100", () => {
    expect(normalize(10000, cfg)).toBe(100);
  });
});

// ─── calculateRecencyScore() ─────────────────────────────────────────────────

describe("calculateRecencyScore()", () => {
  const snapshot = new Date("2026-08-26T12:00:00Z");

  function daysAgo(days: number): Date {
    return new Date(snapshot.getTime() - days * 24 * 60 * 60 * 1000);
  }

  it("null eventDate → null (metric unavailable)", () => {
    expect(calculateRecencyScore(null, snapshot, PUSH_RECENCY_TIERS)).toBeNull();
  });

  it("7 days ago → 100", () => {
    expect(calculateRecencyScore(daysAgo(7), snapshot, PUSH_RECENCY_TIERS)).toBe(100);
  });

  it("6 days ago → 100 (within ≤7 tier)", () => {
    expect(calculateRecencyScore(daysAgo(6), snapshot, PUSH_RECENCY_TIERS)).toBe(100);
  });

  it("30 days ago → 90", () => {
    expect(calculateRecencyScore(daysAgo(30), snapshot, PUSH_RECENCY_TIERS)).toBe(90);
  });

  it("8 days ago → 90 (crosses 7d boundary into ≤30d tier)", () => {
    expect(calculateRecencyScore(daysAgo(8), snapshot, PUSH_RECENCY_TIERS)).toBe(90);
  });

  it("90 days ago → 70", () => {
    expect(calculateRecencyScore(daysAgo(90), snapshot, PUSH_RECENCY_TIERS)).toBe(70);
  });

  it("31 days ago → 70 (crosses 30d boundary)", () => {
    expect(calculateRecencyScore(daysAgo(31), snapshot, PUSH_RECENCY_TIERS)).toBe(70);
  });

  it("180 days ago → 40", () => {
    expect(calculateRecencyScore(daysAgo(180), snapshot, PUSH_RECENCY_TIERS)).toBe(40);
  });

  it("365 days ago → 15", () => {
    expect(calculateRecencyScore(daysAgo(365), snapshot, PUSH_RECENCY_TIERS)).toBe(15);
  });

  it("366 days ago → 0", () => {
    expect(calculateRecencyScore(daysAgo(366), snapshot, PUSH_RECENCY_TIERS)).toBe(0);
  });

  it("1000 days ago → 0", () => {
    expect(calculateRecencyScore(daysAgo(1000), snapshot, PUSH_RECENCY_TIERS)).toBe(0);
  });
});

// ─── weightedAverage() ───────────────────────────────────────────────────────

describe("weightedAverage()", () => {
  it("all scores available — standard weighted average", () => {
    const result = weightedAverage([
      { score: 80, weight: 0.40 },
      { score: 60, weight: 0.40 },
      { score: 40, weight: 0.20 },
    ]);
    // 80×0.40 + 60×0.40 + 40×0.20 = 32 + 24 + 8 = 64
    expect(result).toBeCloseTo(64, 5);
  });

  it("one score null — weight redistributed to remaining two", () => {
    const result = weightedAverage([
      { score: null, weight: 0.40 },
      { score: 80, weight: 0.40 },
      { score: 60, weight: 0.20 },
    ]);
    // available weight = 0.40 + 0.20 = 0.60
    // 80 × (0.40/0.60) + 60 × (0.20/0.60)
    // = 80 × 0.6667 + 60 × 0.3333
    // = 53.33 + 20.00 = 73.33
    expect(result).toBeCloseTo(73.33, 1);
  });

  it("all scores null → returns MISSING_DATA_NEUTRAL_SCORE (50)", () => {
    const result = weightedAverage([
      { score: null, weight: 0.60 },
      { score: null, weight: 0.40 },
    ]);
    expect(result).toBe(MISSING_DATA_NEUTRAL_SCORE);
  });

  it("single available score → returns that score", () => {
    const result = weightedAverage([
      { score: null, weight: 0.50 },
      { score: 75, weight: 0.50 },
    ]);
    expect(result).toBe(75);
  });

  it("all scores 100 → returns 100", () => {
    const result = weightedAverage([
      { score: 100, weight: 0.50 },
      { score: 100, weight: 0.50 },
    ]);
    expect(result).toBeCloseTo(100, 5);
  });

  it("all scores 0 → returns 0", () => {
    const result = weightedAverage([
      { score: 0, weight: 0.50 },
      { score: 0, weight: 0.50 },
    ]);
    expect(result).toBe(0);
  });

  it("result is always in [0, 100]", () => {
    const result = weightedAverage([
      { score: 100, weight: 0.70 },
      { score: 100, weight: 0.30 },
    ]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

// ─── clamp() ─────────────────────────────────────────────────────────────────

describe("clamp()", () => {
  it("clamps below min", () => expect(clamp(-10, 0, 100)).toBe(0));
  it("clamps above max", () => expect(clamp(150, 0, 100)).toBe(100));
  it("passes through in range", () => expect(clamp(50, 0, 100)).toBe(50));
  it("passes through at min", () => expect(clamp(0, 0, 100)).toBe(0));
  it("passes through at max", () => expect(clamp(100, 0, 100)).toBe(100));
});

// ─── parseDate() ─────────────────────────────────────────────────────────────

describe("parseDate()", () => {
  it("valid ISO 8601 → Date object", () => {
    const d = parseDate("2026-08-26T12:00:00Z");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
  });

  it("null → null", () => expect(parseDate(null)).toBeNull());
  it("empty string → null", () => expect(parseDate("")).toBeNull());
  it("undefined → null", () => expect(parseDate(undefined)).toBeNull());
  it("invalid string → null", () => expect(parseDate("not-a-date")).toBeNull());
});
