import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseTrailPreviewConfigYaml,
  previewConfigFromPackageJsonScripts,
  type TrailPreviewConfig,
} from "@trail/core";

export function loadTrailPreviewConfig(
  worktreePath: string,
  repoRoot: string | null,
): TrailPreviewConfig | null {
  const fromWorktree = readYamlConfig(join(worktreePath, ".trail", "config.yml"));
  if (fromWorktree) {
    return fromWorktree;
  }

  if (repoRoot?.trim()) {
    const fromRepo = readYamlConfig(join(repoRoot.trim(), ".trail", "config.yml"));
    if (fromRepo) {
      return fromRepo;
    }
  }

  const packagePath = join(worktreePath, "package.json");
  if (!existsSync(packagePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    return previewConfigFromPackageJsonScripts(parsed.scripts);
  } catch {
    return null;
  }
}

function readYamlConfig(path: string): TrailPreviewConfig | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return parseTrailPreviewConfigYaml(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}