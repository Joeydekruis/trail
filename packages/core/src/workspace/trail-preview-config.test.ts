import { describe, expect, it } from "vitest";
import {
  parseTrailPreviewConfigYaml,
  preferredPortFromPreviewUrl,
  previewConfigFromPackageJsonScripts,
  previewUrlWithPort,
} from "./trail-preview-config.js";

describe("parseTrailPreviewConfigYaml", () => {
  it("reads devCommand and url under preview", () => {
    const yaml = `
workspace: trail
preview:
  devCommand: npm run dev
  url: http://localhost:3000
agents:
  parallel: 2
`;
    const config = parseTrailPreviewConfigYaml(yaml);
    expect(config).toEqual({
      devCommand: "npm run dev",
      url: "http://localhost:3000",
    });
  });

  it("returns null when preview block is incomplete", () => {
    expect(parseTrailPreviewConfigYaml("preview:\n  url: http://localhost:3000\n")).toBeNull();
  });
});

describe("previewConfigFromPackageJsonScripts", () => {
  it("defaults url when only dev script exists", () => {
    const config = previewConfigFromPackageJsonScripts({ dev: "vite" });
    expect(config?.devCommand).toBe("npm run dev");
    expect(config?.url).toContain("3000");
  });
});

describe("previewUrlWithPort", () => {
  it("replaces port on localhost url", () => {
    expect(previewUrlWithPort("http://localhost:3000", 4321)).toBe(
      "http://localhost:4321/",
    );
  });
});

describe("preferredPortFromPreviewUrl", () => {
  it("uses explicit port or 3000 default", () => {
    expect(preferredPortFromPreviewUrl("http://127.0.0.1:5173")).toBe(5173);
    expect(preferredPortFromPreviewUrl("http://localhost")).toBe(3000);
  });
});