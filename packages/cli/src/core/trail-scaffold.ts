import fs from "node:fs";
import path from "node:path";

import { TRAIL_AGENTS_MD } from "../cli/templates/trail-agents.md.js";
import { TRAIL_README_MD } from "../cli/templates/trail-readme.md.js";
import { ROOT_AGENTS_MD } from "../cli/templates/user-agents.md.js";

export const TRAIL_GITIGNORE_LINES = ["snapshot.json", "export/", "*.tmp"];

export type TrailScaffoldOptions = {
  /** When true, do not write \`AGENTS.md\` at the repository root. */
  skipRootAgentsMd?: boolean;
  /** When true, refresh managed root \`AGENTS.md\` if it matches a Trail template. */
  update?: boolean;
};

export type TrailScaffoldResult = {
  wroteTrailReadme: boolean;
  wroteTrailAgents: boolean;
  wroteRootAgents: boolean;
  skippedRootAgents: boolean;
  wroteGitignore: boolean;
};

const LEGACY_ROOT_AGENTS_HEADER = "# Trail — Agent workflow";

/** True when root \`AGENTS.md\` was written by Trail and can be refreshed safely. */
export function isManagedRootAgentsMd(content: string): boolean {
  const trimmed = content.trimStart();
  if (trimmed.startsWith(LEGACY_ROOT_AGENTS_HEADER)) {
    return true;
  }
  return trimmed.startsWith("# AI agents") && trimmed.includes(".trail/AGENTS.md");
}

function writeIfChanged(filePath: string, content: string): boolean {
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf-8");
    if (existing === normalized) {
      return false;
    }
  }
  fs.writeFileSync(filePath, normalized, "utf-8");
  return true;
}

/** Ensures \`.trail/tasks/\` exists. */
export function ensureTrailDirectories(root: string): void {
  fs.mkdirSync(path.join(root, ".trail", "tasks"), { recursive: true });
}

/** Writes or refreshes Trail scaffold files under \`.trail/\` and optional root \`AGENTS.md\`. */
export function writeTrailScaffold(root: string, options: TrailScaffoldOptions = {}): TrailScaffoldResult {
  const trailDir = path.join(root, ".trail");
  ensureTrailDirectories(root);

  const wroteTrailReadme = writeIfChanged(path.join(trailDir, "README.md"), TRAIL_README_MD);
  const wroteTrailAgents = writeIfChanged(path.join(trailDir, "AGENTS.md"), TRAIL_AGENTS_MD);
  const wroteGitignore = writeIfChanged(
    path.join(trailDir, ".gitignore"),
    `${TRAIL_GITIGNORE_LINES.join("\n")}\n`,
  );

  let wroteRootAgents = false;
  let skippedRootAgents = false;

  if (options.skipRootAgentsMd === true) {
    skippedRootAgents = true;
  } else {
    const rootAgentsPath = path.join(root, "AGENTS.md");
    const shouldWriteRoot =
      !fs.existsSync(rootAgentsPath) ||
      (options.update === true && isManagedRootAgentsMd(fs.readFileSync(rootAgentsPath, "utf-8")));

    if (shouldWriteRoot) {
      wroteRootAgents = writeIfChanged(rootAgentsPath, ROOT_AGENTS_MD);
    } else {
      skippedRootAgents = true;
    }
  }

  return {
    wroteTrailReadme,
    wroteTrailAgents,
    wroteRootAgents,
    skippedRootAgents,
    wroteGitignore,
  };
}
