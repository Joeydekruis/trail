import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolvePreviewOverlayScriptPath(): string {
  const candidates = [
    join(__dirname, "../preview/pin-overlay.js"),
    join(__dirname, "../../preview/pin-overlay.js"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}