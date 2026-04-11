import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["server/start.ts"],
  outDir: "dist-server",
  format: ["esm"],
  platform: "node",
  target: "node22",
  sourcemap: true,
  clean: true,
  bundle: true,
  external: ["hono", "@hono/node-server", "@trail-pm/cli"],
});
