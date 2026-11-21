import { describe, expect, it } from "vitest";
import { DEFAULT_PREVIEW_URL, normalizePreviewUrl } from "./normalize-preview-url.js";

describe("normalizePreviewUrl", () => {
  it("adds http scheme for bare localhost", () => {
    const result = normalizePreviewUrl("localhost:3000/sign-in");
    expect(result).toEqual({ ok: true, url: "http://localhost:3000/sign-in" });
  });

  it("rejects non-local http hosts", () => {
    const result = normalizePreviewUrl("http://example.com");
    expect(result.ok).toBe(false);
  });

  it("exposes default dev url", () => {
    expect(normalizePreviewUrl(DEFAULT_PREVIEW_URL).ok).toBe(true);
  });
});