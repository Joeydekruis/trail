import { serve } from "@hono/node-server";
import { createApi } from "./api.js";
import { findTrailRoot } from "../../cli/src/core/paths.js";

const root = findTrailRoot(process.cwd());
if (!root) {
  console.error("Not a Trail repository. Run `trail init` first.");
  process.exit(1);
}

const app = createApi(root);
const port = Number(process.env.TRAIL_API_PORT) || 4700;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Trail API server running on http://localhost:${info.port}`);
});
