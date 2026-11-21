import { describe, expect, it } from "vitest";
import { previewPinToChatLine } from "./preview-pin-chat";

describe("previewPinToChatLine", () => {
  it("formats chip and selector", () => {
    const line = previewPinToChatLine({
      workspaceId: "trail",
      issueNumber: 1,
      pinNumber: 2,
      comment: "More contrast",
      pageUrl: "http://127.0.0.1:3000/",
      selector: "#sign-in",
      elementText: "Sign in",
      offsetX: 0.5,
      offsetY: 0.2,
    });
    expect(line.chip?.text).toBe("From preview comment");
    expect(line.monoLines?.[1]).toBe("#sign-in");
  });
});