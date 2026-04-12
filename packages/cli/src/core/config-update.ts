import fs from "node:fs";

import { TrailConfigSchema } from "../schemas/config.js";
import type { TrailPaths } from "./paths.js";

export function writeLastFullSyncAt(paths: TrailPaths, iso: string): void {
  const raw = fs.readFileSync(paths.configPath, "utf-8");
  const config = TrailConfigSchema.parse(JSON.parse(raw) as unknown);
  const next = { ...config, last_full_sync_at: iso };
  fs.writeFileSync(paths.configPath, `${JSON.stringify(next, null, 2)}\n`, "utf-8");
}
