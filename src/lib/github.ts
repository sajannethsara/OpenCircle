export interface GithubRepoData {
  name: string;
  avatar: string;
  description: string;
  url: string;
  readmeUrl: string;
  branch: string;
}

export interface GithubAssignee {
  username: string;
  avatar: string;
  profileUrl: string;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  createdAt: string;
  user: string;
  body: string;
  assignees: GithubAssignee[];
}

export interface GithubContributor {
  username: string;
  avatar: string;
  profileUrl: string;
  contributions: number;
}

export interface GithubRepoExtraData {
  repo: GithubRepoData | null;
  files: string[];
  mdFileUrls: string[];
  collaborators: GithubContributor[];
  issues: GithubIssue[];
}

export class GithubRepo {
  readonly url: string;
  readonly username: string;
  readonly repo: string;
  readonly devBranch: string;

  constructor(url: string, devBranch: string = "main") {
    this.url = url.trim();
    this.devBranch = devBranch.trim();
    const { username, repo } = GithubRepo.parseUrl(this.url);
    this.username = username;
    this.repo = repo;
  }

  private static parseUrl(rawUrl: string): { username: string; repo: string } {
    try {
      const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
      const segments = parsed.pathname.split("/").filter(Boolean);

      if (segments.length < 2) {
        throw new Error("URL must contain both username and repository name.");
      }

      return {
        username: segments[0],
        repo: segments[1].replace(/\.git$/, ""),
      };
    } catch (err) {
      throw new Error(`Invalid GitHub repository URL: "${rawUrl}"`);
    }
  }

  get rawReadmeUrl(): string {
    return this.getReadmeUrl("main");
  }

  getReadmeUrl(branch: string = "main"): string {
    return `https://raw.githubusercontent.com/${this.username}/${this.repo}/${branch}/README.md`;
  }

  private get apiHeaders(): HeadersInit {
    return {
      Accept: "application/vnd.github+json",
      "User-Agent": "GithubRepoService/1.0", // Required by GitHub API
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  async getRepo(): Promise<GithubRepoData | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.username}/${this.repo}`,
        { headers: this.apiHeaders }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        name: data.name,
        avatar: data.owner?.avatar_url ?? "",
        description: data.description ?? "",
        url: data.html_url ?? this.url,
        readmeUrl: this.getReadmeUrl(this.devBranch),
        branch: this.devBranch,
      };
    } catch (error) {
      console.error(`[GithubRepo] Failed to fetch "${this.username}/${this.repo}":`, error);
      return null;
    }
  }

  /**
   * Lists the raw GitHub URL for every file directly inside `docFolderName`
   * (top-level only, not recursive) using the public Contents API.
   */
  private async getFolderFileUrls(docFolderName: string): Promise<{ name: string; downloadUrl: string }[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.username}/${this.repo}/contents/${encodeURIComponent(
          docFolderName
        )}?ref=${this.devBranch}`,
        { headers: this.apiHeaders }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        // Path pointed to a file, not a folder
        return [];
      }

      return data
        .filter((item: any) => item.type === "file")
        .map((item: any) => ({
          name: item.name as string,
          downloadUrl:
            (item.download_url as string) ??
            `https://raw.githubusercontent.com/${this.username}/${this.repo}/${this.devBranch}/${docFolderName}/${item.name}`,
        }));
    } catch (error) {
      console.error(`[GithubRepo] Failed to list folder "${docFolderName}":`, error);
      return [];
    }
  }

  /**
   * Public, token-free stand-in for "collaborators".
   * NOTE: GitHub's real `/collaborators` endpoint requires an authenticated
   * user with push access, even on public repos, so it cannot be used without
   * a token. `/contributors` is the closest public, unauthenticated equivalent.
   */
  private async getContributors(): Promise<GithubContributor[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.username}/${this.repo}/contributors?per_page=100`,
        { headers: this.apiHeaders }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return (data as any[]).map((c) => ({
        username: c.login,
        avatar: c.avatar_url ?? "",
        profileUrl: c.html_url ?? "",
        contributions: c.contributions ?? 0,
      }));
    } catch (error) {
      console.error(`[GithubRepo] Failed to fetch contributors:`, error);
      return [];
    }
  }

  /**
   * Open issues for the repo (public API, no token required).
   * Note: GitHub's issues endpoint also includes pull requests; these are
   * filtered out here since PRs also show up as "issues" in that API.
   */
  private async getOpenIssues(state: string = "open"): Promise<GithubIssue[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.username}/${this.repo}/issues?state=${state}&per_page=100`,
        { headers: this.apiHeaders }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return (data as any[])
        .filter((issue) => !issue.pull_request) // exclude PRs
        .map((issue) => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          createdAt: issue.created_at,
          user: issue.user?.login ?? "",
          body: issue.body ?? "",
          assignees: Array.isArray(issue.assignees) && issue.assignees.length > 0
            ? issue.assignees.map((a: any) => ({
                username: a.login,
                avatar: a.avatar_url ?? "",
                profileUrl: a.html_url ?? "",
              }))
            : issue.assignee
            ? [
                {
                  username: issue.assignee.login,
                  avatar: issue.assignee.avatar_url ?? "",
                  profileUrl: issue.assignee.html_url ?? "",
                },
              ]
            : [],
        }));
    } catch (error) {
      console.error(`[GithubRepo] Failed to fetch open issues:`, error);
      return [];
    }
  }

  /**
   * Aggregates everything needed for a "docs folder" view:
   * - list of file names in `docFolderName`
   * - raw urls for each .md file in that folder
   * - base repo data (same as getRepo())
   * - contributors (public equivalent of "collaborators")
   * - open issues
   *
   * All requests use the unauthenticated public GitHub API, so they're
   * subject to the standard 60 requests/hour/IP rate limit.
   */
  async getRepoExtraData(docFolderName: string): Promise<GithubRepoExtraData> {
    const [repoData, folderFiles, collaborators, issues] = await Promise.all([
      this.getRepo(),
      this.getFolderFileUrls(docFolderName),
      this.getContributors(),
      this.getOpenIssues("open"),
    ]);

    const files = folderFiles.map((f) => f.name);
    const mdFileUrls = folderFiles
      .filter((f) => f.name.toLowerCase().endsWith(".md"))
      .map((f) => f.downloadUrl);

    return {
      repo: repoData,
      files,
      mdFileUrls,
      collaborators,
      issues,
    };
  }
}
