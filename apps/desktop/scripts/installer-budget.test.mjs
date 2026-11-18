import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareInstallerSize } from "./installer-budget.mjs";

describe("compareInstallerSize", () => {
  it("passes when baseline is not set (nulmeting)", () => {
    const r = compareInstallerSize(120_000_000, null);
    assert.equal(r.ok, true);
    assert.equal(r.reason, "no_baseline");
  });

  it("fails when byte delta exceeds budget", () => {
    const baseline = 100_000_000;
    const actual = baseline + 16 * 1024 * 1024;
    const r = compareInstallerSize(actual, baseline);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "delta_bytes");
  });

  it("fails when percent increase exceeds budget", () => {
    const baseline = 100_000_000;
    const actual = Math.round(baseline * 1.06);
    const r = compareInstallerSize(actual, baseline, { maxDeltaBytes: 1_000_000_000 });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "delta_percent");
  });

  it("passes within both budgets", () => {
    const baseline = 100_000_000;
    const actual = baseline + 1_000_000;
    const r = compareInstallerSize(actual, baseline);
    assert.equal(r.ok, true);
  });
});