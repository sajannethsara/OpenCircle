// .github/scripts/discord/lib/config.mjs
//
// One place to tune behavior for every script (notify.mjs, digest.mjs,
// stale-prs.mjs). Nothing in here talks to the network — it's just values.

export const CONFIG = {
  // Per-category delivery mode:
  //   "immediate" — post to Discord right away
  //   "digest"    — queue it; a scheduled job (digest.mjs) batches these and
  //                 posts one summary every few hours (only "labeled",
  //                 "unlabeled", "assigned", "unassigned" categories support
  //                 this — see handlers.mjs)
  //   "off"       — drop it, no queue, no message
  notify: {
    pr_opened: "immediate",
    pr_closed: "immediate",
    pr_ready_for_review: "immediate",
    pr_assigned: "immediate",
    pr_unassigned: "digest",
    pr_labeled: "digest",
    pr_unlabeled: "digest",
    pr_review_requested: "immediate",

    issue_opened: "immediate",
    issue_closed: "immediate",
    issue_reopened: "immediate",
    issue_assigned: "immediate",
    issue_unassigned: "digest",
    issue_labeled: "digest",
    issue_unlabeled: "digest",

    push: "immediate", // still subject to the debounce window below
    branch_created: "immediate",
    branch_deleted: "immediate",
    fork: "immediate",
    release: "immediate",
  },

  // Bot accounts (Dependabot, Renovate, etc.) are skipped entirely unless
  // their login is listed here.
  skipBots: true,
  allowedBots: [], // e.g. ["release-please[bot]"]

  // ---- push notifications ----
  maxCommitsListed: 5,
  maxCommitMessageLength: 90,
  // Wait this long after the *last* push to a branch with no further pushes
  // before sending the accumulated commit list.
  pushDebounceMs: 2 * 60 * 1000, // 2 minutes
  // Safety valve: flush anyway if a branch has been continuously active for
  // this long, so a busy branch never goes silent indefinitely.
  pushMaxWaitMs: 10 * 60 * 1000, // 10 minutes

  // ---- digest.mjs (labels/assignments) ----
  // Purely informational here — the actual cadence is set by the cron
  // schedule in discord-digest.yml. If the queue is empty, no message is
  // sent, regardless of cadence.
  digestIntervalHours: 6,

  // ---- stale-prs.mjs ----
  staleAfterDays: 2,
  requireReviewerToNotBeStale: true, // also flag PRs with zero requested reviewers

  // ---- release.mjs / release embeds ----
  maxReleaseBodyLength: 1500,
};

export function notifyModeFor(key) {
  return CONFIG.notify[key] || "off";
}
