const GITHUB_API = "https://api.github.com";
const TRAIL_USER_AGENT = "Trail-Desktop";

type GitHubUser = { login: string };

type GitHubRepo = {
  full_name: string;
  description: string | null;
  open_issues_count: number;
};

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": TRAIL_USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    // ignore
  }
  return `GitHub API error (${response.status})`;
}

export async function fetchGitHubUser(
  token: string,
): Promise<{ ok: true; login: string } | { ok: false; message: string }> {
  const response = await fetch(`${GITHUB_API}/user`, { headers: authHeaders(token) });
  if (!response.ok) {
    return { ok: false, message: await parseError(response) };
  }
  const user = (await response.json()) as GitHubUser;
  if (!user.login) {
    return { ok: false, message: "GitHub returned an empty user" };
  }
  return { ok: true, login: user.login };
}

export async function fetchGitHubBranches(
  token: string,
  owner: string,
  repo: string,
): Promise<{ ok: true; branches: string[] } | { ok: false; message: string }> {
  const names: string[] = [];
  let page = 1;

  for (;;) {
    const response = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100&page=${page}`,
      { headers: authHeaders(token) },
    );
    if (!response.ok) {
      return { ok: false, message: await parseError(response) };
    }
    const rows = (await response.json()) as Array<{ name: string }>;
    for (const row of rows) {
      if (row.name) {
        names.push(row.name);
      }
    }
    if (rows.length < 100) {
      break;
    }
    page += 1;
  }

  return { ok: true, branches: [...new Set(names)].sort((a, b) => a.localeCompare(b)) };
}

type GitHubIssueComment = {
  user: { login: string } | null;
  body: string;
  created_at: string;
};

export async function fetchGitHubIssueComments(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<{ ok: true; comments: GitHubIssueComment[] } | { ok: false; message: string }> {
  const comments: GitHubIssueComment[] = [];
  let page = 1;

  for (;;) {
    const response = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments?per_page=100&page=${page}`,
      { headers: authHeaders(token) },
    );
    if (!response.ok) {
      return { ok: false, message: await parseError(response) };
    }
    const rows = (await response.json()) as GitHubIssueComment[];
    comments.push(...rows);
    if (rows.length < 100) {
      break;
    }
    page += 1;
  }

  return { ok: true, comments };
}

export async function createGitHubIssueComment(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<
  { ok: true; id: number; htmlUrl: string } | { ok: false; message: string }
> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ body }),
    },
  );
  if (!response.ok) {
    return { ok: false, message: await parseError(response) };
  }
  const row = (await response.json()) as { id: number; html_url: string };
  if (!row.id || !row.html_url) {
    return { ok: false, message: "GitHub did not return a comment" };
  }
  return { ok: true, id: row.id, htmlUrl: row.html_url };
}

export async function createGitHubIssue(
  token: string,
  owner: string,
  repo: string,
  input: { title: string; body: string; labels: string[] },
): Promise<
  { ok: true; number: number; htmlUrl: string } | { ok: false; message: string }
> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels: input.labels,
      }),
    },
  );
  if (!response.ok) {
    return { ok: false, message: await parseError(response) };
  }
  const row = (await response.json()) as { number: number; html_url: string };
  if (!row.number || !row.html_url) {
    return { ok: false, message: "GitHub did not return an issue" };
  }
  return { ok: true, number: row.number, htmlUrl: row.html_url };
}

export async function createDraftPullRequest(
  token: string,
  owner: string,
  repo: string,
  input: { title: string; head: string; base: string; body: string },
): Promise<
  { ok: true; number: number; htmlUrl: string } | { ok: false; message: string }
> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        title: input.title,
        head: input.head,
        base: input.base,
        body: input.body,
        draft: true,
      }),
    },
  );
  if (!response.ok) {
    return { ok: false, message: await parseError(response) };
  }
  const row = (await response.json()) as { number: number; html_url: string };
  if (!row.number || !row.html_url) {
    return { ok: false, message: "GitHub did not return a pull request" };
  }
  return { ok: true, number: row.number, htmlUrl: row.html_url };
}

export async function setGitHubIssueState(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  state: "open" | "closed",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ state }),
    },
  );
  if (!response.ok) {
    return { ok: false, message: await parseError(response) };
  }
  return { ok: true };
}

export async function fetchGitHubRepos(token: string): Promise<
  | {
      ok: true;
      repos: Array<{
        fullName: string;
        description: string | null;
        openIssuesCount: number;
      }>;
    }
  | { ok: false; message: string }
> {
  const response = await fetch(
    `${GITHUB_API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`,
    { headers: authHeaders(token) },
  );
  if (!response.ok) {
    return { ok: false, message: await parseError(response) };
  }
  const rows = (await response.json()) as GitHubRepo[];
  return {
    ok: true,
    repos: rows.map((row) => ({
      fullName: row.full_name,
      description: row.description,
      openIssuesCount: row.open_issues_count,
    })),
  };
}