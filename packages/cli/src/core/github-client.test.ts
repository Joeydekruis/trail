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
});
