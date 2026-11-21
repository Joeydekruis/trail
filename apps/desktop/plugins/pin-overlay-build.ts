import { build } from "esbuild";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function pinOverlayBuildPlugin(): Plugin {
  const root = resolve(__dirname, "..");
  return {
    name: "trail-pin-overlay-build",
    async closeBundle() {
      await build({
        entryPoints: [resolve(root, "src/preview/pin-overlay.ts")],
        bundle: true,
        format: "iife",
        platform: "browser",
        target: "chrome120",
        outfile: resolve(root, "out/preview/pin-overlay.js"),
        logLevel: "info",
      });
    },
  };
}