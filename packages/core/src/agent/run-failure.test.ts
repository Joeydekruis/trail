import { describe, expect, it } from "vitest";
import {
  buildAskAgentWhyPrompt,
  formatAgentRunDuration,
  summarizeAgentRunOutput,
} from "./run-failure.js";

describe("formatAgentRunDuration", () => {
  it("formats sub-minute runs", () => {
    expect(formatAgentRunDuration(12_400)).toBe("12s");
  });

  it("formats minutes and seconds", () => {
    expect(formatAgentRunDuration(134_000)).toBe("2m 14s");
  });
});

describe("summarizeAgentRunOutput", () => {
  it("prefers test-related lines", () => {
    const summary = summarizeAgentRunOutput([
      "[trail] Prompt: fix bug",
      "› Running tests: 3 passed, 1 failed",
      "FAIL src/foo.test.ts",
      "random log line",
    ]);
    expect(summary).toContain("Running tests");
    expect(summary).toContain("FAIL");
    expect(summary).not.toContain("random log");
  });

  it("falls back to tail when no test lines", () => {
    const summary = summarizeAgentRunOutput(["line a", "line b", "line c"]);
    expect(summary).toBe("line a\nline b\nline c");
  });
});

describe("buildAskAgentWhyPrompt", () => {
  it("includes output when present", () => {
    const text = buildAskAgentWhyPrompt({
      issueNumber: 42,
      exitCode: 1,
      outputSummary: "FAIL tests",
    });
    expect(text).toContain("#42");
    expect(text).toContain("FAIL tests");
  });
});