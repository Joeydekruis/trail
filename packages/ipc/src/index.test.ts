import { describe, expect, it } from "vitest";
import {
  githubSetTokenPayload,
  workspaceCreatePayload,
  workspaceListResult,
  workspaceSwitchPayload,
} from "./index.js";

describe("workspaceSwitchPayload", () => {
  it("accepts a workspace id", () => {
    expect(workspaceSwitchPayload.parse({ workspaceId: "trail" })).toEqual({
      workspaceId: "trail",
    });
  });

  it("rejects empty id", () => {
    expect(() => workspaceSwitchPayload.parse({ workspaceId: "" })).toThrow();
  });
});

describe("workspaceListResult", () => {
  it("accepts a workspace list snapshot", () => {
    const parsed = workspaceListResult.parse({
      activeWorkspaceId: "trail",
      needsOnboarding: false,
      github: { connected: true, login: "you" },
      activeLastSyncedAt: null,
      workspaces: [
        {
          id: "trail",
          name: "Trail",
          shortLabel: "T",
          repository: null,
          integrationBranch: "development",
          productionBranch: "main",
          accent: "#4af7a3",
          accentSoft: "#0f2219",
          accentLine: "#1c4733",
          onAccent: "#04140c",
        },
      ],
    });
    expect(parsed.activeWorkspaceId).toBe("trail");
  });
});

describe("workspaceCreatePayload", () => {
  it("accepts owner/repo", () => {
    expect(
      workspaceCreatePayload.parse({
        repository: "acme/widget",
        integrationBranch: "main",
      }),
    ).toEqual({
      repository: "acme/widget",
      integrationBranch: "main",
    });
  });
});

describe("githubSetTokenPayload", () => {
  it("requires a non-empty token", () => {
    expect(() => githubSetTokenPayload.parse({ token: "" })).toThrow();
  });
});