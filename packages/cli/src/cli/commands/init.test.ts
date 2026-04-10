import { describe, expect, it } from "vitest";

import { parseRemoteUrl } from "./init.js";

describe("parseRemoteUrl", () => {
  it("parses https://github.com/o/r.git", () => {
    expect(parseRemoteUrl("https://github.com/o/r.git")).toEqual({
      owner: "o",
      repo: "r",
    });
  });

  it("parses git@github.com:o/r.git", () => {
    expect(parseRemoteUrl("git@github.com:o/r.git")).toEqual({
      owner: "o",
      repo: "r",
    });
  });

  it("parses https URL without .git suffix", () => {
    expect(parseRemoteUrl("https://github.com/org/repo")).toEqual({
      owner: "org",
      repo: "repo",
    });
  });

  it("returns null for non-GitHub remotes", () => {
    expect(parseRemoteUrl("https://gitlab.com/a/b.git")).toBeNull();
  });
});
