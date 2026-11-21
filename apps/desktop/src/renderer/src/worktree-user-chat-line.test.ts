import { describe, expect, it } from "vitest";
import { formatWorktreeChatTime, userChatLine } from "./worktree-user-chat-line";

describe("worktree user chat line", () => {
  it("formats clock time", () => {
    const at = new Date(2026, 0, 2, 14, 5, 0);
    expect(formatWorktreeChatTime(at)).toBe("14:05");
  });

  it("builds a you line", () => {
    const line = userChatLine("Why did tests fail?", new Date(2026, 0, 2, 9, 30, 0));
    expect(line.who).toBe("You");
    expect(line.body).toBe("Why did tests fail?");
    expect(line.time).toBe("09:30");
  });
});