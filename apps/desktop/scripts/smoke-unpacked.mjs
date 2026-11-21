import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const desktopRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function findPackagedArtifacts(releaseDir) {
  const hits = [];
  if (!existsSync(releaseDir)) {
    return hits;
  }
  for (const entry of readdirSync(releaseDir)) {
    const entryPath = join(releaseDir, entry);
    if (!statSync(entryPath).isDirectory()) {
      continue;
    }
    if (entry.endsWith("-unpacked")) {
      const winExe = join(entryPath, "Trail.exe");
      const resources = join(entryPath, "resources", "app.asar");
      if (existsSync(winExe) && existsSync(resources)) {
        hits.push({ platform: "win", root: entryPath, asar: resources, executable: winExe });
      }
      continue;
    }
    if (entry === "mac" || entry.startsWith("mac-")) {
      const appBundle = join(entryPath, "Trail.app");
      const asar = join(appBundle, "Contents", "Resources", "app.asar");
      if (existsSync(appBundle) && existsSync(asar)) {
        hits.push({ platform: "darwin", root: appBundle, asar, executable: appBundle });
      }
    }
  }
  return hits;
}

export function validatePackagedLayout(hit) {
  const looseNodeModules = join(hit.root, "resources", "node_modules");
  if (existsSync(looseNodeModules)) {
    return {
      ok: false,
      message: `Unexpected resources/node_modules in ${hit.root} (installer should ship app.asar only)`,
    };
  }
  const asarStat = statSync(hit.asar);
  if (asarStat.size < 50_000) {
    return { ok: false, message: `app.asar looks too small (${asarStat.size} bytes)` };
  }
  return { ok: true };
}

function main() {
  const releaseDir = process.env.TRAIL_RELEASE_DIR ?? join(desktopRoot, "release");
  const artifacts = findPackagedArtifacts(releaseDir);
  if (artifacts.length === 0) {
    console.error(
      `[smoke-unpacked] No unpacked build in ${releaseDir}. Run: npm run dist:dir --workspace=@trail/desktop`,
    );
    process.exit(1);
  }
  for (const hit of artifacts) {
    const result = validatePackagedLayout(hit);
    if (!result.ok) {
      console.error(`[smoke-unpacked] ${hit.platform}: ${result.message}`);
      process.exit(1);
    }
    console.log(`[smoke-unpacked] ${hit.platform}: ok (${hit.asar})`);
  }
}

if (process.argv[1]?.endsWith("smoke-unpacked.mjs")) {
  main();
}