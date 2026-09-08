// .github/scripts/discord/lib/discord.mjs
//
// Everything that talks to the Discord webhook API, plus small text-safety
// helpers shared by every handler. No GitHub-specific knowledge lives here.

export const COLORS = {
  green: 3066993,
  red: 15158332,
  blue: 3447003,
  purple: 10181046,
  gold: 15844367,
  grey: 9807270,
};

export const truncate = (str, max) => (str.length > max ? `${str.slice(0, max - 1)}…` : str);

// Neutralize markdown control characters from user-controlled text (commit
// messages, PR titles, branch names, release notes) so nobody can break
// embed formatting — or worse, craft fake bold/links — inside a notification.
export const sanitize = (str = "") =>
  String(str).replace(/`/g, "´").replace(/\*/g, "∗").replace(/_/g, "‗").replace(/\|/g, "︱");

export function baseEmbed({ title, url, description, color, actor, actorAvatar, footer }) {
  return {
    title,
    url,
    description,
    color,
    author: actor ? { name: actor, icon_url: actorAvatar } : undefined,
    footer: footer ? { text: footer } : undefined,
    timestamp: new Date().toISOString(),
  };
}

export async function postEmbed(webhookUrl, embed) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText} — ${body}`);
  }
}
