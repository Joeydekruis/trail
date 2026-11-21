import { describe, expect, it } from "vitest";
import { etagFromResponse, withIfNoneMatch } from "./conditional-request.js";

describe("withIfNoneMatch", () => {
  it("adds If-None-Match when etag is set", () => {
    const headers = withIfNoneMatch({ Authorization: "Bearer x" }, '"abc"');
    expect(headers).toMatchObject({ Authorization: "Bearer x", "If-None-Match": '"abc"' });
  });

  it("skips empty etag", () => {
    const headers = withIfNoneMatch({ Accept: "json" }, null);
    expect(headers).toEqual({ Accept: "json" });
  });
});

describe("etagFromResponse", () => {
  it("reads ETag header", () => {
    expect(etagFromResponse(new Headers({ ETag: '"etag-1"' }))).toBe('"etag-1"');
  });
});