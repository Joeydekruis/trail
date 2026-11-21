import { describe, expect, it } from "vitest";
import {
  resolveBackgroundSyncIntervalSec,
  UNFOCUSED_BACKGROUND_SYNC_SEC,
} from "./background-sync-interval.js";

describe("resolveBackgroundSyncIntervalSec", () => {
  it("uses configured interval when focused", () => {
    expect(resolveBackgroundSyncIntervalSec(60, true, false)).toBe(60);
  });

  it("backs off to five minutes when unfocused", () => {
    expect(resolveBackgroundSyncIntervalSec(60, false, false)).toBe(UNFOCUSED_BACKGROUND_SYNC_SEC);
  });

  it("pauses on system sleep or when sync is off", () => {
    expect(resolveBackgroundSyncIntervalSec(60, true, true)).toBeNull();
    expect(resolveBackgroundSyncIntervalSec(0, true, false)).toBeNull();
  });
});