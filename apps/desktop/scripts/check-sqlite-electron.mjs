import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const electronPath = require("electron");

const code = `
const Database = require("better-sqlite3");
new Database(":memory:");
console.log("electron sqlite ok");
`;

const r = spawnSync(electronPath, ["-e", code], { cwd: root, encoding: "utf8", timeout: 15000 });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
console.log(r.stdout.trim());