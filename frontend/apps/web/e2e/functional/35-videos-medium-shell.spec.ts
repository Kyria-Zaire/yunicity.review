/**
 * C3-VIDEOS-RESPONSIVE-SHELL — portail /videos medium (640 → 1023,98 px).
 */
import type { Page } from "@playwright/test";

import { expect, testCitizen as test } from "../fixtures";

const MEDIUM_HEADER = "[data-videos-medium-header-identity]";
const MOBILE_GRID = ".videos-mobile-grid";
const MOBILE_IMMERSIVE = "[data-videos-discovery-immersive=\"\"]";
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

async function expectPortraitAndLandscapeCards(page: Page): Promise<void> {
  await expect(page.locator(PORTRAIT_CARD).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(LANDSCAPE_CARD).first()).toBeVisible({ timeout: 15_000 });
}

test.describe("C3-VIDEOS-RESPONSIVE-SHELL — discovery medium", () => {
  test("639px — immersif discovery mobile, pas de header medium", async ({ citizenAPage }) => {
    await gotoVideos(citizenAPage, 639, 844);
    expect(await isVisible(citizenAPage, MOBILE_IMMERSIVE)).toBe(true);
    expect(await isVisible(citizenAPage, MEDIUM_HEADER)).toBe(false);
    expect(await isVisible(citizenAPage, PORTRAIT_CARD)).toBe(false);
  });

  test("768px — header medium + cartes stream, pas de grille mobile", async ({ citizenAPage }) => {
    await gotoVideos(citizenAPage, 768);
    expect(await isVisible(citizenAPage, MEDIUM_HEADER)).toBe(true);
    expect(await isVisible(citizenAPage, MOBILE_GRID)).toBe(false);
    await expectPortraitAndLandscapeCards(citizenAPage);
  });

  test("1023px — header medium visible, rail desktop masqué", async ({ citizenAPage }) => {
    await gotoVideos(citizenAPage, 1023);
    expect(await isVisible(citizenAPage, MEDIUM_HEADER)).toBe(true);
    expect(await isVisible(citizenAPage, LEFT_RAIL)).toBe(false);
  });

  test("1024px — rail desktop visible, header medium masqué", async ({ citizenAPage }) => {
    await gotoVideos(citizenAPage, 1024);
    expect(await isVisible(citizenAPage, LEFT_RAIL)).toBe(true);
    expect(await isVisible(citizenAPage, MEDIUM_HEADER)).toBe(false);
    await expectPortraitAndLandscapeCards(citizenAPage);
  });
});
