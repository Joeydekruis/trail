import { describe, expect, it } from "vitest";
import { workspaceSwitchPayload } from "./index.js";

describe("workspaceSwitchPayload", () => {
  it("accepts a workspace id", () => {
    expect(workspaceSwitchPayload.parse({ workspaceId: "trail" })).toEqual({
      workspaceId: "trail",
    });
  });

  it("rejects empty id", () => {
    expect(() => workspaceSwitchPayload.parse({ workspaceId: "" })).toThrow();
  });
});