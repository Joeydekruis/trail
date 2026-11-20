import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export type GitRunResult =
  | { ok: true; stdout: string }
  | { ok: false; message: string };

export function isGitRepository(repoRoot: string): boolean {
  const resolved = repoRoot.trim();
  if (!resolved) {
    return false;
  }
  return existsSync(join(resolved, ".git"));
}

export function runGit(cwd: string, args: string[]): GitRunResult {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) {
    return { ok: false, message: result.error.message };
  }
  if (result.status !== 0) {
    const stderr = (result.stderr ?? "").trim();
    const stdout = (result.stdout ?? "").trim();
    const detail = stderr || stdout || `git exited with code ${result.status}`;
    return { ok: false, message: detail };
  }
  return { ok: true, stdout: (result.stdout ?? "").trim() };
}