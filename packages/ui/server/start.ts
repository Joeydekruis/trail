import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { ensureCliLibBuilt } from "./ensure-cli-built.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `server/*.ts` → `../dist`; `dist-server/*.js` → `../dist` */
const distDir = path.resolve(__dirname, "..", "dist");

await ensureCliLibBuilt();

const { findTrailRoot } = await import("@trail-pm/cli/lib");
const { createApi } = await import("./api.js");

function buildApp(trailRoot: string, hasClient: boolean) {
  const app = createApi(trailRoot);

  if (hasClient) {
    app.use("/*", async (c, next) => {
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
        },
      })(c, next);
    });
  }

  return app;
}

const root = findTrailRoot(process.cwd());
if (!root) {
  console.error("Not a Trail repository. Run `trail init` first.");
  process.exit(1);
}

/** Vite serves the SPA in `dev:all`; API-only unless production-style single server. */
const devMode = process.env.TRAIL_DEV === "1";
const hasBuiltClient =
  !devMode && existsSync(path.join(distDir, "index.html"));
const app = buildApp(root, hasBuiltClient);
const port = Number(process.env.TRAIL_API_PORT ?? process.env.TRAIL_UI_PORT) || 4700;

if (!devMode && !hasBuiltClient) {
  console.error(
    "Trail UI client is not built (packages/ui/dist/index.html missing).\n" +
      "From the repo root, run:\n" +
      "  npm run build --workspace=@trail-pm/ui\n" +
      "Or use hot-reload development:\n" +
      "  npm run ui:dev\n" +
      "Then open http://localhost:4701 (not 4700).",
  );
  process.exit(1);
}

const server = serve({ fetch: app.fetch, port }, (info) => {
  if (hasBuiltClient) {
    console.log(`Trail UI + API at http://localhost:${info.port}`);
  } else if (devMode) {
    console.log(
      `Trail API at http://localhost:${info.port} (Vite dev UI proxies /api here)`,
    );
    console.log("Open the UI at http://localhost:4701");
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use (another Trail server is probably still running).`,
    );
    console.error(
      "Stop it, then try again. On Windows PowerShell:",
    );
    console.error(
      `  Get-NetTCPConnection -LocalPort ${port} | Select OwningProcess`,
    );
    console.error(`  Stop-Process -Id <PID> -Force`);
    console.error(
      "Or run: node packages/ui/scripts/free-dev-ports.mjs",
    );
    process.exit(1);
  }
  throw err;
});
