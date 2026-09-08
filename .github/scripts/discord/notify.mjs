// .github/scripts/discord/notify.mjs
//
// Entry point for the event-driven workflow (discord-notify.yml). Reads the
// GitHub event payload from disk (GITHUB_EVENT_PATH — never from
// shell-interpolated ${{ github.event.* }} strings, which would be a script
// injection risk), enriches it with a bit of extra context, dispatches to
// handlers.mjs, and either posts immediately, queues for the digest, or
// (for push) runs the debounce dance.

import { readFileSync } from "node:fs";
import { CONFIG } from "./lib/config.mjs";
import { handlers, buildPushEmbed } from "./handlers.mjs";
import { postEmbed } from "./lib/discord.mjs";
import { loadLatest, saveNew, sanitizePrefix } from "./lib/cache-state.mjs";
import { isFirstTimeContributor, fetchIssueTitles } from "./lib/github-api.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("DISCORD_WEBHOOK_URL is not set — skipping notification.");
    return;
  }

  const eventName = process.env.GITHUB_EVENT_NAME;
  const payload = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const repoFullName = payload.repository?.full_name || process.env.GITHUB_REPOSITORY;
  const githubToken = process.env.GITHUB_TOKEN;

  // ---- skip bots (Dependabot, Renovate, etc.) up front ----
  const sender = payload.sender;
  if (CONFIG.skipBots && sender?.type === "Bot" && !CONFIG.allowedBots.includes(sender.login)) {
    console.log(`Sender "${sender.login}" is a bot — skipping (not in allowedBots).`);
    return;
  }

  const ctx = {
    actor: sender?.login || process.env.GITHUB_ACTOR,
    actorAvatar: sender?.avatar_url,
    repoName: payload.repository?.name || repoFullName?.split("/")[1],
    repoUrl: payload.repository?.html_url,
  };

  // ---- enrich context for the one place that needs extra API calls ----
  // Only bother for a newly opened PR, to avoid unnecessary API traffic on
  // every other event type.
  if (eventName === "pull_request" && payload.action === "opened" && githubToken) {
    const pr = payload.pull_request;
    const [firstTime, linkedIssues] = await Promise.all([
      isFirstTimeContributor(repoFullName, ctx.actor, githubToken),
      fetchIssueTitles(repoFullName, extractClosesReferences(pr.body), githubToken),
    ]);
    ctx.isFirstTimeContributor = firstTime;
    ctx.linkedIssues = linkedIssues;
  }

  const handler = handlers[eventName];
  if (!handler) {
    console.log(`No handler for event "${eventName}" — skipping.`);
    return;
  }

  // ---- push gets special debounce handling, everything else is immediate/digest ----
  if (eventName === "push") {
    return handlePush(handler(payload, ctx), ctx, webhookUrl, repoFullName);
  }

  const decision = handler(payload, ctx);
  if (!decision) {
    console.log(`Handler for "${eventName}" produced nothing — skipping.`);
    return;
  }

  if (decision.mode === "immediate") {
    await postEmbed(webhookUrl, decision.embed);
    console.log(`Sent "${eventName}"${payload.action ? `/${payload.action}` : ""} notification to Discord.`);
    return;
  }

  if (decision.mode === "digest") {
    await queueForDigest(repoFullName, decision.entry);
    console.log(`Queued "${eventName}/${payload.action}" for the next digest.`);
    return;
  }
}

// GitHub's own closing-keyword syntax: "Closes #12", "fixes org/repo#34", etc.
// We only resolve same-repo references (bare "#N") to keep this simple.
function extractClosesReferences(body) {
  if (!body) return [];
  const matches = [...body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s*#(\d+)/gi)];
  return [...new Set(matches.map((m) => Number(m[1])))];
}

async function queueForDigest(repoFullName, entry) {
  const prefix = `label-digest-${sanitizePrefix(repoFullName)}`;
  const { data } = await loadLatest(prefix, []);
  data.push({ ...entry, queuedAt: new Date().toISOString() });
  await saveNew(prefix, data);
}

async function handlePush(descriptor, ctx, webhookUrl, repoFullName) {
  if (!descriptor) {
    console.log("Push produced nothing to notify (no commits, or a merge-commit echo) — skipping.");
    return;
  }

  const prefix = `push-debounce-${sanitizePrefix(repoFullName)}-${sanitizePrefix(descriptor.branch)}`;
  const { data: prior } = await loadLatest(prefix, { commits: [], firstAt: null });

  const seen = new Map(prior.commits.map((c) => [c.sha, c]));
  for (const c of descriptor.commits) seen.set(c.sha, c);

  const state = {
    branch: descriptor.branch,
    compareUrl: descriptor.compareUrl, // latest compare link wins
    commits: [...seen.values()],
    firstAt: prior.firstAt || Date.now(),
    lastAt: Date.now(),
    actor: ctx.actor,
    actorAvatar: ctx.actorAvatar,
  };

  const myKey = await saveNew(prefix, state);
  console.log(`Accumulated ${state.commits.length} commit(s) on \`${state.branch}\`. Waiting ${CONFIG.pushDebounceMs / 1000}s to see if more pushes follow…`);

  await sleep(CONFIG.pushDebounceMs);

  const timeSinceFirst = Date.now() - state.firstAt;
  const { cacheKey: latestKey } = await loadLatest(prefix, null);

  if (latestKey && latestKey !== myKey && timeSinceFirst < CONFIG.pushMaxWaitMs) {
    console.log("A newer push arrived during the debounce window — leaving the flush to that run.");
    return;
  }

  // Either I'm the most recent push, or this branch has been active long
  // enough that we flush anyway rather than delay indefinitely.
  const embed = buildPushEmbed(state, ctx);
  await postEmbed(webhookUrl, embed);
  console.log(`Flushed ${state.commits.length} commit(s) on \`${state.branch}\` to Discord.`);

  // Reset the queue so the next push chain starts clean.
  await saveNew(prefix, { commits: [], firstAt: null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
