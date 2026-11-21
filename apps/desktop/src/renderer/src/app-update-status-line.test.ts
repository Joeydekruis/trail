import { describe, expect, it } from "vitest";
import { appUpdateStatusLine, canInstallAppUpdate } from "./app-update-status-line";

const base = {
  enabled: true,
  currentVersion: "0.0.0",
  version: "0.0.1",
  deferredByRuns: false,
  errorMessage: null,
} as const;

describe("appUpdateStatusLine", () => {
  it("describes deferred installs", () => {
    const line = appUpdateStatusLine({
      ...base,
      status: "downloaded",
      deferredByRuns: true,
    });
    expect(line).toContain("waiting for agent runs");
  });
});

describe("canInstallAppUpdate", () => {
  it("allows install when downloaded and idle", () => {
    expect(
      canInstallAppUpdate({
        ...base,
        status: "downloaded",
        deferredByRuns: false,
      }),
    ).toBe(true);
  });
});