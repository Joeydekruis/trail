import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const screenId = process.argv[2] ?? "8329b86c-1d48-4b6f-b311-8d94ba5da487";
const html = fs.readFileSync("design/desktop-dashboard/v1.html", "utf8");
const m = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (!m) {
  console.error("no manifest");
  process.exit(1);
}
const manifest = JSON.parse(m[1]);
const entry = manifest[screenId];
if (!entry) {
  console.error("unknown screen", screenId);
  process.exit(1);
}
let data = entry.data;
if (entry.compressed) {
  data = zlib.gunzipSync(Buffer.from(data, "base64")).toString("utf8");
}
const outDir = "design/desktop-dashboard/extracted";
fs.mkdirSync(outDir, { recursive: true });
const name = process.argv[3] ?? "dashboard";
const outPath = path.join(outDir, `${name}.html`);
fs.writeFileSync(outPath, data);
console.log("wrote", outPath, data.length);