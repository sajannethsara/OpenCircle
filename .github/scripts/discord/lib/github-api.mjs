// .github/scripts/discord/lib/github-api.mjs
//
// Small, purpose-built calls against the GitHub REST/Search API. Every
// function takes the token explicitly rather than reading env vars itself,
// so it stays easy to test.

const API = "https://api.github.com";

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function get(url, token) {
  const res = await fetch(url, { headers: headers(token) });
  if (!res.ok) {
    console.warn(`[github-api] GET ${url} -> ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json();
}

/**
 * True if this is the author's first pull request against this repo
 * (i.e. this PR itself is the only PR search finds for them).
 */
export async function isFirstTimeContributor(ownerRepo, username, token) {
  const q = encodeURIComponent(`repo:${ownerRepo} type:pr author:${username}`);
  const result = await get(`${API}/search/issues?q=${q}&per_page=2`, token);
  if (!result) return false;
  return result.total_count <= 1;
}

/**
 * Fetch titles for a list of issue/PR numbers in the same repo. Numbers that
 * fail to resolve (deleted, no access) are simply omitted from the result.
 */
export async function fetchIssueTitles(ownerRepo, numbers, token) {
  const [owner, repo] = ownerRepo.split("/");
  const results = await Promise.all(
    numbers.map(async (num) => {
      const issue = await get(`${API}/repos/${owner}/${repo}/issues/${num}`, token);
      return issue ? { number: num, title: issue.title, url: issue.html_url } : null;
    })
  );
  return results.filter(Boolean);
}

/**
 * List open, non-draft pull requests for a repo (used by stale-prs.mjs).
 */
export async function listOpenPullRequests(ownerRepo, token) {
  const [owner, repo] = ownerRepo.split("/");
  const prs = await get(`${API}/repos/${owner}/${repo}/pulls?state=open&per_page=100`, token);
  return prs || [];
}
