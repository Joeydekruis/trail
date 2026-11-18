import fs from "node:fs";
import zlib from "node:zlib";

function gunzipEntry(entry) {
  let data = entry.data;
  if (entry.compressed) {
    data = zlib.gunzipSync(Buffer.from(data, "base64")).toString("utf8");
  }
  return data;
}

function parseBundle(html) {
  const manifestM = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  const templateM = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
  if (!manifestM || !templateM) {
    return null;
  }
  return {
    manifest: JSON.parse(manifestM[1]),
    template: JSON.parse(templateM[1]),
  };
}

function resolveTemplate(template, manifest) {
  let out = template;
  for (const [id, entry] of Object.entries(manifest)) {
    const text = gunzipEntry(entry);
    const needle = `"about:blank#${id}"`;
    if (!out.includes(needle)) {
      continue;
    }
    const inner = parseBundle(text);
    if (inner) {
      const resolved = resolveTemplate(inner.template, inner.manifest);
      out = out.split(needle).join(JSON.stringify(resolved).slice(1, -1));
    } else {
      out = out.split(needle).join(text.replaceAll("\\", "\\\\").replaceAll('"', '\\"'));
    }
  }
  return out;
}

const root = fs.readFileSync("design/desktop-dashboard/v1.html", "utf8");
const bundle = parseBundle(root);
if (!bundle) {
  console.error("failed root parse");
  process.exit(1);
}

const screenId = process.argv[2] ?? "8329b86c-1d48-4b6f-b311-8d94ba5da487";
const outName = process.argv[3] ?? "dashboard";
const dashEntry = bundle.manifest[screenId];
if (!dashEntry) {
  console.error("unknown screen", screenId);
  process.exit(1);
}
const dashHtml = gunzipEntry(dashEntry);
const dashBundle = parseBundle(dashHtml);
if (!dashBundle) {
  console.error("dashboard not nested bundle");
  process.exit(1);
}

const resolved = resolveTemplate(dashBundle.template, dashBundle.manifest);
fs.mkdirSync("design/desktop-dashboard/extracted", { recursive: true });
const outPath = `design/desktop-dashboard/extracted/${outName}-resolved.html`;
fs.writeFileSync(outPath, resolved);
console.log("wrote", outPath, resolved.length);