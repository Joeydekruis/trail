import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitHubClient } from "./github-client.js";

describe("GitHubClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listIssues requests the expected URL and Authorization header", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new GitHubClient("ghp_test_token");
    await client.listIssues("acme", "widgets", {
      state: "open",
      per_page: 30,
      page: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit | undefined,
    ];
    expect(url).toBe(
      "https://api.github.com/repos/acme/widgets/issues?state=open&per_page=30&page=1",
    );
    expect(init?.method).toBe("GET");
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer ghp_test_token");
    expect(headers.get("Accept")).toBe("application/vnd.github+json");
    expect(headers.get("X-GitHub-Api-Version")).toBe("2022-11-28");
    expect(headers.get("User-Agent")).toBe("trail-cli/0.0.1");
  });

  it("createIssue POSTs JSON body and returns parsed issue", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const issue = {
      number: 42,
      title: "Hello",
      body: "World",
      state: "open",
      labels: [{ name: "bug" }],
      assignee: null,
      milestone: null,
      html_url: "https://github.com/acme/widgets/issues/42",
      updated_at: "2026-04-10T12:00:00Z",
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(issue), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new GitHubClient("ghp_test_token");
    const out = await client.createIssue("acme", "widgets", {
      title: "Hello",
      body: "World",
      labels: ["bug"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("https://api.github.com/repos/acme/widgets/issues");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      title: "Hello",
      body: "World",
      labels: ["bug"],
    });
    expect(out.number).toBe(42);
    expect(out.html_url).toBe("https://github.com/acme/widgets/issues/42");
  });
});
