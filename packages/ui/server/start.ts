import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { findTrailRoot } from "@trail-pm/cli/lib";

import { createApi } from "./api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `server/*.ts` → `../dist`; `dist-server/*.js` → `../dist` */
const distDir = path.resolve(__dirname, "..", "dist");

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

const hasClient = existsSync(path.join(distDir, "index.html"));
const app = buildApp(root, hasClient);
const port = Number(process.env.TRAIL_UI_PORT ?? process.env.TRAIL_API_PORT) || 4700;

serve({ fetch: app.fetch, port }, (info) => {
  if (hasClient) {
    console.log(`Trail UI + API at http://localhost:${info.port}`);
  } else {
    console.log(
      `Trail API at http://localhost:${info.port} (build the client with npm run build, or use npm run dev:all)`,
    );
  }
});
