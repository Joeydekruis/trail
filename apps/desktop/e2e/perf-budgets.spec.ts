import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  PERF_BUDGET_COLD_START_MS,
  PERF_BUDGET_WORKSPACE_SWITCH_MS,
  withinPerfBudget,
} from "../../../packages/core/dist/index.js";
import { launchTrailApp } from "./electron-app";

const mainEntry = path.resolve("out/main/index.js");

test.describe("desktop perf budgets", () => {
  test.beforeAll(() => {
    test.skip(
      !existsSync(mainEntry),
      "Build desktop first: npm run build --workspace=@trail/desktop",
    );
  });

  test("cold start and workspace switch within briefing budgets", async () => {
    const { app, page } = await launchTrailApp();
    try {
      const coldStart = await page.evaluate(async () => {
        const snap = await window.trail?.getDiagnosticsSnapshot?.();
        return snap?.startup.coldStartMs ?? null;
      });

      expect(coldStart, "cold start ms recorded").not.toBeNull();
      expect(
        withinPerfBudget(coldStart ?? Number.POSITIVE_INFINITY, PERF_BUDGET_COLD_START_MS),
        `cold start ${coldStart}ms <= ${PERF_BUDGET_COLD_START_MS}ms`,
      ).toBe(true);

      const mod = process.platform === "darwin" ? "Meta" : "Control";
      await page.keyboard.press(`${mod}+2`);
      await page.waitForTimeout(250);

      const switchMs = await page.evaluate(async () => {
        const snap = await window.trail?.getDiagnosticsSnapshot?.();
        return snap?.startup.lastWorkspaceSwitchMs ?? null;
      });

      expect(switchMs, "workspace switch ms recorded").not.toBeNull();
      expect(
        withinPerfBudget(switchMs ?? Number.POSITIVE_INFINITY, PERF_BUDGET_WORKSPACE_SWITCH_MS),
        `workspace switch ${switchMs}ms <= ${PERF_BUDGET_WORKSPACE_SWITCH_MS}ms`,
      ).toBe(true);
    } finally {
      await app.close();
    }
  });
});