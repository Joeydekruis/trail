import { describe, it, expect } from "vitest";
import { formatTrailError, type TrailError } from "./errors.js";

describe("formatTrailError", () => {
  it("formats AUTH_REQUIRED with code and message", () => {
    const error: TrailError = {
      code: "AUTH_REQUIRED",
      message: "No credentials found",
      hint: "Run `trail auth login`",
    };
    const out = formatTrailError(error);
    expect(out).toContain("AUTH_REQUIRED");
    expect(out).toContain("No credentials found");
  });

  it("formats AUTH_FAILED with code and message", () => {
    const error: TrailError = {
      code: "AUTH_FAILED",
      message: "Token rejected",
    };
    const out = formatTrailError(error);
    expect(out).toContain("AUTH_FAILED");
    expect(out).toContain("Token rejected");
  });

  it("formats NOT_A_TRAIL_REPO with code and message", () => {
    const error: TrailError = {
      code: "NOT_A_TRAIL_REPO",
      message: "This directory is not a Trail repository",
      path: "/tmp/foo",
    };
    const out = formatTrailError(error);
    expect(out).toContain("NOT_A_TRAIL_REPO");
    expect(out).toContain("This directory is not a Trail repository");
  });

  it("formats VALIDATION_FAILED with code and message", () => {
    const error: TrailError = {
      code: "VALIDATION_FAILED",
      message: "Task file is invalid",
      details: "Missing required field id",
      issues: ["id: required"],
    };
    const out = formatTrailError(error);
    expect(out).toContain("VALIDATION_FAILED");
    expect(out).toContain("Task file is invalid");
  });

  it("formats GITHUB_API with code and message", () => {
    const error: TrailError = {
      code: "GITHUB_API",
      message: "GitHub request failed",
      status: 403,
      body: "rate limit",
    };
    const out = formatTrailError(error);
    expect(out).toContain("GITHUB_API");
    expect(out).toContain("GitHub request failed");
  });

  it("formats SYNC_CONFLICT with code and message", () => {
    const error: TrailError = {
      code: "SYNC_CONFLICT",
      message: "Local and remote both changed",
      paths: ["tasks/foo.json"],
    };
    const out = formatTrailError(error);
    expect(out).toContain("SYNC_CONFLICT");
    expect(out).toContain("Local and remote both changed");
  });
});
