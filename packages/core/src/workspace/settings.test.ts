import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_STATUS_FIELD,
  DEFAULT_SYNC_INTERVAL_SEC,
  resolveProjectStatusField,
  resolveSyncIntervalSec,
  workspaceProjectStatusFieldKey,
  workspaceSyncIntervalKey,
} from "./settings.js";

describe("workspace project settings", () => {
  it("builds a per-workspace status field key", () => {
    expect(workspaceProjectStatusFieldKey("trail")).toBe(
      "workspace:trail:project_status_field",
    );
  });

  it("falls back to Status when unset", () => {
    expect(resolveProjectStatusField(null)).toBe(DEFAULT_PROJECT_STATUS_FIELD);
    expect(resolveProjectStatusField("  ")).toBe(DEFAULT_PROJECT_STATUS_FIELD);
    expect(resolveProjectStatusField("Column")).toBe("Column");
  });

  it("builds sync interval key", () => {
    expect(workspaceSyncIntervalKey("trail")).toBe("workspace:trail:sync_interval_sec");
  });

  it("parses sync interval seconds", () => {
    expect(resolveSyncIntervalSec(null)).toBe(DEFAULT_SYNC_INTERVAL_SEC);
    expect(resolveSyncIntervalSec("0")).toBe(0);
    expect(resolveSyncIntervalSec("120")).toBe(120);
    expect(resolveSyncIntervalSec("nope")).toBe(DEFAULT_SYNC_INTERVAL_SEC);
  });
});