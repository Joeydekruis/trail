import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { launchTrailApp } from "./electron-app";

const mainEntry = path.resolve("out/main/index.js");

test.describe("preview pin", () => {
  test.beforeAll(() => {
    test.skip(
      !existsSync(mainEntry),
      "Build desktop first: npm run build --workspace=@trail/desktop",
    );
  });

  test("delivers simulated preview pin to worktree chat", async () => {
    const { app, page } = await launchTrailApp();
    const pinComment = "E2E preview pin";
    try {
      await page.getByRole("link", { name: /#43/i }).first().click();
      await page.locator('button[aria-pressed="false"]', { hasText: "Preview" }).click();
      await expect(
        page.getByText(/Embedded preview|Starting dev server/i).first(),
      ).toBeVisible({ timeout: 45_000 });

      const result = await page.evaluate(
        async ({ comment }) => {
          const snap = await window.trail?.listWorkspaces?.();
          const workspaceId = snap?.activeWorkspaceId ?? "trail";
          return window.trail?.e2eSimulatePreviewPin?.({
            workspaceId,
            issueNumber: 43,
            comment,
          });
        },
        { comment: pinComment },
      );

      expect(result?.ok).toBe(true);
      await expect(page.getByText(pinComment)).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText("From preview comment")).toBeVisible();
    } finally {
      await app.close();
    }
  });
});