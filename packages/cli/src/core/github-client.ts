import type {
  GitHubAssignee,
  GitHubIssue,
  GitHubIssueComment,
} from "./github-types.js";

const USER_AGENT = "trail-cli/0.0.1";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

export class GitHubClient {
  private readonly token: string;
  private readonly baseUrl: string;

  constructor(token: string, baseUrl = "https://api.github.com") {
    this.token = token;
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers({
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": USER_AGENT,
    });
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  private async parseJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!response.ok) {
      const snippet = text.slice(0, 200);
      throw new Error(`GitHub API ${response.status}: ${snippet}`);
    }
    return JSON.parse(text) as T;
  }

  async listIssues(
    owner: string,
    repo: string,
    params: {
      state: "open" | "all" | "closed";
      per_page: number;
      page: number;
    },
  ): Promise<GitHubIssue[]> {
    const search = new URLSearchParams({
      state: params.state,
      per_page: String(params.per_page),
      page: String(params.page),
    });
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${search}`;
    const response = await this.request("GET", path);
    return this.parseJson<GitHubIssue[]>(response);
  }

  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<GitHubIssue> {
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`;
    const response = await this.request("GET", path);
    return this.parseJson<GitHubIssue>(response);
  }

  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    patch: Record<string, unknown>,
  ): Promise<GitHubIssue> {
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`;
    const response = await this.request("PATCH", path, patch);
    return this.parseJson<GitHubIssue>(response);
  }

  async listIssueComments(
    owner: string,
    repo: string,
    issueNumber: number,
    params: { per_page?: number; page?: number } = {},
  ): Promise<GitHubIssueComment[]> {
    const search = new URLSearchParams({
      per_page: String(params.per_page ?? 100),
      page: String(params.page ?? 1),
    });
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments?${search}`;
    const response = await this.request("GET", path);
    return this.parseJson<GitHubIssueComment[]>(response);
  }

  async createIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<GitHubIssueComment> {
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments`;
    const response = await this.request("POST", path, { body });
    return this.parseJson<GitHubIssueComment>(response);
  }

  async listAssignees(
    owner: string,
    repo: string,
    params: { per_page?: number; page?: number } = {},
  ): Promise<GitHubAssignee[]> {
    const search = new URLSearchParams({
      per_page: String(params.per_page ?? 100),
      page: String(params.page ?? 1),
    });
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/assignees?${search}`;
    const response = await this.request("GET", path);
    return this.parseJson<GitHubAssignee[]>(response);
  }

  /** Create a new issue. Returns the created issue (same shape as list/get). */
  async createIssue(
    owner: string,
    repo: string,
    input: {
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
    },
  ): Promise<GitHubIssue> {
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
    const payload: Record<string, unknown> = {
      title: input.title,
      body: input.body ?? "",
      labels: input.labels ?? [],
    };
    if (input.assignees !== undefined) {
      payload.assignees = input.assignees;
    }
    const response = await this.request("POST", path, payload);
    return this.parseJson<GitHubIssue>(response);
  }
}
