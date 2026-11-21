import { describe, expect, it } from "vitest";
import { parseAgentVersionOutput } from "./parse-version.js";

describe("parseAgentVersionOutput", () => {
  it("extracts semver from typical output", () => {
    expect(parseAgentVersionOutput("cursor-agent 1.4.2\n")).toBe("1.4.2");
  });

  it("returns first non-empty line when no semver", () => {
    expect(parseAgentVersionOutput("dev build\n")).toBe("dev build");
  });
});