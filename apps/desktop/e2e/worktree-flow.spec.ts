import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { launchTrailApp } from "./electron-app";

const mainEntry = path.resolve("out/main/index.js");

test.describe("worktree agent", () => {
  test.beforeAll(() => {
    test.skip(
      !existsSync(mainEntry),
      "Build desktop first: npm run build --workspace=@trail/desktop",
    );
  });

  test("starts agent run on seeded worktree", async () => {
    const { app, page } = await launchTrailApp();
    try {
      await page.getByRole("link", { name: /#43/i }).first().click();
      await expect(page.getByRole("button", { name: "Start run" })).toBeVisible();

      await page.getByRole("button", { name: "Start run" }).click();
      await expect(page.getByText(/Run finished|trail|agent/i).first()).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await app.close();
    }
  });

  test("switches worktree to Preview mode", async () => {
    const { app, page } = await launchTrailApp();
    try {
      await page.getByRole("link", { name: /#43/i }).first().click();
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await expect(
        page.getByText(/Embedded preview|Starting dev server|dev server/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await app.close();
    }
  });
});