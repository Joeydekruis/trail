import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_STATUS_FIELD,
  resolveProjectStatusField,
  workspaceProjectStatusFieldKey,
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
});