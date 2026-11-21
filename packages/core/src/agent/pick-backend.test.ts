import { describe, expect, it } from "vitest";
import {
  anyAgentBackendAvailable,
  pickPreferredAgentBackend,
} from "./pick-backend.js";
import type { AgentBackendStatus } from "./types.js";

const row = (
  id: AgentBackendStatus["id"],
  found: boolean,
): AgentBackendStatus => ({
  id,
  binary: id === "claude" ? "claude" : "cursor-agent",
  found,
  version: found ? "1.0" : null,
});

describe("pickPreferredAgentBackend", () => {
  it("prefers Claude over Cursor", () => {
    expect(
      pickPreferredAgentBackend([row("cursor", true), row("claude", true)])?.id,
    ).toBe("claude");
  });

  it("returns null when none are installed", () => {
    expect(pickPreferredAgentBackend([row("cursor", false), row("claude", false)])).toBeNull();
    expect(anyAgentBackendAvailable([row("cursor", false)])).toBe(false);
  });
});