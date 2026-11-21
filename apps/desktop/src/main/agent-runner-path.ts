import { existsSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";

/** Built as `out/main/utility/agent-runner.js` (see electron.vite.config). */
export function resolveAgentRunnerUtilityPath(): string {
  const devCandidates = [
    join(__dirname, "utility/agent-runner.js"),
    join(__dirname, "../utility/agent-runner.js"),
  ];
  for (const candidate of devCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  if (app.isPackaged) {
    const packaged = join(
      process.resourcesPath,
      "app.asar",
      "out",
      "main",
      "utility",
      "agent-runner.js",
    );
    if (existsSync(packaged)) {
      return packaged;
    }
  }
  return devCandidates[0];
}