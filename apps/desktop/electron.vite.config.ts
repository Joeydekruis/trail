import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const analyze = process.env.DESKTOP_ANALYZE === "1";

const bundleMainPreload = {
  build: {
    rollupOptions: {
      external: ["electron", "better-sqlite3"],
    },
    sourcemap: false,
  },
};

export default defineConfig({
  main: bundleMainPreload,
  preload: {
    build: {
      rollupOptions: {
        external: ["electron"],
      },
      sourcemap: false,
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [
      react(),
      analyze &&
        visualizer({
          filename: resolve("out/renderer/stats.html"),
          gzipSize: true,
          template: "treemap",
        }),
    ].filter(Boolean),
    build: {
      sourcemap: false,
    },
  },
});