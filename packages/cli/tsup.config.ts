import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node18",
    /** Bundle MCP SDK into the CLI binary (stdio server). */
    noExternal: ["@modelcontextprotocol/sdk"],
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    entry: ["src/lib.ts"],
    format: ["esm"],
    dts: true,
    clean: false,
    sourcemap: true,
    target: "node18",
  },
]);
