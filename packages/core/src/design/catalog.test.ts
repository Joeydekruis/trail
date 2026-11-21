import { describe, expect, it } from "vitest";
import { buildDesignCatalog } from "./catalog.js";

describe("buildDesignCatalog", () => {
  it("groups versions under screen folders", () => {
    const catalog = buildDesignCatalog([
      "desktop-dashboard/v1.html",
      "desktop-dashboard/v2.html",
      "onboarding/v1.html",
    ]);
    expect(catalog).toHaveLength(2);
    const dashboard = catalog.find((s) => s.id === "desktop-dashboard");
    expect(dashboard?.versions).toHaveLength(2);
    expect(dashboard?.name).toBe("Desktop Dashboard");
  });
});