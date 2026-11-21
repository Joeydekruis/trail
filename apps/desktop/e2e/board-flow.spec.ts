import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { launchTrailApp } from "./electron-app";

const mainEntry = path.resolve("out/main/index.js");

test.describe("board drag", () => {
  test.beforeAll(() => {
    test.skip(
      !existsSync(mainEntry),
      "Build desktop first: npm run build --workspace=@trail/desktop",
    );
  });

  test("drags seeded issue into in-progress column", async () => {
    const { app, page } = await launchTrailApp();
    try {
      await page
        .getByRole("navigation", { name: "Views" })
        .getByRole("button", { name: "Board", exact: true })
        .click();
      await expect(page.locator('[data-e2e-board-card="#42"]')).toBeVisible({ timeout: 10_000 });

      const card = page.locator('[data-e2e-board-card="#42"]');
      const target = page.locator('[data-e2e-board-column="in-progress"]');
      await card.dragTo(target);

      await expect(
        target.locator('[data-e2e-board-card="#42"]'),
      ).toBeVisible({ timeout: 5_000 });
    } finally {
      await app.close();
    }
  });
});