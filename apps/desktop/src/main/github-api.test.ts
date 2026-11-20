import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubBranches, fetchGitHubIssueComments } from "./github-api";

describe("fetchGitHubBranches", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("page=1")) {
          return new Response(JSON.stringify([{ name: "main" }, { name: "develop" }]), {
            status: 200,
          });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns sorted branch names from the GitHub API", async () => {
    const result = await fetchGitHubBranches("token", "acme", "widget");
    expect(result).toEqual({ ok: true, branches: ["develop", "main"] });
  });

  it("fetches paginated issue comments", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/comments")) {
          return new Response(
            JSON.stringify([{ user: { login: "dev" }, body: "Ship it", created_at: "2026-01-01T00:00:00Z" }]),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );
    const result = await fetchGitHubIssueComments("token", "acme", "widget", 42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]?.body).toBe("Ship it");
    }
  });

  it("surfaces API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ message: "Not Found" }), { status: 404 })),
    );
    const result = await fetchGitHubBranches("token", "acme", "missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Not Found");
    }
  });
});