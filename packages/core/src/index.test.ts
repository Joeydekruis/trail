import { describe, expect, it } from "vitest";
import { TRAIL_CORE_VERSION } from "./index.js";

describe("core", () => {
  it("exposes a version constant", () => {
    expect(TRAIL_CORE_VERSION).toBe("0.0.0");
  });
});