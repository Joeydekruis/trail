import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it } from "node:test";
import { findPackagedArtifacts, validatePackagedLayout } from "./smoke-unpacked.mjs";

describe("smoke-unpacked", () => {
  it("finds mac and win unpacked layouts", () => {
    const root = mkdtempSync(join(tmpdir(), "trail-release-"));
    const macDir = join(root, "mac-arm64");
    const macApp = join(macDir, "Trail.app", "Contents", "Resources");
    mkdirSync(macApp, { recursive: true });
    writeFileSync(join(macApp, "app.asar"), "x".repeat(60_000));

    const winDir = join(root, "win-unpacked", "resources");
    mkdirSync(winDir, { recursive: true });
    writeFileSync(join(winDir, "app.asar"), "x".repeat(60_000));
    writeFileSync(join(root, "win-unpacked", "Trail.exe"), "");

    const hits = findPackagedArtifacts(root);
    assert.equal(hits.length, 2);
  });

  it("rejects loose node_modules beside asar", () => {
    const root = mkdtempSync(join(tmpdir(), "trail-win-"));
    const resources = join(root, "resources");
    mkdirSync(resources, { recursive: true });
    writeFileSync(join(resources, "app.asar"), "x".repeat(60_000));
    mkdirSync(join(resources, "node_modules"));
    writeFileSync(join(root, "Trail.exe"), "");

    const result = validatePackagedLayout({
      platform: "win",
      root,
      asar: join(resources, "app.asar"),
      executable: join(root, "Trail.exe"),
    });
    assert.equal(result.ok, false);
    assert.match(result.message, /node_modules/);
  });
});