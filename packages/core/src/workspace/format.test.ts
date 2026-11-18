import { describe, expect, it } from "vitest";
import { formatWorkspaceRepoLine } from "./format.js";

describe("formatWorkspaceRepoLine", () => {
  it("joins repository and integration branch", () => {
    expect(
      formatWorkspaceRepoLine({
        repository: "derisoryventures/trail",
        integrationBranch: "development",
      }),
    ).toBe("derisoryventures/trail · development");
  });

  it("uses placeholder when repository is missing", () => {
    expect(
      formatWorkspaceRepoLine({
        repository: null,
        integrationBranch: "main",
      }),
    ).toBe("No repo linked · main");
  });
});