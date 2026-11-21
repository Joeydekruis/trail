import { describe, expect, it } from "vitest";
import { buildClaudeAgentArgs, planAgentSessionRun } from "./claude-args.js";

describe("buildClaudeAgentArgs", () => {
  it("starts fresh with stream-json and -p", () => {
    expect(buildClaudeAgentArgs({ prompt: "Fix tests" })).toEqual([
      "--output-format",
      "stream-json",
      "-p",
      "Fix tests",
    ]);
  });

  it("resumes an existing Claude session", () => {
    expect(buildClaudeAgentArgs({ prompt: "Why failed?", resumeSessionId: "sess-1" })).toEqual([
      "--output-format",
      "stream-json",
      "--resume",
      "sess-1",
      "-p",
      "Why failed?",
    ]);
  });
});

describe("planAgentSessionRun", () => {
  it("reuses session on follow-up", () => {
    const plan = planAgentSessionRun("sess-1", { followUp: true });
    expect(plan.resumeSessionId).toBe("sess-1");
    expect(plan.agentSessionId).toBe("sess-1");
  });

  it("rotates session when reset", () => {
    const plan = planAgentSessionRun("sess-1", { followUp: false, resetSession: true });
    expect(plan.resumeSessionId).toBeNull();
    expect(plan.agentSessionId).not.toBe("sess-1");
  });
});