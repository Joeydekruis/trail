import { beforeEach, describe, expect, it, vi } from "vitest";

const execFileSyncMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({
  execFileSync: execFileSyncMock,
}));

import { resolveGitHubToken } from "./auth.js";

describe("resolveGitHubToken", () => {
  beforeEach(() => {
    execFileSyncMock.mockReset();
  });

  it("returns trimmed token when GITHUB_TOKEN is non-empty", () => {
    const result = resolveGitHubToken({ GITHUB_TOKEN: "  ghp_secret  " });
    expect(result).toEqual({ ok: true, token: "ghp_secret" });
  });

  it("does not call gh when GITHUB_TOKEN is set", () => {
    resolveGitHubToken({ GITHUB_TOKEN: "tok" });
    expect(execFileSyncMock).not.toHaveBeenCalled();
  });

  it("falls back to gh auth token when GITHUB_TOKEN is unset", () => {
    execFileSyncMock.mockReturnValue("ghp_from_cli\n");
    const result = resolveGitHubToken({});
    expect(result).toEqual({ ok: true, token: "ghp_from_cli" });
    expect(execFileSyncMock).toHaveBeenCalledWith("gh", ["auth", "token"], {
      encoding: "utf-8",
    });
  });

  it("falls back to gh when GITHUB_TOKEN is only whitespace", () => {
    execFileSyncMock.mockReturnValue("tok\n");
    const result = resolveGitHubToken({ GITHUB_TOKEN: "   \t  " });
    expect(result).toEqual({ ok: true, token: "tok" });
  });

  it("returns AUTH_REQUIRED when gh is not available (ENOENT)", () => {
    const err = new Error("spawnSync gh ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    execFileSyncMock.mockImplementation(() => {
      throw err;
    });

    const result = resolveGitHubToken({});

    expect(result).toEqual({
      ok: false,
      error: {
        code: "AUTH_REQUIRED",
        message:
          "No GitHub token found; could not read from environment or gh CLI",
        hint: "Set GITHUB_TOKEN or install gh and run gh auth login",
      },
    });
  });

  it("returns AUTH_REQUIRED when gh exits with an error", () => {
    const err = new Error("Command failed") as NodeJS.ErrnoException & {
      status: number;
    };
    err.status = 1;
    execFileSyncMock.mockImplementation(() => {
      throw err;
    });

    const result = resolveGitHubToken({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
      expect(result.error.hint).toBe(
        "Set GITHUB_TOKEN or install gh and run gh auth login",
      );
    }
  });

  it("returns AUTH_REQUIRED when gh returns an empty token", () => {
    execFileSyncMock.mockReturnValue("  \n  ");
    const result = resolveGitHubToken({});

    expect(result).toEqual({
      ok: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "GitHub CLI returned an empty token",
        hint: "Set GITHUB_TOKEN or install gh and run gh auth login",
      },
    });
  });
});
