// .github/scripts/discord/digest.mjs
//
// Entry point for the scheduled digest workflow (discord-digest.yml). Reads
// whatever label/assignment events notify.mjs queued via cache-state since
// the last run, posts one summary embed, and flushes the queue.
//
// Per the team's preference: if nothing was queued, this sends NO message —
// silence is the correct output here, not an empty digest.

import { CONFIG } from "./lib/config.mjs";
import { COLORS, baseEmbed, postEmbed } from "./lib/discord.mjs";
import { loadLatest, saveNew, sanitizePrefix } from "./lib/cache-state.mjs";

async function main() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("DISCORD_WEBHOOK_URL is not set — skipping digest.");
    return;
  }

  const repoFullName = process.env.GITHUB_REPOSITORY;
  const prefix = `label-digest-${sanitizePrefix(repoFullName)}`;

  const { data } = await loadLatest(prefix, []);
  if (!data || data.length === 0) {
    console.log("Digest queue is empty — nothing to send.");
    return;
  }

  const embed = buildDigestEmbed(data, repoFullName);
  await postEmbed(webhookUrl, embed);
  console.log(`Sent digest with ${data.length} queued event(s).`);

  // Flush: write an empty queue under a new key so the next window starts clean.
  await saveNew(prefix, []);
}

function buildDigestEmbed(entries, repoFullName) {
  const repoName = repoFullName.split("/")[1];

  // Group by kind (e.g. "PR labeled", "Issue assigned") for readability.
  const groups = new Map();
  for (const e of entries) {
    if (!groups.has(e.kind)) groups.set(e.kind, []);
    groups.get(e.kind).push(e);
  }

  const sections = [...groups.entries()].map(([kind, items]) => {
    const lines = items
      .map((e) => `[#${e.number}](${e.url}) ${e.title} ${e.detail} — *${e.actor}*`)
      .join("\n");
    return `**${kind}** (${items.length})\n${lines}`;
  });

  return baseEmbed({
    title: `Activity digest — last ${CONFIG.digestIntervalHours}h`,
    description: sections.join("\n\n"),
    color: COLORS.grey,
    footer: repoName,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
