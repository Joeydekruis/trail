import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolvePreviewPreloadPath(): string {
  const candidates = [
    join(__dirname, "../preload/preview-preload.js"),
    join(__dirname, "../../preload/preview-preload.js"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}