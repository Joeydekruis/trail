import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareInstallerSize } from "./installer-budget.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const baselinePath = path.join(desktopRoot, "baselines", "fase-0.json");

/** @type {{ installerBytes: Record<string, number | null>; budget: Record<string, number> }} */
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

const artifactRoot = process.argv[2] ?? "artifacts";

const patterns = [
  { key: "macArm64Dmg", match: (name) => name.endsWith(".dmg") && name.includes("arm64") },
  { key: "macX64Dmg", match: (name) => name.endsWith(".dmg") && name.includes("x64") },
  {
    key: "winX64Nsis",
    match: (name) =>
      name.endsWith(".exe") &&
      !name.endsWith(".blockmap") &&
      !name.toLowerCase().includes("uninstaller"),
  },
];

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const files = walkFiles(path.resolve(artifactRoot));
let failed = false;

for (const { key, match } of patterns) {
  const hit = files.find((f) => match(path.basename(f)));
  if (!hit) {
    console.log(`[skip] ${key}: geen artifact gevonden`);
    continue;
  }

  const size = fs.statSync(hit).size;
  const baselineBytes = baseline.installerBytes[key] ?? null;
  console.log(`[measure] ${key}: ${size} bytes (${path.basename(hit)})`);

  const result = compareInstallerSize(size, baselineBytes, {
    maxDeltaBytes: baseline.budget.installerMaxDeltaBytes,
    maxPercentIncreasePerRelease: baseline.budget.installerMaxPercentIncreasePerRelease,
  });

  if (!result.ok) {
    failed = true;
    console.error(`[fail] ${key}:`, result);
  } else if (result.reason === "no_baseline") {
    console.log(`[nulmeting] ${key}: vul installerBytes.${key} in baselines/fase-0.json`);
  } else {
    console.log(`[ok] ${key}: delta ${result.delta} (${(result.percent * 100).toFixed(2)}%)`);
  }
}

if (failed) {
  process.exit(1);
}