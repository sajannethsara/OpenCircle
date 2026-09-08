// .github/scripts/discord/stale-prs.mjs
//
// Entry point for the daily stale-PR workflow (discord-stale-prs.yml).
// Lists open PRs, flags ones with no activity in CONFIG.staleAfterDays+ days
// or with zero requested reviewers, and posts one digest — same "no
// qualifying PRs, no message" principle as digest.mjs.

import { CONFIG } from "./lib/config.mjs";
import { COLORS, baseEmbed, postEmbed, sanitize, truncate } from "./lib/discord.mjs";
import { listOpenPullRequests } from "./lib/github-api.mjs";

async function main() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const githubToken = process.env.GITHUB_TOKEN;
  const repoFullName = process.env.GITHUB_REPOSITORY;

  if (!webhookUrl) {
    console.log("DISCORD_WEBHOOK_URL is not set — skipping stale-PR check.");
    return;
  }
  if (!githubToken) {
    console.log("GITHUB_TOKEN is not set — cannot list PRs, skipping.");
    return;
  }

  const prs = await listOpenPullRequests(repoFullName, githubToken);
  const now = Date.now();

  const stale = prs.filter((pr) => {
    if (pr.draft) return false; // drafts aren't waiting on anyone yet
    const daysSinceUpdate = (now - new Date(pr.updated_at).getTime()) / 86_400_000;
    const noReviewer = CONFIG.requireReviewerToNotBeStale && (pr.requested_reviewers?.length ?? 0) === 0;
    return daysSinceUpdate >= CONFIG.staleAfterDays || noReviewer;
  });

  if (stale.length === 0) {
    console.log("No stale or reviewer-less PRs — nothing to send.");
    return;
  }

  const embed = buildStaleEmbed(stale, repoFullName);
  await postEmbed(webhookUrl, embed);
  console.log(`Sent stale-PR digest with ${stale.length} PR(s).`);
}

function buildStaleEmbed(prs, repoFullName) {
  const repoName = repoFullName.split("/")[1];
  const lines = prs
    .map((pr) => {
      const days = Math.floor((Date.now() - new Date(pr.updated_at).getTime()) / 86_400_000);
      const noReviewer = (pr.requested_reviewers?.length ?? 0) === 0;
      const flags = [days >= CONFIG.staleAfterDays ? `idle ${days}d` : null, noReviewer ? "no reviewer" : null].filter(Boolean).join(", ");
      const title = sanitize(truncate(pr.title, 90));
      return `[#${pr.number}](${pr.html_url}) ${title} — *${pr.user.login}* (${flags})`;
    })
    .join("\n");

  return baseEmbed({
    title: `⏳ ${prs.length} PR${prs.length === 1 ? "" : "s"} need attention`,
    description: lines,
    color: COLORS.gold,
    footer: repoName,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
