import { describe, it, expect } from "vitest";

import { TrailConfigSchema } from "./config.js";

describe("TrailConfigSchema", () => {
  const valid = {
    github: { owner: "acme", repo: "widgets" },
    sync: {
      preset: "collaborative",
      auto_sync_on_command: true,
      ui_poll_interval_seconds: 30,
      ui_idle_backoff: true,
    },
  };

  it("parses a valid config", () => {
    const parsed = TrailConfigSchema.parse(valid);
    expect(parsed.github.owner).toBe("acme");
    expect(parsed.sync.preset).toBe("collaborative");
  });

  it("parses optional last_full_sync_at", () => {
    const parsed = TrailConfigSchema.parse({
      ...valid,
      last_full_sync_at: "2026-04-10T12:00:00.000Z",
    });
    expect(parsed.last_full_sync_at).toBe("2026-04-10T12:00:00.000Z");
  });

  it("rejects invalid preset", () => {
    expect(() =>
      TrailConfigSchema.parse({
        ...valid,
        sync: { ...valid.sync, preset: "enterprise" },
      }),
    ).toThrow();
  });

  it("rejects missing github", () => {
    expect(() =>
      TrailConfigSchema.parse({
        sync: valid.sync,
      }),
    ).toThrow();
  });
});
