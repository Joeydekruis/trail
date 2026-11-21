import path from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "@playwright/test";

const mainEntry = path.resolve("out/main/index.js");

export async function launchTrailApp(): Promise<{
  app: ElectronApplication;
  page: Page;
}> {
  const app = await electron.launch({
    args: [mainEntry],
    cwd: path.resolve("."),
    env: {
      ...process.env,
      TRAIL_E2E: "1",
      ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
    },
  });
  const page = await app.firstWindow();
  await page.waitForSelector(".trail-app[data-trail-ready]", { timeout: 20_000 });
  return { app, page };
}