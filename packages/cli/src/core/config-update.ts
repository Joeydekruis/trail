import fs from "node:fs";

import { TrailConfigSchema, type TrailConfig } from "../schemas/config.js";
import type { TrailPaths } from "./paths.js";

export function readTrailConfig(paths: TrailPaths): TrailConfig {
  const raw = fs.readFileSync(paths.configPath, "utf-8");
  return TrailConfigSchema.parse(JSON.parse(raw) as unknown);
}

export function writeTrailConfig(paths: TrailPaths, config: TrailConfig): void {
  const validated = TrailConfigSchema.parse(config);
  fs.writeFileSync(
    paths.configPath,
    `${JSON.stringify(validated, null, 2)}\n`,
    "utf-8",
  );
}

export function writeLastFullSyncAt(paths: TrailPaths, iso: string): void {
  const config = readTrailConfig(paths);
  writeTrailConfig(paths, { ...config, last_full_sync_at: iso });
}
