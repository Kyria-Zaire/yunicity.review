/**
 * C3-VIDEOS-RESPONSIVE-SHELL — portail /videos medium (640 → 1023,98 px).
 */
import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const MEDIUM_HEADER = "[data-videos-medium-header-identity]";
const MOBILE_GRID = ".videos-mobile-grid";
const PORTRAIT_CARD = "[data-videos-desktop-portrait]";
const LANDSCAPE_CARD = "[data-videos-desktop-landscape]";
const LEFT_RAIL = ".videos-desktop-left-rail";

async function gotoVideos(page: Page, width: number, height = 1024): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/videos");
  await expect(page.locator("main").first()).toBeVisible();
}

async function isVisible(page: Page, selector: string): Promise<boolean> {
  return page.locator(selector).first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  });
}

test.describe("C3-VIDEOS-RESPONSIVE-SHELL — discovery medium", () => {
  test("639px — grille mobile, pas de header medium", async ({ authedPage }) => {
    await gotoVideos(authedPage, 639);
    expect(await isVisible(authedPage, MOBILE_GRID)).toBe(true);
    expect(await isVisible(authedPage, MEDIUM_HEADER)).toBe(false);
    expect(await isVisible(authedPage, PORTRAIT_CARD)).toBe(false);
  });

  test("768px — header medium + cartes stream, pas de grille mobile", async ({ authedPage }) => {
    await gotoVideos(authedPage, 768);
    expect(await isVisible(authedPage, MEDIUM_HEADER)).toBe(true);
    expect(await isVisible(authedPage, MOBILE_GRID)).toBe(false);
    await expect(authedPage.locator(PORTRAIT_CARD).or(authedPage.locator(LANDSCAPE_CARD))).toHaveCount(
      2,
      { timeout: 15_000 },
    );
  });

  test("1023px — header medium visible, rail desktop masqué", async ({ authedPage }) => {
    await gotoVideos(authedPage, 1023);
    expect(await isVisible(authedPage, MEDIUM_HEADER)).toBe(true);
    expect(await isVisible(authedPage, LEFT_RAIL)).toBe(false);
  });

  test("1024px — rail desktop visible, header medium masqué", async ({ authedPage }) => {
    await gotoVideos(authedPage, 1024);
    expect(await isVisible(authedPage, LEFT_RAIL)).toBe(true);
    expect(await isVisible(authedPage, MEDIUM_HEADER)).toBe(false);
    await expect(authedPage.locator(PORTRAIT_CARD).or(authedPage.locator(LANDSCAPE_CARD))).toHaveCount(
      2,
      { timeout: 15_000 },
    );
  });
});
