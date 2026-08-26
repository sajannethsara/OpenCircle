/**
 * ranking-config.test.ts
 *
 * Validates the structural integrity of ranking-config.ts constants.
 * These tests ensure weights, thresholds, and TTLs are mathematically correct
 * before any scoring code runs.
 */

import { describe, it, expect } from "vitest";
import {
  CATEGORY_WEIGHTS,
  POPULARITY_WEIGHTS,
  ACTIVITY_WEIGHTS,
  HEALTH_WEIGHTS,
  COMMUNITY_WEIGHTS,
  RELEASE_WEIGHTS,
  BADGE_THRESHOLDS,
  SCORING_CEILINGS,
  CACHE_TTLS,
  PUSH_RECENCY_TIERS,
  RELEASE_RECENCY_TIERS,
  FORK_SCORE_PENALTY,
  MISSING_DATA_NEUTRAL_SCORE,
} from "../ranking-config";

// ─── Category Weights ─────────────────────────────────────────────────────────

describe("CATEGORY_WEIGHTS", () => {
  it("sum to exactly 1.0", () => {
    const total = Object.values(CATEGORY_WEIGHTS).reduce(
      (sum, w) => sum + w,
      0
    );
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("all weights are positive", () => {
    for (const [key, weight] of Object.entries(CATEGORY_WEIGHTS)) {
      expect(weight, `${key} weight`).toBeGreaterThan(0);
    }
  });
});

// ─── Sub-Category Weights ─────────────────────────────────────────────────────

describe("Sub-category weight groups each sum to 1.0", () => {
  it("POPULARITY_WEIGHTS", () => {
    const total = Object.values(POPULARITY_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("ACTIVITY_WEIGHTS", () => {
    const total = Object.values(ACTIVITY_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("HEALTH_WEIGHTS", () => {
    const total = Object.values(HEALTH_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("COMMUNITY_WEIGHTS", () => {
    const total = Object.values(COMMUNITY_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("RELEASE_WEIGHTS", () => {
    const total = Object.values(RELEASE_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });
});

// ─── Badge Thresholds ─────────────────────────────────────────────────────────

describe("BADGE_THRESHOLDS", () => {
  it("has exactly 8 tiers", () => {
    expect(BADGE_THRESHOLDS).toHaveLength(8);
  });

  it("starts at 0", () => {
    expect(BADGE_THRESHOLDS[0].min).toBe(0);
  });

  it("ends at 100", () => {
    expect(BADGE_THRESHOLDS[BADGE_THRESHOLDS.length - 1].max).toBe(100);
  });

  it("has no gaps between tiers", () => {
    for (let i = 1; i < BADGE_THRESHOLDS.length; i++) {
      const prev = BADGE_THRESHOLDS[i - 1];
      const curr = BADGE_THRESHOLDS[i];
      expect(curr.min, `gap before tier ${i}`).toBe(prev.max + 1);
    }
  });

  it("has no overlapping tiers", () => {
    for (let i = 1; i < BADGE_THRESHOLDS.length; i++) {
      const prev = BADGE_THRESHOLDS[i - 1];
      const curr = BADGE_THRESHOLDS[i];
      expect(curr.min, `overlap at tier ${i}`).toBeGreaterThan(prev.max);
    }
  });

  it("all min ≤ max", () => {
    for (const tier of BADGE_THRESHOLDS) {
      expect(tier.min).toBeLessThanOrEqual(tier.max);
    }
  });

  it("contains all 8 expected badge names", () => {
    const badges = BADGE_THRESHOLDS.map((t) => t.badge);
    expect(badges).toContain("warrior");
    expect(badges).toContain("elite");
    expect(badges).toContain("master");
    expect(badges).toContain("grandmaster");
    expect(badges).toContain("epic");
    expect(badges).toContain("legend");
    expect(badges).toContain("mythic");
    expect(badges).toContain("mythicalglory");
  });
});

// ─── Scoring Ceilings ─────────────────────────────────────────────────────────

describe("SCORING_CEILINGS", () => {
  it("all ceilings are positive numbers", () => {
    for (const [key, ceiling] of Object.entries(SCORING_CEILINGS)) {
      expect(ceiling, `${key} ceiling`).toBeGreaterThan(0);
      expect(Number.isFinite(ceiling), `${key} is finite`).toBe(true);
    }
  });
});

// ─── Cache TTLs ───────────────────────────────────────────────────────────────

describe("CACHE_TTLS", () => {
  it("all TTLs are positive numbers (in milliseconds)", () => {
    for (const [key, ttl] of Object.entries(CACHE_TTLS)) {
      expect(ttl, `${key} TTL`).toBeGreaterThan(0);
      expect(Number.isFinite(ttl), `${key} is finite`).toBe(true);
    }
  });

  it("activity TTL ≤ health TTL (activity data changes faster)", () => {
    expect(CACHE_TTLS.activity).toBeLessThanOrEqual(CACHE_TTLS.health);
  });
});

// ─── Recency Tiers ────────────────────────────────────────────────────────────

describe("PUSH_RECENCY_TIERS", () => {
  it("are sorted ascending by maxDays", () => {
    for (let i = 1; i < PUSH_RECENCY_TIERS.length; i++) {
      expect(PUSH_RECENCY_TIERS[i].maxDays).toBeGreaterThan(
        PUSH_RECENCY_TIERS[i - 1].maxDays
      );
    }
  });

  it("last tier has maxDays = Infinity", () => {
    const last = PUSH_RECENCY_TIERS[PUSH_RECENCY_TIERS.length - 1];
    expect(last.maxDays).toBe(Infinity);
  });

  it("all scores are in [0, 100]", () => {
    for (const tier of PUSH_RECENCY_TIERS) {
      expect(tier.score).toBeGreaterThanOrEqual(0);
      expect(tier.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("RELEASE_RECENCY_TIERS", () => {
  it("are sorted ascending by maxDays", () => {
    for (let i = 1; i < RELEASE_RECENCY_TIERS.length; i++) {
      expect(RELEASE_RECENCY_TIERS[i].maxDays).toBeGreaterThan(
        RELEASE_RECENCY_TIERS[i - 1].maxDays
      );
    }
  });

  it("last tier has maxDays = Infinity", () => {
    const last = RELEASE_RECENCY_TIERS[RELEASE_RECENCY_TIERS.length - 1];
    expect(last.maxDays).toBe(Infinity);
  });
});

// ─── Misc Constants ───────────────────────────────────────────────────────────

describe("FORK_SCORE_PENALTY", () => {
  it("is between 0 and 1 (exclusive)", () => {
    expect(FORK_SCORE_PENALTY).toBeGreaterThan(0);
    expect(FORK_SCORE_PENALTY).toBeLessThan(1);
  });
});

describe("MISSING_DATA_NEUTRAL_SCORE", () => {
  it("is 50 (midpoint)", () => {
    expect(MISSING_DATA_NEUTRAL_SCORE).toBe(50);
  });
});
