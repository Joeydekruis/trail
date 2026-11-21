import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { pinOverlayBuildPlugin } from "./plugins/pin-overlay-build";

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
  main: {
    ...bundleMainPreload,
    build: {
      ...bundleMainPreload.build,
      rollupOptions: {
        ...bundleMainPreload.build.rollupOptions,
        input: {
          index: resolve("src/main/index.ts"),
          "utility/agent-runner": resolve("src/utility/agent-runner.ts"),
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === "utility/agent-runner"
              ? "utility/agent-runner.js"
              : "[name].js",
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/preload/index.ts"),
          "preview-preload": resolve("src/preload/preview-preload.ts"),
        },
        output: {
          entryFileNames: "[name].js",
        },
        external: ["electron", "@trail/ipc"],
      },
      sourcemap: false,
    },
    plugins: [pinOverlayBuildPlugin()],
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