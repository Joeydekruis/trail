import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Command, Option } from "commander";
import { ZodError } from "zod";

import { formatTrailError, type TrailError, type TrailErrorCode } from "../core/errors.js";
import { isTaskStoreValidationError } from "../core/task-store.js";
import { runDone } from "./commands/done.js";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { runNext } from "./commands/next.js";
import { runShow } from "./commands/show.js";
import { runStatus } from "./commands/status.js";
import { runSync } from "./commands/sync.js";
import { runUpdate, UPDATE_STATUS_CHOICES } from "./commands/update.js";
import { runValidate } from "./commands/validate.js";

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

  program
    .command("list")
    .description("List tasks (excludes done/cancelled unless --all)")
    .option("--all", "Include done and cancelled tasks")
    .addOption(
      new Option("--limit <n>", "Max tasks to show")
        .default(25)
        .argParser((v) => {
          const n = parseInt(v, 10);
          if (Number.isNaN(n) || n < 0) {
            throw new Error("--limit must be a non-negative integer");
          }
          return n;
        }),
    )
    .option("--status <status>", "Filter by status")
    .option("--label <label>", "Filter by label (must appear in task.labels)")
    .option("--json", "Print JSON array of slim task objects")
    .action(
      async (opts: {
        all?: boolean;
        limit: number;
        status?: string;
        label?: string;
        json?: boolean;
      }) => {
        await runList(opts);
      },
    );

  program
    .command("show")
    .description("Show one task by id")
    .argument("<id>", "Task id")
    .option("--json", "Print full task JSON")
    .action(async (id: string, opts: { json?: boolean }) => {
      await runShow({ id, json: opts.json });
    });

  program
    .command("status")
    .description("Task counts by status and last sync time")
    .option("--json", "Print JSON")
    .action(async (opts: { json?: boolean }) => {
      await runStatus(opts);
    });

  program
    .command("next")
    .description("Pick the next actionable task by priority and id")
    .option("--json", "Print full task JSON or null")
    .action(async (opts: { json?: boolean }) => {
      await runNext(opts);
    });

  program
    .command("update")
    .description("Update a task (local file; pushes to GitHub when linked and online)")
    .argument("<id>", "Task id")
    .addOption(new Option("--status <status>", "New status").choices(UPDATE_STATUS_CHOICES))
    .addOption(
      new Option("--priority <p>", "Priority").choices(["p0", "p1", "p2", "p3"] as const),
    )
    .option("--title <text>", "New title")
    .action(
      async (
        id: string,
        opts: {
          status?: (typeof UPDATE_STATUS_CHOICES)[number];
          priority?: "p0" | "p1" | "p2" | "p3";
          title?: string;
        },
      ) => {
        await runUpdate({
          id,
          status: opts.status,
          priority: opts.priority,
          title: opts.title,
        });
      },
    );

  program
    .command("done")
    .description("Mark a task done, optionally comment and close the GitHub issue")
    .argument("<id>", "Task id")
    .argument("<message...>", "Comment body for the linked issue (and suggested commit hint)")
    .action(async (id: string, messageParts: string[]) => {
      const message = messageParts.join(" ").trim();
      if (message === "") {
        throw new Error("Message is required");
      }
      await runDone({ id, message });
    });

  program
    .command("validate")
    .description("Compile snapshot and print validation warnings (exit 1 on dependency cycles)")
    .action(async () => {
      const code = await runValidate();
      process.exitCode = code;
    });

  await program.parseAsync(argv);
}
