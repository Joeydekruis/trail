import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { findTrailRoot, trailPaths } from "./paths.js";

describe("findTrailRoot", () => {
  it("returns the project root when .trail/config.json exists in an ancestor", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "trail-paths-"));
    const trailDir = path.join(tmpRoot, ".trail");
    fs.mkdirSync(trailDir, { recursive: true });
    fs.writeFileSync(path.join(trailDir, "config.json"), "{}", "utf-8");

    const nested = path.join(tmpRoot, "a", "b", "c");
    fs.mkdirSync(nested, { recursive: true });

    expect(findTrailRoot(nested)).toBe(tmpRoot);
  });

  it("returns null when no ancestor has .trail/config.json", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "trail-paths-"));
    const nested = path.join(tmpRoot, "x", "y");
    fs.mkdirSync(nested, { recursive: true });

    expect(findTrailRoot(nested)).toBeNull();
  });
});

describe("trailPaths", () => {
  it("joins standard paths under the given root", () => {
    const root = path.join(os.tmpdir(), "my-trail-project");
    const p = trailPaths(root);
    expect(p.root).toBe(root);
    expect(p.trailDir).toBe(path.join(root, ".trail"));
    expect(p.tasksDir).toBe(path.join(root, ".trail", "tasks"));
    expect(p.configPath).toBe(path.join(root, ".trail", "config.json"));
    expect(p.snapshotPath).toBe(path.join(root, ".trail", "snapshot.json"));
    expect(p.gitignorePath).toBe(path.join(root, ".trail", ".gitignore"));
  });
});
