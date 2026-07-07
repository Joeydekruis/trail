import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { TRAIL_AGENTS_MD } from "../cli/templates/trail-agents.md.js";
import { TRAIL_README_MD } from "../cli/templates/trail-readme.md.js";
import { ROOT_AGENTS_MD } from "../cli/templates/user-agents.md.js";
import {
  isManagedRootAgentsMd,
  writeTrailScaffold,
} from "./trail-scaffold.js";

describe("isManagedRootAgentsMd", () => {
  it("detects the legacy full root template", () => {
    expect(isManagedRootAgentsMd("# Trail — Agent workflow\n\nRun trail sync")).toBe(true);
  });

  it("detects the root pointer template", () => {
    expect(isManagedRootAgentsMd(ROOT_AGENTS_MD)).toBe(true);
  });

  it("rejects custom root AGENTS.md content", () => {
    expect(isManagedRootAgentsMd("# My project\n\nCustom agent rules")).toBe(false);
  });
});

describe("writeTrailScaffold", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  function makeRoot(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-scaffold-"));
    tmpDirs.push(root);
    fs.mkdirSync(path.join(root, ".trail"), { recursive: true });
    return root;
  }

  it("writes .trail README.md and AGENTS.md on first run", () => {
    const root = makeRoot();
    const result = writeTrailScaffold(root);

    expect(result.wroteTrailReadme).toBe(true);
    expect(result.wroteTrailAgents).toBe(true);
    expect(result.wroteRootAgents).toBe(true);
    expect(fs.readFileSync(path.join(root, ".trail", "README.md"), "utf-8")).toBe(TRAIL_README_MD);
    expect(fs.readFileSync(path.join(root, ".trail", "AGENTS.md"), "utf-8")).toBe(TRAIL_AGENTS_MD);
    expect(fs.readFileSync(path.join(root, "AGENTS.md"), "utf-8")).toBe(ROOT_AGENTS_MD);
  });

  it("skips root AGENTS.md when custom content exists", () => {
    const root = makeRoot();
    fs.writeFileSync(path.join(root, "AGENTS.md"), "# Custom\n", "utf-8");

    const result = writeTrailScaffold(root);

    expect(result.skippedRootAgents).toBe(true);
    expect(result.wroteRootAgents).toBe(false);
    expect(fs.readFileSync(path.join(root, "AGENTS.md"), "utf-8")).toBe("# Custom\n");
  });

  it("refreshes managed root AGENTS.md on update", () => {
    const root = makeRoot();
    fs.writeFileSync(
      path.join(root, "AGENTS.md"),
      "# Trail — Agent workflow\n\nOld template body\n",
      "utf-8",
    );

    const result = writeTrailScaffold(root, { update: true });

    expect(result.wroteRootAgents).toBe(true);
    expect(fs.readFileSync(path.join(root, "AGENTS.md"), "utf-8")).toBe(ROOT_AGENTS_MD);
  });

  it("does not overwrite custom root AGENTS.md on update", () => {
    const root = makeRoot();
    fs.writeFileSync(path.join(root, "AGENTS.md"), "# Custom\n", "utf-8");

    const result = writeTrailScaffold(root, { update: true });

    expect(result.skippedRootAgents).toBe(true);
    expect(fs.readFileSync(path.join(root, "AGENTS.md"), "utf-8")).toBe("# Custom\n");
  });

  it("creates tasks directory and .trail/.gitignore", () => {
    const root = makeRoot();
    writeTrailScaffold(root);

    expect(fs.existsSync(path.join(root, ".trail", "tasks"))).toBe(true);
    expect(fs.readFileSync(path.join(root, ".trail", ".gitignore"), "utf-8")).toBe(
      "snapshot.json\nexport/\n*.tmp\n",
    );
  });
});
