import { describe, expect, it } from "vitest";
import { issueNumberFromRef, worktreeCtaForIssue } from "./worktree-session";
import type { WorktreeDto } from "@trail/ipc";

describe("worktree-session helpers", () => {
  it("parses issue refs", () => {
    expect(issueNumberFromRef("#42")).toBe(42);
    expect(issueNumberFromRef("nope")).toBeNull();
  });

  it("switches CTA when a worktree exists", () => {
    const worktrees: WorktreeDto[] = [
      {
        id: "trail:42",
        issueNumber: 42,
        title: "Fix",
        branch: "agent/42-fix",
        path: "/tmp/42",
        status: "queued",
        isRemote: false,
        createdAt: new Date().toISOString(),
      },
    ];
    expect(worktreeCtaForIssue(worktrees, 42)).toBe("Open worktree");
    expect(worktreeCtaForIssue(worktrees, 7)).toBe("Start in worktree");
  });
});