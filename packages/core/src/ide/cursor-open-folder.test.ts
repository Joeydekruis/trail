import { describe, expect, it } from "vitest";
import { cursorOpenFolderAttempts } from "./cursor-open-folder.js";

describe("cursorOpenFolderAttempts", () => {
  it("prefers cursor CLI on macOS with open -a fallback", () => {
    const attempts = cursorOpenFolderAttempts("darwin", "/tmp/wt");
    expect(attempts[0]).toEqual({ executable: "cursor", args: ["/tmp/wt"] });
    expect(attempts[1]?.executable).toBe("open");
  });

  it("uses cursor.cmd on Windows", () => {
    const attempts = cursorOpenFolderAttempts("win32", "C:\\wt");
    expect(attempts[0]?.executable).toBe("cursor.cmd");
  });
});