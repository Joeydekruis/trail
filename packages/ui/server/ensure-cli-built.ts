import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REQUIRED_EXPORTS = [
  "GitHubClient",
  "publishTaskToGitHub",
  "pushLinkedTaskToGitHub",
  "resolveGitHubToken",
  "shouldPublishTaskToGitHub",
  "listDocs",
  "listDocTree",
  "readDocFile",
  "writeDocFile",
  "updateDocFile",
  "deleteDocFile",
  "createDocFolder",
] as const;

function resolveCliLibPath(): string | null {
  try {
    return fileURLToPath(import.meta.resolve("@trail-pm/cli/lib"));
  } catch {
    return null;
  }
}

/**
 * Fails fast when `@trail-pm/cli/lib` was not built (missing dist or stale exports).
 */
export async function ensureCliLibBuilt(): Promise<void> {
  const libPath = resolveCliLibPath();
  if (!libPath || !existsSync(libPath)) {
    console.error(
      "@trail-pm/cli is not built (missing dist/lib.js).\n" +
        "From the trail monorepo root, run:\n" +
        "  npm run build --workspace=@trail-pm/cli\n" +
        "Or for development:\n" +
        "  npm run ui:dev",
    );
    process.exit(1);
  }

  let lib: Record<string, unknown>;
  try {
    lib = (await import("@trail-pm/cli/lib")) as Record<string, unknown>;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `Could not load @trail-pm/cli/lib (${message}).\n` +
        "Rebuild: npm run build --workspace=@trail-pm/cli",
    );
    process.exit(1);
  }

  const missing = REQUIRED_EXPORTS.filter((name) => lib[name] === undefined);
  if (missing.length > 0) {
    console.error(
      `@trail-pm/cli is missing exports: ${missing.join(", ")}.\n` +
        "Rebuild the CLI package: npm run build --workspace=@trail-pm/cli",
    );
    process.exit(1);
  }
}
