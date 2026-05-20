import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { readTrailConfig, writeTrailConfig } from "./config-update.js";
import { trailPaths } from "./paths.js";

describe("writeTrailConfig", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("writes validated config and preserves reads", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-config-"));
    tmpDirs.push(root);
    const trailDir = path.join(root, ".trail");
    fs.mkdirSync(path.join(trailDir, "tasks"), { recursive: true });
    fs.writeFileSync(
      path.join(trailDir, "config.json"),
      JSON.stringify({
        github: { owner: "old", repo: "old" },
        sync: {
          preset: "solo",
          auto_sync_on_command: false,
          ui_poll_interval_seconds: 30,
          ui_idle_backoff: true,
        },
        last_full_sync_at: "2026-04-10T12:00:00.000Z",
      }),
    );

    const paths = trailPaths(root);
    writeTrailConfig(paths, {
      github: { owner: "acme", repo: "widgets" },
      sync: {
        preset: "collaborative",
        auto_sync_on_command: true,
        ui_poll_interval_seconds: 60,
        ui_idle_backoff: false,
      },
      last_full_sync_at: "2026-04-10T12:00:00.000Z",
    });

    const onDisk = readTrailConfig(paths);
    expect(onDisk.github).toEqual({ owner: "acme", repo: "widgets" });
    expect(onDisk.sync.ui_poll_interval_seconds).toBe(60);
    expect(onDisk.last_full_sync_at).toBe("2026-04-10T12:00:00.000Z");
  });
});
