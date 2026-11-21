import { describe, expect, it } from "vitest";
import { defaultWorktreeRootForWorkspace } from "./settings.js";

describe("defaultWorktreeRootForWorkspace", () => {
  it("builds a path without node:path", () => {
    expect(defaultWorktreeRootForWorkspace("trail", "/Users/me")).toBe(
      "/Users/me/trail-worktrees/trail",
    );
  });
});