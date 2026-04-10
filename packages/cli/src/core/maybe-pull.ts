import { resolveGitHubToken } from "./auth.js";
import { formatTrailError } from "./errors.js";
import { GitHubClient } from "./github-client.js";
import type { TrailPaths } from "./paths.js";
import { pullSync } from "./sync.js";
import type { TrailConfig } from "../schemas/config.js";

/**
 * When `auto_sync_on_command` is on and preset is not offline, attempts a pull
 * before read-only commands. On missing token or pull failure, prints a
 * warning to stderr and continues with local task files.
 */
export async function maybePullBeforeRead(
  config: TrailConfig,
  paths: TrailPaths,
): Promise<void> {
  if (!config.sync.auto_sync_on_command || config.sync.preset === "offline") {
    return;
  }

  const tokenResult = resolveGitHubToken();
  if (!tokenResult.ok) {
    console.warn(
      `Warning: ${formatTrailError(tokenResult.error)} — continuing with local tasks.`,
    );
    return;
  }

  const client = new GitHubClient(tokenResult.token);
  const { owner, repo } = config.github;
  try {
    await pullSync({ client, owner, repo, tasksDir: paths.tasksDir });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`Warning: auto-pull failed (${msg}) — continuing with local tasks.`);
  }
}
