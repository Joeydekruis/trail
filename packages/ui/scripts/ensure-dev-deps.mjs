/**
 * Ensures @trail-pm/cli is built before the dev API server starts.
 * Safe to run from packages/ui; resolves the monorepo root automatically.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findMonorepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (Array.isArray(pkg.workspaces)) {
          return dir;
        }
      } catch {
        /* ignore */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const root = findMonorepoRoot(path.join(__dirname, ".."));
if (!root) {
  console.error(
    "Could not find the Trail monorepo root (package.json with workspaces).",
  );
  process.exit(1);
}

const cliLib = path.join(root, "packages", "cli", "dist", "lib.js");
if (!existsSync(cliLib)) {
  console.log("Building @trail-pm/cli (dist/lib.js missing)…");
  execSync("npm run build --workspace=@trail-pm/cli", {
    cwd: root,
    stdio: "inherit",
  });
}
