import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Command, Option } from "commander";
import { ZodError } from "zod";

import { formatTrailError, type TrailError, type TrailErrorCode } from "../core/errors.js";
import { isTaskStoreValidationError } from "../core/task-store.js";
import { runInit } from "./commands/init.js";
import { runSync } from "./commands/sync.js";

function readCliVersion(): string {
  /** `package.json` lives next to `src/` and `dist/`; entry is `src/index.ts` / `dist/index.js`. */
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

const TRAIL_ERROR_CODES = new Set<TrailErrorCode>([
  "AUTH_REQUIRED",
  "AUTH_FAILED",
  "NOT_A_TRAIL_REPO",
  "VALIDATION_FAILED",
  "GITHUB_API",
  "SYNC_CONFLICT",
]);

function isTrailError(value: unknown): value is TrailError {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("code" in value) || !("message" in value)) {
    return false;
  }
  const code = (value as { code: unknown }).code;
  return typeof code === "string" && TRAIL_ERROR_CODES.has(code as TrailErrorCode);
}

/** Maps thrown values to a stderr line for `trail` when exiting with code 1. */
export function getCliFailureMessage(err: unknown): string {
  if (isTrailError(err)) {
    return formatTrailError(err);
  }
  if (err instanceof Error && isTaskStoreValidationError(err)) {
    return formatTrailError(err.trailError);
  }
  if (err instanceof ZodError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();
  program.name("trail").description("GitHub-native task management CLI").version(readCliVersion());

  program
    .command("init")
    .description("Initialize a Trail project in the current git repository")
    .addOption(
      new Option("--preset <name>", "Sync preset")
        .choices(["solo", "collaborative", "offline"] as const)
        .default("solo"),
    )
    .option("--owner <name>", "GitHub repository owner (with --repo)")
    .option("--repo <name>", "GitHub repository name (with --owner)")
    .action((opts: { preset: "solo" | "collaborative" | "offline"; owner?: string; repo?: string }) => {
      runInit({
        preset: opts.preset,
        owner: opts.owner,
        repo: opts.repo,
      });
    });

  program
    .command("sync")
    .description("Synchronize local tasks with GitHub Issues")
    .option("--pull", "Only pull from GitHub")
    .option("--push", "Only push to GitHub")
    .action(async (opts: { pull?: boolean; push?: boolean }) => {
      await runSync({ pull: opts.pull, push: opts.push });
    });

  await program.parseAsync(argv);
}
