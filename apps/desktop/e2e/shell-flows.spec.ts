import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { launchTrailApp } from "./electron-app";

const mainEntry = path.resolve("out/main/index.js");

test.describe("desktop shell flows", () => {
  test.beforeAll(() => {
    test.skip(
      !existsSync(mainEntry),
      "Build desktop first: npm run build --workspace=@trail/desktop",
    );
  });

  test("navigates Board and opens Diagnostics from Help", async () => {
    const { app, page } = await launchTrailApp();
    try {
      await page
        .getByRole("navigation", { name: "Views" })
        .getByRole("button", { name: "Board", exact: true })
        .click();
      await expect(page.getByRole("heading", { name: "Board" })).toBeVisible();

      await page.getByRole("button", { name: "Help" }).click();
      await expect(page.getByRole("dialog", { name: /Diagnostics/i })).toBeVisible();
      await expect(page.getByText("Cold start")).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Close", exact: true })
        .click();
    } finally {
      await app.close();
    }
  });
});