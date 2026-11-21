import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cursorOpenFolderAttempts } from "@trail/core";

function launchDetached(executable: string, args: string[]): Promise<{ ok: true } | { ok: false; message: string }> {
  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      stdio: "ignore",
      detached: true,
      shell: process.platform === "win32",
    });
    child.on("error", (error) => {
      resolve({
        ok: false,
        message: error instanceof Error ? error.message : "Failed to start Cursor",
      });
    });
    child.on("spawn", () => {
      child.unref();
      resolve({ ok: true });
    });
  });
}

export async function openFolderInCursor(
  folderPath: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = folderPath.trim();
  if (!trimmed) {
    return { ok: false, message: "No worktree path" };
  }
  if (!existsSync(trimmed)) {
    return { ok: false, message: "Worktree folder not found on disk" };
  }

  const attempts = cursorOpenFolderAttempts(process.platform, trimmed);
  let lastMessage = "Cursor is not installed or not on PATH";
  for (const attempt of attempts) {
    const result = await launchDetached(attempt.executable, attempt.args);
    if (result.ok) {
      return result;
    }
    lastMessage = result.message;
  }
  return { ok: false, message: lastMessage };
}