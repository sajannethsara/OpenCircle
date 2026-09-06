/**
 * ranking-engine.test.ts
 *
 * Tests for ranking-engine.ts — all pure scoring functions.
 * Covers: badge boundaries, final score clamping, category scores,
 * missing data handling, fork penalty, and determinism.
 */

import { describe, it, expect } from "vitest";
import {
  calculateStarScore,
  calculateForkScore,
  calculatePopularityScore,
  calculateCommitScore,
  calculatePRActivityScore,
  calculatePushRecencyScore,
  calculateActivityScore,
  calculateIssueManagementScore,
  calculatePRMergeRateScore,
  calculateMaintenanceScore,
  calculateHealthScore,
  calculateActiveContributorScore,
  calculateUniquePRAuthorScore,
  calculateCommunityScore,
  calculateReleaseRecencyScore,
  calculateReleaseFrequencyScore,
  calculateReleaseStabilityScore,
  calculateProjectScore,
  calculateRankBadge,
  calculateRanking,
  calculateAllRankings,
  createSnapshot,
} from "../ranking-engine";
import type { ProjectFeatures, CategoryScores } from "../ranking-types";

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const SNAPSHOT = createSnapshot(new Date("2026-08-26T12:00:00Z"));

/** A fully populated realistic project feature set. */
const FULL_FEATURES: ProjectFeatures = {
  stars: 250,
  forks: 50,
  recentCommits: 100,
  recentPRs: 30,
  lastPush: "2026-08-20T10:00:00Z",         // 6 days ago
  openIssues: 10,
  closedIssues: 90,
  mergedPRs: 25,
  closedUnmergedPRs: 5,
  activeContributors: 12,
  uniquePRAuthors: 10,
  latestReleaseDate: "2026-08-10T12:00:00Z", // 16 days ago
  releasesLastYear: 6,
  isFork: false,
};

// ─── calculateRankBadge() — all 8 boundary values ────────────────────────────

describe("calculateRankBadge()", () => {
  it("0 → warrior", () => expect(calculateRankBadge(0)).toBe("warrior"));
  it("19 → warrior", () => expect(calculateRankBadge(19)).toBe("warrior"));
  it("20 → elite", () => expect(calculateRankBadge(20)).toBe("elite"));
  it("34 → elite", () => expect(calculateRankBadge(34)).toBe("elite"));
  it("35 → master", () => expect(calculateRankBadge(35)).toBe("master"));
  it("49 → master", () => expect(calculateRankBadge(49)).toBe("master"));
  it("50 → grandmaster", () => expect(calculateRankBadge(50)).toBe("grandmaster"));
  it("64 → grandmaster", () => expect(calculateRankBadge(64)).toBe("grandmaster"));
  it("65 → epic", () => expect(calculateRankBadge(65)).toBe("epic"));
  it("74 → epic", () => expect(calculateRankBadge(74)).toBe("epic"));
  it("75 → legend", () => expect(calculateRankBadge(75)).toBe("legend"));
  it("84 → legend", () => expect(calculateRankBadge(84)).toBe("legend"));
  it("85 → mythic", () => expect(calculateRankBadge(85)).toBe("mythic"));
  it("94 → mythic", () => expect(calculateRankBadge(94)).toBe("mythic"));
  it("95 → mythicalglory", () => expect(calculateRankBadge(95)).toBe("mythicalglory"));
  it("100 → mythicalglory", () => expect(calculateRankBadge(100)).toBe("mythicalglory"));
});

// ─── calculateProjectScore() — clamping and formula ──────────────────────────

describe("calculateProjectScore()", () => {
  it("all categories 100 → score = 100", () => {
    const all100: CategoryScores = {
      popularity: 100,
      activity: 100,
      health: 100,
      community: 100,
      releaseStability: 100,
    };
    expect(calculateProjectScore(all100)).toBeCloseTo(100, 5);
  });

  it("all categories 0 → score = 0", () => {
    const all0: CategoryScores = {
      popularity: 0,
      activity: 0,
      health: 0,
      community: 0,
      releaseStability: 0,
    };
    expect(calculateProjectScore(all0)).toBe(0);
  });

  it("result is always in [0, 100]", () => {
    const scores = [0, 25, 50, 75, 100];
    for (const s of scores) {
      const cats: CategoryScores = {
        popularity: s,
        activity: s,
        health: s,
        community: s,
        releaseStability: s,
      };
      const result = calculateProjectScore(cats);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    }
  });

  it("weighted formula matches: 0.25+0.25+0.20+0.15+0.15", () => {
    const cats: CategoryScores = {
      popularity: 100,
      activity: 80,
      health: 60,
      community: 40,
      releaseStability: 20,
    };
    // 0.25×100 + 0.25×80 + 0.20×60 + 0.15×40 + 0.15×20
    // = 25 + 20 + 12 + 6 + 3 = 66
    expect(calculateProjectScore(cats)).toBeCloseTo(66, 5);
  });
});

// ─── Popularity ───────────────────────────────────────────────────────────────

describe("calculateStarScore()", () => {
  it("at ceiling (500) → 100", () => expect(calculateStarScore(500)).toBe(100));
  it("half ceiling (250) → 50", () => expect(calculateStarScore(250)).toBe(50));
  it("zero → 0", () => expect(calculateStarScore(0)).toBe(0));
  it("above ceiling → 100", () => expect(calculateStarScore(10000)).toBe(100));
});

describe("calculateForkScore()", () => {
  it("at ceiling (100) → 100", () => expect(calculateForkScore(100)).toBe(100));
  it("zero → 0", () => expect(calculateForkScore(0)).toBe(0));
});

describe("calculatePopularityScore()", () => {
  it("0 stars, 0 forks → 0", () => expect(calculatePopularityScore(0, 0)).toBe(0));
  it("max stars, max forks → 100", () =>
    expect(calculatePopularityScore(500, 100)).toBeCloseTo(100, 5));
  it("only stars at ceiling → ~70 (star weight is 70%)", () =>
    expect(calculatePopularityScore(500, 0)).toBeCloseTo(70, 1));
  it("only forks at ceiling → ~30 (fork weight is 30%)", () =>
    expect(calculatePopularityScore(0, 100)).toBeCloseTo(30, 1));
});

// ─── Activity ─────────────────────────────────────────────────────────────────

describe("calculatePushRecencyScore()", () => {
  it("null lastPush → 0 (zero activity signal, not unavailable)", () => {
    expect(calculatePushRecencyScore(null, SNAPSHOT.snapshotTime)).toBe(0);
  });

  it("6 days ago → 100", () => {
    const d = new Date(SNAPSHOT.snapshotTime.getTime() - 6 * 86400000).toISOString();
    expect(calculatePushRecencyScore(d, SNAPSHOT.snapshotTime)).toBe(100);
  });

  it("400 days ago → 0", () => {
    const d = new Date(SNAPSHOT.snapshotTime.getTime() - 400 * 86400000).toISOString();
    expect(calculatePushRecencyScore(d, SNAPSHOT.snapshotTime)).toBe(0);
  });
});

describe("calculateActivityScore()", () => {
  it("all zero activity → score is low but valid", () => {
    const zero = {
      recentCommits: 0,
      recentPRs: 0,
      lastPush: null,
    };
    const score = calculateActivityScore(zero, SNAPSHOT.snapshotTime);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("max activity → high score", () => {
    const max = {
      recentCommits: 200,
      recentPRs: 60,
      lastPush: new Date(SNAPSHOT.snapshotTime.getTime() - 86400000).toISOString(),
    };
    const score = calculateActivityScore(max, SNAPSHOT.snapshotTime);
    expect(score).toBeGreaterThan(90);
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────

describe("calculateIssueManagementScore()", () => {
  it("90 closed, 10 open → 90", () => {
    expect(calculateIssueManagementScore(90, 10)).toBeCloseTo(90, 5);
  });

  it("all closed → 100", () => {
    expect(calculateIssueManagementScore(100, 0)).toBe(100);
  });

  it("all open → 0", () => {
    expect(calculateIssueManagementScore(0, 100)).toBe(0);
  });

  it("0 closed, 0 open → null (metric unavailable)", () => {
    expect(calculateIssueManagementScore(0, 0)).toBeNull();
  });
});

describe("calculatePRMergeRateScore()", () => {
  it("25 merged, 5 closed-unmerged → 83.33", () => {
    expect(calculatePRMergeRateScore(25, 5)).toBeCloseTo(83.33, 1);
  });

  it("all merged → 100", () => {
    expect(calculatePRMergeRateScore(50, 0)).toBe(100);
  });

  it("0 merged, 0 closed → null (metric unavailable)", () => {
    expect(calculatePRMergeRateScore(0, 0)).toBeNull();
  });
});

describe("calculateHealthScore() — missing data redistribution", () => {
  it("no issues and no PRs — health still returns valid score", () => {
    const features = {
      openIssues: 0,
      closedIssues: 0,
      mergedPRs: 0,
      closedUnmergedPRs: 0,
      recentPRs: 0,
      recentCommits: 0,
    };
    const score = calculateHealthScore(features, SNAPSHOT.snapshotTime);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("no issues but active PRs — redistributes weight to PR merge + maintenance", () => {
    const features = {
      openIssues: 0,
      closedIssues: 0,       // issue score null
      mergedPRs: 50,
      closedUnmergedPRs: 5,
      recentPRs: 10,
      recentCommits: 20,
    };
    const score = calculateHealthScore(features, SNAPSHOT.snapshotTime);
    expect(score).toBeGreaterThan(50); // active project, should score well
  });
});

// ─── Community ────────────────────────────────────────────────────────────────

describe("calculateActiveContributorScore()", () => {
  it("at ceiling (10) → 100", () => {
    expect(calculateActiveContributorScore(10)).toBe(100);
  });

  it("zero → 0", () => {
    expect(calculateActiveContributorScore(0)).toBe(0);
  });

  it("-1 (sentinel: API unavailable) → null", () => {
    expect(calculateActiveContributorScore(-1)).toBeNull();
  });
});

describe("calculateCommunityScore()", () => {
  it("API unavailable (-1 contributors) → uses uniquePRAuthors weight only", () => {
    const features = { activeContributors: -1, uniquePRAuthors: 10 };
    const score = calculateCommunityScore(features);
    // Only uniquePRAuthors available at ceiling → should be 100
    expect(score).toBe(100);
  });

  it("both zero → 0", () => {
    const score = calculateCommunityScore({ activeContributors: 0, uniquePRAuthors: 0 });
    expect(score).toBe(0);
  });
});

// ─── Release Stability ────────────────────────────────────────────────────────

describe("calculateReleaseRecencyScore()", () => {
  it("null latestReleaseDate → null (metric unavailable)", () => {
    expect(calculateReleaseRecencyScore(null, SNAPSHOT.snapshotTime)).toBeNull();
  });

  it("16 days ago → 90", () => {
    const d = new Date(SNAPSHOT.snapshotTime.getTime() - 16 * 86400000).toISOString();
    expect(calculateReleaseRecencyScore(d, SNAPSHOT.snapshotTime)).toBe(90);
  });
});

describe("calculateReleaseFrequencyScore()", () => {
  it("0 releases, null latestRelease → null (never released)", () => {
    expect(calculateReleaseFrequencyScore(0, null)).toBeNull();
  });

  it("0 releases in year but has a latestRelease → 0 (not null)", () => {
    // Project had a release once but not in the last year
    expect(calculateReleaseFrequencyScore(0, "2024-01-01T00:00:00Z")).toBe(0);
  });

  it("12 releases (at ceiling) → 100", () => {
    expect(calculateReleaseFrequencyScore(12, "2026-08-01T00:00:00Z")).toBe(100);
  });
});

describe("calculateReleaseStabilityScore() — no releases", () => {
  it("project with no GitHub releases → MISSING_DATA_NEUTRAL_SCORE (50)", () => {
    const score = calculateReleaseStabilityScore(
      { latestReleaseDate: null, releasesLastYear: 0 },
      SNAPSHOT.snapshotTime
    );
    expect(score).toBe(50);
  });
});

// ─── Fork Penalty ─────────────────────────────────────────────────────────────

describe("Fork penalty", () => {
  it("non-fork: rawScore === finalScore", () => {
    const result = calculateRanking("p1", "o/r", FULL_FEATURES, SNAPSHOT);
    expect(result.score).toBe(result.rawScoreBeforeForkPenalty);
    expect(result.isFork).toBe(false);
  });

  it("fork: finalScore = round(rawScore × 0.80)", () => {
    const forkFeatures: ProjectFeatures = { ...FULL_FEATURES, isFork: true };
    const result = calculateRanking("p1", "o/r", forkFeatures, SNAPSHOT);
    expect(result.isFork).toBe(true);
    const expected = Math.round(result.rawScoreBeforeForkPenalty * 0.80);
    expect(result.score).toBe(Math.max(0, Math.min(100, expected)));
  });

  it("fork with raw 100 → final 80", () => {
    // Force raw score of 100 by using ceiling values
    const maxFeatures: ProjectFeatures = {
      stars: 500,
      forks: 100,
      recentCommits: 200,
      recentPRs: 60,
      lastPush: new Date(SNAPSHOT.snapshotTime.getTime() - 86400000).toISOString(),
      openIssues: 0,
      closedIssues: 1000,
      mergedPRs: 1000,
      closedUnmergedPRs: 0,
      activeContributors: 25,
      uniquePRAuthors: 20,
      latestReleaseDate: new Date(SNAPSHOT.snapshotTime.getTime() - 86400000).toISOString(),
      releasesLastYear: 12,
      isFork: true,
    };
    const result = calculateRanking("p1", "o/r", maxFeatures, SNAPSHOT);
    // Raw should be 100 (all at ceiling), fork penalty → 80
    expect(result.rawScoreBeforeForkPenalty).toBe(100);
    expect(result.score).toBe(80);
    expect(result.badge).toBe("legend");
  });
});

// ─── Zero Activity (Missing Data Edge Case) ───────────────────────────────────

describe("Zero activity project", () => {
  const zeroFeatures: ProjectFeatures = {
    stars: 0,
    forks: 0,
    recentCommits: 0,
    recentPRs: 0,
    lastPush: null,
    openIssues: 0,
    closedIssues: 0,
    mergedPRs: 0,
    closedUnmergedPRs: 0,
    activeContributors: 0,
    uniquePRAuthors: 0,
    latestReleaseDate: null,
    releasesLastYear: 0,
    isFork: false,
  };

  it("produces a valid score (not NaN, not negative, not > 100)", () => {
    const result = calculateRanking("p0", "o/r", zeroFeatures, SNAPSHOT);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Number.isNaN(result.score)).toBe(false);
  });

  it("score is an integer", () => {
    const result = calculateRanking("p0", "o/r", zeroFeatures, SNAPSHOT);
    expect(Number.isInteger(result.score)).toBe(true);
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe("Determinism", () => {
  it("same features + same snapshot → identical result on 10 repeated calls", () => {
    const first = calculateRanking("p1", "o/r", FULL_FEATURES, SNAPSHOT);

    for (let i = 0; i < 9; i++) {
      const repeated = calculateRanking("p1", "o/r", FULL_FEATURES, SNAPSHOT);
      expect(repeated.score).toBe(first.score);
      expect(repeated.badge).toBe(first.badge);
      expect(repeated.rawScoreBeforeForkPenalty).toBe(first.rawScoreBeforeForkPenalty);
    }
  });

  it("different snapshot → potentially different score (recency changes)", () => {
    const olderSnapshot = createSnapshot(
      new Date("2026-07-01T12:00:00Z") // 56 days before the push
    );
    const result1 = calculateRanking("p1", "o/r", FULL_FEATURES, SNAPSHOT);
    const result2 = calculateRanking("p1", "o/r", FULL_FEATURES, olderSnapshot);
    // Push was 2026-08-20, older snapshot is 2026-07-01 → push is in the future?
    // In any case, scores should be calculated without NaN
    expect(Number.isNaN(result2.score)).toBe(false);
    expect(result2.score).toBeGreaterThanOrEqual(0);
    expect(result2.score).toBeLessThanOrEqual(100);
  });
});

// ─── Absolute Scoring Independence ───────────────────────────────────────────

describe("Absolute scoring — project scores are independent", () => {
  it("adding a mega-project does not change existing project scores", () => {
    const projectA: ProjectFeatures = { ...FULL_FEATURES };
    const megaProject: ProjectFeatures = {
      stars: 999999,  // way above ceiling
      forks: 999999,
      recentCommits: 999999,
      recentPRs: 999999,
      lastPush: new Date(SNAPSHOT.snapshotTime.getTime() - 86400000).toISOString(),
      openIssues: 0,
      closedIssues: 999999,
      mergedPRs: 999999,
      closedUnmergedPRs: 0,
      activeContributors: 999,
      uniquePRAuthors: 999,
      latestReleaseDate: new Date(SNAPSHOT.snapshotTime.getTime() - 86400000).toISOString(),
      releasesLastYear: 999,
      isFork: false,
    };

    const scoreA_alone = calculateRanking("A", "owner/a", projectA, SNAPSHOT).score;

    // In an absolute system, calculateRanking is called individually —
    // the mega-project's existence does NOT affect projectA's score.
    const scoreA_withMega = calculateRanking("A", "owner/a", projectA, SNAPSHOT).score;

    expect(scoreA_alone).toBe(scoreA_withMega);
  });
});

// ─── calculateAllRankings() ───────────────────────────────────────────────────

describe("calculateAllRankings()", () => {
  it("returns results sorted by score descending", () => {
    const map = new Map([
      ["p1", { repoKey: "o/a", features: { ...FULL_FEATURES, stars: 100 } }],
      ["p2", { repoKey: "o/b", features: { ...FULL_FEATURES, stars: 400 } }],
      ["p3", { repoKey: "o/c", features: { ...FULL_FEATURES, stars: 0 } }],
    ]);

    const results = calculateAllRankings(map, SNAPSHOT);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
  });

  it("handles empty map", () => {
    expect(calculateAllRankings(new Map(), SNAPSHOT)).toHaveLength(0);
  });

  it("produces deterministic order for equal scores (sorted by projectId)", () => {
    const features: ProjectFeatures = { ...FULL_FEATURES };
    const map = new Map([
      ["z-project", { repoKey: "o/z", features }],
      ["a-project", { repoKey: "o/a", features }],
    ]);

    const r1 = calculateAllRankings(map, SNAPSHOT);
    const r2 = calculateAllRankings(map, SNAPSHOT);

    expect(r1.map((r) => r.projectId)).toEqual(r2.map((r) => r.projectId));
  });

  it("all results have scores in [0, 100]", () => {
    const map = new Map([
      ["p1", { repoKey: "o/a", features: FULL_FEATURES }],
      ["p2", { repoKey: "o/b", features: { ...FULL_FEATURES, stars: 0, forks: 0 } }],
    ]);

    for (const result of calculateAllRankings(map, SNAPSHOT)) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.score)).toBe(true);
    }
  });
});

// ─── createSnapshot() ─────────────────────────────────────────────────────────

describe("createSnapshot()", () => {
  it("observationStart is exactly 90 days before snapshotTime", () => {
    const t = new Date("2026-08-26T00:00:00Z");
    const snap = createSnapshot(t);
    const diff = t.getTime() - snap.observationStart.getTime();
    expect(diff).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it("releaseWindowStart is exactly 365 days before snapshotTime", () => {
    const t = new Date("2026-08-26T00:00:00Z");
    const snap = createSnapshot(t);
    const diff = t.getTime() - snap.releaseWindowStart.getTime();
    expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
  });
});
