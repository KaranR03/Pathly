/**
 * Best-effort public GitHub evidence for a claimed username. Uses only the
 * unauthenticated public REST API (no scraping, no login) — degrades to
 * `{ found: false }` on a bad username, 404, or rate-limit rather than
 * failing the whole application-verification flow.
 */
export interface GithubEvidence {
  found: boolean;
  username: string;
  bio: string | null;
  publicRepos: number;
  languages: string[];
  topics: string[];
  repoSummaries: string[];
}

interface GhRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  stargazers_count: number;
}

async function ghFetch(path: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "pathly-app",
      ...(process.env["GITHUB_TOKEN"]
        ? { Authorization: `Bearer ${process.env["GITHUB_TOKEN"]}` }
        : {}),
    },
  });
}

export async function fetchGithubEvidence(
  rawUsername: string,
): Promise<GithubEvidence> {
  const username = rawUsername
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/$/, "");
  const empty: GithubEvidence = {
    found: false,
    username,
    bio: null,
    publicRepos: 0,
    languages: [],
    topics: [],
    repoSummaries: [],
  };
  if (!username || !/^[a-z0-9-]{1,39}$/i.test(username)) return empty;

  try {
    const userRes = await ghFetch(`/users/${encodeURIComponent(username)}`);
    if (!userRes.ok) return empty;
    const user = (await userRes.json()) as {
      bio: string | null;
      public_repos: number;
    };

    const reposRes = await ghFetch(
      `/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=30`,
    );
    const repos: GhRepo[] = reposRes.ok
      ? ((await reposRes.json()) as GhRepo[])
      : [];
    const owned = repos.filter((r) => !r.fork);

    const languages = Array.from(
      new Set(owned.map((r) => r.language).filter((l): l is string => !!l)),
    );
    const topics = Array.from(new Set(owned.flatMap((r) => r.topics ?? [])));
    const repoSummaries = owned
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 12)
      .map(
        (r) =>
          `${r.name}${r.language ? ` (${r.language})` : ""}${r.description ? `: ${r.description}` : ""}`,
      );

    return {
      found: true,
      username,
      bio: user.bio?.trim() || null,
      publicRepos: user.public_repos,
      languages,
      topics,
      repoSummaries,
    };
  } catch {
    return empty;
  }
}
