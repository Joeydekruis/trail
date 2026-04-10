import fs from "node:fs";
import path from "node:path";

const MAX_TRAIL_ROOT_WALK = 20;

/**
 * Walks upward from `startDir` looking for a Trail project root: a directory
 * that contains `.trail/config.json`.
 *
 * @returns The **project root** directory (the parent of the `.trail` folder),
 *   or `null` if none is found within the walk limit. This is not the path to
 *   `.trail` itself — use {@link trailPaths} for `.trail`-relative paths.
 */
export function findTrailRoot(startDir: string): string | null {
  let dir = path.resolve(startDir);
  for (let i = 0; i < MAX_TRAIL_ROOT_WALK; i++) {
    const configPath = path.join(dir, ".trail", "config.json");
    if (fs.existsSync(configPath)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

export interface TrailPaths {
  root: string;
  trailDir: string;
  tasksDir: string;
  configPath: string;
  snapshotPath: string;
  gitignorePath: string;
}

/** Resolved paths under a Trail project root (the directory that contains `.trail`). */
export function trailPaths(root: string): TrailPaths {
  const trailDir = path.join(root, ".trail");
  return {
    root,
    trailDir,
    tasksDir: path.join(trailDir, "tasks"),
    configPath: path.join(trailDir, "config.json"),
    snapshotPath: path.join(trailDir, "snapshot.json"),
    gitignorePath: path.join(trailDir, ".gitignore"),
  };
}
