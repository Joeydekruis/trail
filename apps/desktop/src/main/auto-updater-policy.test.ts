import { describe, expect, it } from "vitest";
import { shouldDeferAppUpdateInstall, shouldQuitAndInstallUpdate } from "./auto-updater-policy";

describe("auto-updater policy", () => {
  it("defers install while agent runs are active", () => {
    expect(shouldDeferAppUpdateInstall({ updateDownloaded: true, activeAgentRuns: 1 })).toBe(true);
    expect(shouldQuitAndInstallUpdate({ updateDownloaded: true, activeAgentRuns: 1 })).toBe(false);
  });

  it("installs when download is ready and no runs", () => {
    expect(shouldDeferAppUpdateInstall({ updateDownloaded: true, activeAgentRuns: 0 })).toBe(false);
    expect(shouldQuitAndInstallUpdate({ updateDownloaded: true, activeAgentRuns: 0 })).toBe(true);
  });
});