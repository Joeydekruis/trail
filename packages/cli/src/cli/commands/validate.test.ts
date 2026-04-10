import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { runValidate } from "./validate.js";

const minimalConfig = {
  github: { owner: "o", repo: "r" },
  sync: {
    preset: "offline" as const,
    auto_sync_on_command: false,
    ui_poll_interval_seconds: 60,
    ui_idle_backoff: true,
  },
};

function baseTask(id: string, depends_on: string[]) {
  return {
    id,
    title: "T",
    status: "todo" as const,
    type: "feature" as const,
    labels: [],
    depends_on,
    blocks: [],
    refs: [],
    created_at: "2026-04-10T10:00:00.000Z",
    updated_at: "2026-04-10T14:30:00.000Z",
  };
}

describe("runValidate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns exit code 1 when tasks contain a dependency cycle", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-validate-"));
    const trailDir = path.join(root, ".trail");
    const tasksDir = path.join(trailDir, "tasks");
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(
      path.join(trailDir, "config.json"),
      `${JSON.stringify(minimalConfig, null, 2)}\n`,
      "utf8",
    );
    fs.writeFileSync(
      path.join(tasksDir, "a.json"),
      `${JSON.stringify(baseTask("a", ["b"]))}\n`,
      "utf8",
    );
    fs.writeFileSync(
      path.join(tasksDir, "b.json"),
      `${JSON.stringify(baseTask("b", ["a"]))}\n`,
      "utf8",
    );

    vi.spyOn(process, "cwd").mockReturnValue(root);
    const code = await runValidate();
    expect(code).toBe(1);
  });

  it("returns exit code 0 when there is no cycle", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-validate-"));
    const trailDir = path.join(root, ".trail");
    const tasksDir = path.join(trailDir, "tasks");
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(
      path.join(trailDir, "config.json"),
      `${JSON.stringify(minimalConfig, null, 2)}\n`,
      "utf8",
    );
    fs.writeFileSync(
      path.join(tasksDir, "a.json"),
      `${JSON.stringify(baseTask("a", []))}\n`,
      "utf8",
    );

    vi.spyOn(process, "cwd").mockReturnValue(root);
    const code = await runValidate();
    expect(code).toBe(0);
  });
});
