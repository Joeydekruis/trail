import { describe, expect, it } from "vitest";
import { agentOutputToChatLine } from "./agent-chat-line";

describe("agentOutputToChatLine", () => {
  it("maps claude stdout", () => {
    const line = agentOutputToChatLine({
      workspaceId: "w",
      issueNumber: 1,
      stream: "stdout",
      line: "hello",
      backend: "claude",
    });
    expect(line.who).toBe("Claude");
    expect(line.body).toBe("hello");
    expect(line.chip).toBeUndefined();
  });

  it("tags stderr", () => {
    const line = agentOutputToChatLine({
      workspaceId: "w",
      issueNumber: 1,
      stream: "stderr",
      line: "warn",
      backend: null,
    });
    expect(line.chip?.text).toBe("stderr");
  });
});