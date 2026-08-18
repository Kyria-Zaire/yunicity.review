import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";

/**
 * C3.1-T3-R2 — scénario déterministe cold-start visiteur Explorer.
 * Contexte frais sans storage state ; un seul clic ; aucune attente artificielle.
 */
const EXPLORER_LABEL = "Explorer Reims";

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

test.describe("C3.1-T3-R2 — Explorer cold-start visiteur", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("1366 — clic unique ouvre Dialog sans appel /api/v1/search", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 1366, height: 900 });

    const searchRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/search")) {
        searchRequests.push(request.url());
      }
    });

    await gotoCold(page, "/neighborhoods", /\/neighborhoods/);
    await waitSessionReady(page);

    const trigger = page.getByRole("button", { name: EXPLORER_LABEL }).locator("visible=true").first();
    await expect(trigger).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(trigger).toBeEnabled({ timeout: COLD_START_TIMEOUT });
    await trigger.click();

    const explorerDialog = page.getByRole("dialog", { name: EXPLORER_LABEL });
    await expect(explorerDialog).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(page.locator('[data-yunicity-overlay="center"]').first()).toBeVisible();
    await expect(
      explorerDialog.getByText("Connectez-vous pour rechercher dans Reims et accéder aux résultats."),
    ).toBeVisible();
    await expect(explorerDialog.getByRole("link", { name: "Se connecter" })).toBeVisible();
    expect(searchRequests).toHaveLength(0);

    await page.keyboard.press("Escape");
    await expect(explorerDialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await context.close();
  });

  test("390 — clic unique ouvre Drawer sans appel /api/v1/search", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });

    const searchRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/search")) {
        searchRequests.push(request.url());
      }
    });

    await gotoCold(page, "/places", /\/places/);
    await waitSessionReady(page);

    const trigger = page.getByRole("button", { name: EXPLORER_LABEL }).locator("visible=true").first();
    await expect(trigger).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(trigger).toBeEnabled({ timeout: COLD_START_TIMEOUT });
    await trigger.click();

    const explorerDialog = page.getByRole("dialog", { name: EXPLORER_LABEL });
    await expect(explorerDialog).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(page.locator('[data-yunicity-overlay="bottom"]').first()).toBeVisible();
    await expect(
      explorerDialog.getByText("Connectez-vous pour rechercher dans Reims et accéder aux résultats."),
    ).toBeVisible();
    expect(searchRequests).toHaveLength(0);

    await page.keyboard.press("Escape");
    await expect(explorerDialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await context.close();
  });
});
