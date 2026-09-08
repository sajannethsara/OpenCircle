// .github/scripts/discord/handlers.mjs
//
// One function per GitHub webhook event (and per "action" for events that
// have one). Handlers are pure: no fetch, no cache, no fs — just payload in,
// decision out. All I/O (Discord posting, cache, GitHub API lookups) lives
// in notify.mjs. This keeps the "what should we say" logic easy to read and
// easy to test in isolation from "how do we deliver it".
//
// Each handler returns one of:
//   null                                — nothing to do, skip silently
//   { mode: "immediate", embed }        — post this embed to Discord now
//   { mode: "digest", entry }           — queue `entry` for the periodic
//                                          label/assignment digest instead
//
// The `push` handler is special-cased (see notify.mjs) because it needs
// debounce/accumulation, not a plain immediate-or-digest choice — it returns
// a small descriptor object instead of the shapes above.

import { CONFIG, notifyModeFor } from "./lib/config.mjs";
import { COLORS, truncate, sanitize, baseEmbed } from "./lib/discord.mjs";

// Only these categories make sense to batch into a digest — grouping "PR
// opened" events into a 6-hourly summary would just delay something people
// need to see now. If CONFIG mistakenly sets "digest" on a non-digestable
// category, we fall back to "immediate" and log why.
const DIGESTABLE_KEYS = new Set([
  "pr_assigned",
  "pr_unassigned",
  "pr_labeled",
  "pr_unlabeled",
  "issue_assigned",
  "issue_unassigned",
  "issue_labeled",
  "issue_unlabeled",
]);

function route(key, { embed, entry }) {
  const mode = notifyModeFor(key);
  if (mode === "off") return null;

  if (mode === "digest") {
    if (DIGESTABLE_KEYS.has(key) && entry) {
      return { mode: "digest", entry };
    }
    console.warn(`[handlers] "${key}" isn't digestable — sending immediately instead.`);
  }

  return { mode: "immediate", embed };
}

// ---------------- pull_request ----------------

function pullRequest(payload, ctx) {
  const pr = payload.pull_request;
  const num = pr.number;
  const base = pr.base.ref;
  const head = pr.head.ref;
  const title = sanitize(truncate(pr.title, 200));
  const stats = `\`+${pr.additions ?? 0} -${pr.deletions ?? 0}\` across ${pr.changed_files ?? "?"} file(s)`;

  const decorate = (description) => {
    let extra = "";
    if (ctx.isFirstTimeContributor) {
      extra += "\n👋 **First-time contributor** — say hi and be extra thorough on the review!";
    }
    if (ctx.linkedIssues?.length) {
      const list = ctx.linkedIssues.map((i) => `[#${i.number}](${i.url}) ${sanitize(truncate(i.title, 80))}`).join("\n");
      extra += `\n\n**Closes:**\n${list}`;
    }
    return description + extra;
  };

  const build = () => {
    switch (payload.action) {
      case "opened":
        return {
          key: "pr_opened",
          embed: {
            title: `New PR #${num}: ${title}`,
            description: decorate(`**${ctx.actor}** opened a pull request from \`${head}\` → \`${base}\` in **${ctx.repoName}**.\n${stats}`),
            color: COLORS.green,
          },
        };
      case "reopened":
        return {
          key: "pr_opened",
          embed: {
            title: `PR #${num} Reopened: ${title}`,
            description: `**${ctx.actor}** reopened a pull request from \`${head}\` → \`${base}\` in **${ctx.repoName}**.`,
            color: COLORS.gold,
          },
        };
      case "closed":
        return payload.pull_request.merged
          ? {
              key: "pr_closed",
              embed: {
                title: `PR #${num} Merged: ${title}`,
                description: `**${ctx.actor}** merged \`${head}\` → \`${base}\` in **${ctx.repoName}**.\n${stats}`,
                color: COLORS.purple,
              },
            }
          : {
              key: "pr_closed",
              embed: {
                title: `PR #${num} Closed (not merged): ${title}`,
                description: `Pull request from \`${head}\` → \`${base}\` was closed without merging in **${ctx.repoName}**.`,
                color: COLORS.red,
              },
            };
      case "ready_for_review":
        return {
          key: "pr_ready_for_review",
          embed: {
            title: `PR #${num} Ready for Review: ${title}`,
            description: `**${ctx.actor}** marked \`${head}\` → \`${base}\` as ready for review in **${ctx.repoName}**.`,
            color: COLORS.gold,
          },
        };
      case "assigned":
        return {
          key: "pr_assigned",
          embed: {
            title: `PR #${num} Assigned`,
            description: `**${ctx.actor}** assigned **${payload.assignee.login}** to PR #${num}: *${title}*.`,
            color: COLORS.blue,
          },
          entry: { kind: "PR assigned", number: num, title, url: pr.html_url, detail: `→ ${payload.assignee.login}`, actor: ctx.actor },
        };
      case "unassigned":
        return {
          key: "pr_unassigned",
          embed: {
            title: `PR #${num} Unassigned`,
            description: `**${ctx.actor}** removed **${payload.assignee.login}** from PR #${num}.`,
            color: COLORS.grey,
          },
          entry: { kind: "PR unassigned", number: num, title, url: pr.html_url, detail: `− ${payload.assignee.login}`, actor: ctx.actor },
        };
      case "labeled":
        return {
          key: "pr_labeled",
          embed: {
            title: `PR #${num} Labeled`,
            description: `**${ctx.actor}** added label \`${payload.label.name}\` to PR #${num}: *${title}*.`,
            color: COLORS.gold,
          },
          entry: { kind: "PR labeled", number: num, title, url: pr.html_url, detail: `+ \`${payload.label.name}\``, actor: ctx.actor },
        };
      case "unlabeled":
        return {
          key: "pr_unlabeled",
          embed: {
            title: `PR #${num} Label Removed`,
            description: `**${ctx.actor}** removed label \`${payload.label.name}\` from PR #${num}.`,
            color: COLORS.grey,
          },
          entry: { kind: "PR label removed", number: num, title, url: pr.html_url, detail: `− \`${payload.label.name}\``, actor: ctx.actor },
        };
      case "review_requested":
        return {
          key: "pr_review_requested",
          embed: {
            title: `Review Requested on PR #${num}`,
            description: `**${ctx.actor}** requested a review from **${payload.requested_reviewer.login}** on *${title}*.`,
            color: COLORS.gold,
          },
        };
      default:
        return null;
    }
  };

  const result = build();
  if (!result) return null;

  const embed = result.embed
    ? baseEmbed({ ...result.embed, url: pr.html_url, actor: ctx.actor, actorAvatar: ctx.actorAvatar, footer: ctx.repoName })
    : undefined;

  return route(result.key, { embed, entry: result.entry });
}

// ---------------- issues ----------------

function issues(payload, ctx) {
  const issue = payload.issue;
  const num = issue.number;
  const title = sanitize(truncate(issue.title, 200));

  const build = () => {
    switch (payload.action) {
      case "opened":
        return { key: "issue_opened", embed: { title: `New Issue #${num}: ${title}`, description: `**${ctx.actor}** opened issue #${num} in **${ctx.repoName}**.`, color: COLORS.green } };
      case "reopened":
        return { key: "issue_reopened", embed: { title: `Issue #${num} Reopened: ${title}`, description: `**${ctx.actor}** reopened issue #${num}.`, color: COLORS.gold } };
      case "closed":
        return { key: "issue_closed", embed: { title: `Issue #${num} Closed: ${title}`, description: `**${ctx.actor}** closed issue #${num}.`, color: COLORS.red } };
      case "assigned":
        return {
          key: "issue_assigned",
          embed: { title: `Issue #${num} Assigned`, description: `**${ctx.actor}** assigned **${payload.assignee.login}** to issue #${num}: *${title}*.`, color: COLORS.blue },
          entry: { kind: "Issue assigned", number: num, title, url: issue.html_url, detail: `→ ${payload.assignee.login}`, actor: ctx.actor },
        };
      case "unassigned":
        return {
          key: "issue_unassigned",
          embed: { title: `Issue #${num} Unassigned`, description: `**${ctx.actor}** removed **${payload.assignee.login}** from issue #${num}.`, color: COLORS.grey },
          entry: { kind: "Issue unassigned", number: num, title, url: issue.html_url, detail: `− ${payload.assignee.login}`, actor: ctx.actor },
        };
      case "labeled":
        return {
          key: "issue_labeled",
          embed: { title: `Issue #${num} Labeled`, description: `**${ctx.actor}** added label \`${payload.label.name}\` to issue #${num}: *${title}*.`, color: COLORS.gold },
          entry: { kind: "Issue labeled", number: num, title, url: issue.html_url, detail: `+ \`${payload.label.name}\``, actor: ctx.actor },
        };
      case "unlabeled":
        return {
          key: "issue_unlabeled",
          embed: { title: `Issue #${num} Label Removed`, description: `**${ctx.actor}** removed label \`${payload.label.name}\` from issue #${num}.`, color: COLORS.grey },
          entry: { kind: "Issue label removed", number: num, title, url: issue.html_url, detail: `− \`${payload.label.name}\``, actor: ctx.actor },
        };
      default:
        return null;
    }
  };

  const result = build();
  if (!result) return null;

  const embed = result.embed
    ? baseEmbed({ ...result.embed, url: issue.html_url, actor: ctx.actor, actorAvatar: ctx.actorAvatar, footer: ctx.repoName })
    : undefined;

  return route(result.key, { embed, entry: result.entry });
}

// ---------------- push (special-cased, see notify.mjs) ----------------

// Returns a descriptor for notify.mjs's debounce logic, or null if this push
// shouldn't be notified at all. Does NOT return a ready-to-send embed —
// notify.mjs builds the final embed once the debounce window closes, from
// the *accumulated* commit list (possibly spanning several pushes).
function push(payload, ctx) {
  if (notifyModeFor("push") === "off") return null;

  const commits = payload.commits || [];
  if (commits.length === 0) return null; // e.g. a push that only creates a branch/tag

  // The "Merge pull request #N" commit GitHub auto-creates on a merge
  // duplicates the pull_request "merged" embed — skip it.
  if (commits.length === 1 && /^Merge pull request #\d+/.test(commits[0].message)) {
    return null;
  }

  return {
    branch: payload.ref.replace("refs/heads/", ""),
    compareUrl: payload.compare,
    commits: commits.map((c) => ({
      sha: c.id,
      message: c.message,
      url: c.url,
      author: c.author?.name || c.author?.username || "unknown",
    })),
  };
}

export function buildPushEmbed(state, ctx) {
  const count = state.commits.length;
  const shown = state.commits.slice(0, CONFIG.maxCommitsListed);
  const remainder = count - shown.length;

  const lines = shown
    .map((c) => {
      const msg = sanitize(truncate(c.message.split("\n")[0], CONFIG.maxCommitMessageLength));
      return `[\`${c.sha.slice(0, 7)}\`](${c.url}) ${msg} — *${sanitize(c.author)}*`;
    })
    .join("\n");

  const list = remainder > 0 ? `${lines}\n*…and ${remainder} more commit${remainder === 1 ? "" : "s"}*` : lines;

  return baseEmbed({
    title: `${count} new commit${count === 1 ? "" : "s"} on \`${state.branch}\``,
    url: state.compareUrl,
    description: `**${state.actor}** pushed to \`${state.branch}\` in **${ctx.repoName}**:\n\n${list}`,
    color: COLORS.blue,
    actor: state.actor,
    actorAvatar: state.actorAvatar,
    footer: ctx.repoName,
  });
}

// ---------------- create / delete / fork ----------------

function create(payload, ctx) {
  if (payload.ref_type !== "branch") return null;
  if (notifyModeFor("branch_created") === "off") return null;
  const embed = baseEmbed({
    title: `New branch: ${payload.ref}`,
    url: `${ctx.repoUrl}/tree/${payload.ref}`,
    description: `**${ctx.actor}** created branch \`${payload.ref}\` in **${ctx.repoName}**.`,
    color: COLORS.green,
    actor: ctx.actor,
    actorAvatar: ctx.actorAvatar,
  });
  return { mode: "immediate", embed };
}

function del(payload, ctx) {
  if (payload.ref_type !== "branch") return null;
  if (notifyModeFor("branch_deleted") === "off") return null;
  const embed = baseEmbed({
    title: `Branch deleted: ${payload.ref}`,
    url: ctx.repoUrl,
    description: `**${ctx.actor}** deleted branch \`${payload.ref}\` in **${ctx.repoName}**.`,
    color: COLORS.red,
    actor: ctx.actor,
    actorAvatar: ctx.actorAvatar,
  });
  return { mode: "immediate", embed };
}

function fork(payload, ctx) {
  if (notifyModeFor("fork") === "off") return null;
  const embed = baseEmbed({
    title: `Repository forked`,
    url: payload.forkee.html_url,
    description: `**${ctx.actor}** forked **${ctx.repoName}** → \`${payload.forkee.full_name}\`.`,
    color: COLORS.gold,
    actor: ctx.actor,
    actorAvatar: ctx.actorAvatar,
  });
  return { mode: "immediate", embed };
}

// ---------------- release ----------------

function release(payload, ctx) {
  if (payload.action !== "published") return null;
  if (notifyModeFor("release") === "off") return null;

  const rel = payload.release;
  const body = rel.body ? truncate(sanitize(rel.body), CONFIG.maxReleaseBodyLength) : "_No release notes provided._";

  const embed = baseEmbed({
    title: `🚀 Released ${rel.name || rel.tag_name}`,
    url: rel.html_url,
    description: `**${ctx.actor}** published \`${rel.tag_name}\` in **${ctx.repoName}**.\n\n${body}`,
    color: COLORS.purple,
    actor: ctx.actor,
    actorAvatar: ctx.actorAvatar,
    footer: ctx.repoName,
  });
  return { mode: "immediate", embed };
}

export const handlers = {
  pull_request: pullRequest,
  issues,
  push,
  create,
  delete: del,
  fork,
  release,
};
