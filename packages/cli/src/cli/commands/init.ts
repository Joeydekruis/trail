import * as childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { TrailConfigSchema } from "../../schemas/config.js";
import type { TrailError } from "../../core/errors.js";

const GITIGNORE_LINES = ["snapshot.json", "export/", "*.tmp"];

/**
 * Parses a GitHub `origin` remote URL into owner and repo name.
 * Supports https and git@ SSH forms for github.com.
 */
export function parseRemoteUrl(remoteUrl: string): { owner: string; repo: string } | null {
  const trimmed = remoteUrl.trim();

  const sshMatch = /^git@github\.com:([^/]+)\/([^/\s]+)$/.exec(trimmed);
  if (sshMatch) {
    const owner = sshMatch[1];
    const repoRaw = sshMatch[2];
    if (owner === undefined || repoRaw === undefined) {
      return null;
    }
    let repo = repoRaw;
    if (repo.endsWith(".git")) {
      repo = repo.slice(0, -".git".length);
    }
    return { owner, repo };
  }

  const httpsMatch = /^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)/.exec(trimmed);
  if (httpsMatch) {
    const owner = httpsMatch[1];
    const repoRaw = httpsMatch[2];
    if (owner === undefined || repoRaw === undefined) {
      return null;
    }
    let repo = repoRaw;
    if (repo.endsWith(".git")) {
      repo = repo.slice(0, -".git".length);
    }
    return { owner, repo };
  }

  return null;
}

function resolveGitRepoRoot(cwd: string): string {
  try {
    const out = childProcess.execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf-8",
    });
    return out.trim();
  } catch {
    return cwd;
  }
}

function getOriginRemoteUrl(repoRoot: string): string | null {
  try {
    return childProcess.execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}

export type InitOptions = {
  preset: "solo" | "collaborative" | "offline";
  owner?: string;
  repo?: string;
};

export function runInit(options: InitOptions): void {
  const cwd = process.cwd();
  const root = path.resolve(resolveGitRepoRoot(cwd));
  const configPath = path.join(root, ".trail", "config.json");

  if (fs.existsSync(configPath)) {
    const err: TrailError = {
      code: "VALIDATION_FAILED",
      message: "Trail is already initialized (.trail/config.json exists).",
    };
    throw err;
  }

  const hasOwner = options.owner !== undefined && options.owner !== "";
  const hasRepo = options.repo !== undefined && options.repo !== "";
  if (hasOwner !== hasRepo) {
    const err: TrailError = {
      code: "VALIDATION_FAILED",
      message: "Provide both --owner and --repo, or neither to use git remote origin.",
    };
    throw err;
  }

  let owner: string;
  let repo: string;

  if (hasOwner && hasRepo) {
    owner = options.owner as string;
    repo = options.repo as string;
  } else {
    const remoteUrl = getOriginRemoteUrl(root);
    const parsed = remoteUrl ? parseRemoteUrl(remoteUrl) : null;
    if (!parsed) {
      const err: TrailError = {
        code: "VALIDATION_FAILED",
        message:
          "Could not determine GitHub owner/repo. Set --owner and --repo or add a github.com origin remote.",
      };
      throw err;
    }
    owner = parsed.owner;
    repo = parsed.repo;
  }

  const preset = options.preset;
  const config = TrailConfigSchema.parse({
    github: { owner, repo },
    sync: {
      preset,
      auto_sync_on_command: preset === "collaborative",
      ui_poll_interval_seconds: 30,
      ui_idle_backoff: true,
    },
  });

  const trailDir = path.join(root, ".trail");
  const tasksDir = path.join(trailDir, "tasks");
  fs.mkdirSync(trailDir, { recursive: true });
  fs.mkdirSync(tasksDir, { recursive: true });

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");

  const gitignorePath = path.join(trailDir, ".gitignore");
  fs.writeFileSync(gitignorePath, `${GITIGNORE_LINES.join("\n")}\n`, "utf-8");

  console.log(`Initialized Trail project at ${root}`);
}
