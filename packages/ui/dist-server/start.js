// server/start.ts
import { existsSync as existsSync2 } from "fs";
import path from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

// server/ensure-cli-built.ts
import { existsSync } from "fs";
import { fileURLToPath } from "url";
var REQUIRED_EXPORTS = [
  "GitHubClient",
  "publishTaskToGitHub",
  "pushLinkedTaskToGitHub",
  "resolveGitHubToken",
  "shouldPublishTaskToGitHub",
  "listDocs",
  "readDocFile",
  "writeDocFile",
  "deleteDocFile"
];
function resolveCliLibPath() {
  try {
    return fileURLToPath(import.meta.resolve("@trail-pm/cli/lib"));
  } catch {
    return null;
  }
}
async function ensureCliLibBuilt() {
  const libPath = resolveCliLibPath();
  if (!libPath || !existsSync(libPath)) {
    console.error(
      "@trail-pm/cli is not built (missing dist/lib.js).\nFrom the trail monorepo root, run:\n  npm run build --workspace=@trail-pm/cli\nOr for development:\n  npm run ui:dev"
    );
    process.exit(1);
  }
  let lib;
  try {
    lib = await import("@trail-pm/cli/lib");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `Could not load @trail-pm/cli/lib (${message}).
Rebuild: npm run build --workspace=@trail-pm/cli`
    );
    process.exit(1);
  }
  const missing = REQUIRED_EXPORTS.filter((name) => lib[name] === void 0);
  if (missing.length > 0) {
    console.error(
      `@trail-pm/cli is missing exports: ${missing.join(", ")}.
Rebuild the CLI package: npm run build --workspace=@trail-pm/cli`
    );
    process.exit(1);
  }
}

// server/start.ts
var __dirname = path.dirname(fileURLToPath2(import.meta.url));
var distDir = path.resolve(__dirname, "..", "dist");
await ensureCliLibBuilt();
var { findTrailRoot } = await import("@trail-pm/cli/lib");
var { createApi } = await import("./api-BA4YFDXN.js");
function buildApp(trailRoot, hasClient) {
  const app2 = createApi(trailRoot);
  if (hasClient) {
    app2.use("/*", async (c, next) => {
      if (c.req.path.startsWith("/api")) {
        return next();
      }
      return serveStatic({
        root: distDir,
        rewriteRequestPath: (reqPath) => {
          if (reqPath === "/" || reqPath === "") {
            return "/index.html";
          }
          if (reqPath.includes(".") && !reqPath.endsWith("/")) {
            return reqPath;
          }
          return "/index.html";
        }
      })(c, next);
    });
  }
  return app2;
}
var root = findTrailRoot(process.cwd());
if (!root) {
  console.error("Not a Trail repository. Run `trail init` first.");
  process.exit(1);
}
var devMode = process.env.TRAIL_DEV === "1";
var hasBuiltClient = !devMode && existsSync2(path.join(distDir, "index.html"));
var app = buildApp(root, hasBuiltClient);
var port = Number(process.env.TRAIL_API_PORT ?? process.env.TRAIL_UI_PORT) || 4700;
if (!devMode && !hasBuiltClient) {
  console.error(
    "Trail UI client is not built (packages/ui/dist/index.html missing).\nFrom the repo root, run:\n  npm run build --workspace=@trail-pm/ui\nOr use hot-reload development:\n  npm run ui:dev\nThen open http://localhost:4701 (not 4700)."
  );
  process.exit(1);
}
var server = serve({ fetch: app.fetch, port }, (info) => {
  if (hasBuiltClient) {
    console.log(`Trail UI + API at http://localhost:${info.port}`);
  } else if (devMode) {
    console.log(
      `Trail API at http://localhost:${info.port} (Vite dev UI proxies /api here)`
    );
    console.log("Open the UI at http://localhost:4701");
  }
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use (another Trail server is probably still running).`
    );
    console.error(
      "Stop it, then try again. On Windows PowerShell:"
    );
    console.error(
      `  Get-NetTCPConnection -LocalPort ${port} | Select OwningProcess`
    );
    console.error(`  Stop-Process -Id <PID> -Force`);
    console.error(
      "Or run: node packages/ui/scripts/free-dev-ports.mjs"
    );
    process.exit(1);
  }
  throw err;
});
//# sourceMappingURL=start.js.map