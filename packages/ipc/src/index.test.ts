import { describe, expect, it } from "vitest";
import { workspaceListResult, workspaceSwitchPayload } from "./index.js";

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
      workspaces: [
        {
          id: "trail",
          name: "Trail",
          shortLabel: "T",
          repository: null,
          integrationBranch: "development",
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