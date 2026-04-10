import * as childProcess from "node:child_process";
import type { TrailError } from "./errors.js";

export type ResolveTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: TrailError };

const AUTH_HINT =
  "Set GITHUB_TOKEN or install gh and run gh auth login";

function authRequired(message: string): ResolveTokenResult {
  return {
    ok: false,
    error: {
      code: "AUTH_REQUIRED",
      message,
      hint: AUTH_HINT,
    },
  };
}

/**
 * Resolves a GitHub API token from `GITHUB_TOKEN` (trimmed) or `gh auth token`.
 */
export function resolveGitHubToken(
  env?: NodeJS.ProcessEnv,
): ResolveTokenResult {
  const e = env ?? process.env;
  const fromEnv = e.GITHUB_TOKEN;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return { ok: true, token: fromEnv.trim() };
  }

  try {
    const out = childProcess.execFileSync("gh", ["auth", "token"], {
      encoding: "utf-8",
    });
    const token = out.trim();
    if (token === "") {
      return authRequired("GitHub CLI returned an empty token");
    }
    return { ok: true, token };
  } catch {
    return authRequired(
      "No GitHub token found; could not read from environment or gh CLI",
    );
  }
}
