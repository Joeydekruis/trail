import { describe, expect, it } from "vitest";
import { agentStreamRunKey } from "./agent-stream-run-key";

describe("agentStreamRunKey", () => {
  it("combines workspace and issue", () => {
    expect(agentStreamRunKey("trail", 42)).toBe("trail:42");
  });
});