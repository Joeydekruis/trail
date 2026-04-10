import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { addDependency, listDependencyEdges, removeDependency } from "./deps.js";

const baseTask = (id: string) => ({
  id,
  title: "T",
  status: "todo" as const,
  type: "feature" as const,
  labels: [] as string[],
  depends_on: [] as string[],
  blocks: [] as string[],
  refs: [] as { type: string; path: string }[],
  created_at: "2026-04-10T10:00:00.000Z",
  updated_at: "2026-04-10T10:00:00.000Z",
});

describe("deps", () => {
  it("addDependency links depends_on and blocks", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-deps-"));
    const a = { ...baseTask("1") };
    const b = { ...baseTask("2") };
    fs.writeFileSync(path.join(dir, "1.json"), `${JSON.stringify(a)}\n`, "utf8");
    fs.writeFileSync(path.join(dir, "2.json"), `${JSON.stringify(b)}\n`, "utf8");

    addDependency(dir, "1", "2", "2026-04-10T11:00:00.000Z");

    const a2 = JSON.parse(fs.readFileSync(path.join(dir, "1.json"), "utf8")) as {
      depends_on: string[];
      blocks: string[];
    };
    const b2 = JSON.parse(fs.readFileSync(path.join(dir, "2.json"), "utf8")) as {
      depends_on: string[];
      blocks: string[];
    };
    expect(a2.depends_on).toEqual(["2"]);
    expect(a2.blocks).toEqual([]);
    expect(b2.blocks).toEqual(["1"]);
  });

  it("removeDependency clears both sides", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-deps-"));
    const a = { ...baseTask("1"), depends_on: ["2"] };
    const b = { ...baseTask("2"), blocks: ["1"] };
    fs.writeFileSync(path.join(dir, "1.json"), `${JSON.stringify(a)}\n`, "utf8");
    fs.writeFileSync(path.join(dir, "2.json"), `${JSON.stringify(b)}\n`, "utf8");

    removeDependency(dir, "1", "2", "2026-04-10T12:00:00.000Z");

    const a2 = JSON.parse(fs.readFileSync(path.join(dir, "1.json"), "utf8")) as {
      depends_on: string[];
    };
    const b2 = JSON.parse(fs.readFileSync(path.join(dir, "2.json"), "utf8")) as {
      blocks: string[];
    };
    expect(a2.depends_on).toEqual([]);
    expect(b2.blocks).toEqual([]);
  });

  it("listDependencyEdges lists from→to for depends_on", () => {
    const t1 = { ...baseTask("1"), depends_on: ["2", "3"] };
    const t2 = { ...baseTask("2") };
    const edges = listDependencyEdges([t1, t2]);
    expect(edges).toEqual([
      { from: "1", to: "2" },
      { from: "1", to: "3" },
    ]);
  });
});
