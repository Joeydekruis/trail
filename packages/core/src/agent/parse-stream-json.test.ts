import { describe, expect, it } from "vitest";
import { parseAgentStreamJsonLine } from "./parse-stream-json.js";

describe("parseAgentStreamJsonLine", () => {
  it("reads session_id from init events", () => {
    const line = JSON.stringify({
      type: "system",
      subtype: "init",
      session_id: "sess-claude-abc",
    });
    const parsed = parseAgentStreamJsonLine(line);
    expect(parsed.sessionId).toBe("sess-claude-abc");
    expect(parsed.displayLine).toBeNull();
  });

  it("extracts assistant text blocks", () => {
    const line = JSON.stringify({
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Done." }],
      },
    });
    const parsed = parseAgentStreamJsonLine(line);
    expect(parsed.displayLine).toBe("Done.");
  });

  it("passes through plain text", () => {
    expect(parseAgentStreamJsonLine("hello")).toEqual({
      sessionId: null,
      displayLine: "hello",
    });
  });
});