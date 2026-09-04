/**
 * DESKTOP-SORTIR-01 — portail /sortir responsive (mobile / medium / desktop).
 */
import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const MOBILE_ONLY = ".web-mobile-sortir-only";
const MOBILE_HEADER = "[data-sortir-mobile-header]";
const MOBILE_SHELL = "[data-sortir-mobile-shell]";
const MOBILE_FEATURED = "[data-sortir-mobile-featured]";
const TABLET_DESKTOP = "[data-sortir-tablet-desktop]";
const MEDIUM_SHELL = "[data-sortir-medium-shell]";
const MEDIUM_HEADER = "[data-sortir-medium-header]";
const DESKTOP_SHELL = "[data-sortir-desktop-shell]";
const LEFT_RAIL = "[data-sortir-desktop-left-rail]";
const RIGHT_RAIL = "[data-sortir-desktop-right-rail]";
const EDITORIAL = "[data-sortir-desktop-editorial]";
const MEDIUM_AGENDA = "[data-sortir-medium-agenda]";
const TONIGHT = "[data-sortir-tonight-grid]";
const TOGGLE_FREE = '[data-sortir-toggle="free"]';
const TOGGLE_NEARBY = '[data-sortir-toggle="nearby"]';

async function gotoSortir(page: Page, width: number, height = 1024): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/sortir");
  await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
  // Attendre la fin du fetch agenda (évite l’écran « Chargement… »).
  await expect(page.getByText(/Chargement/)).toHaveCount(0, { timeout: 45_000 });
}

async function isCssVisible(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) return false;
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    let node: Element | null = el;
    while (node) {
      const computed = window.getComputedStyle(node);
      if (computed.display === "none" || computed.visibility === "hidden") return false;
      node = node.parentElement;
    }
    return true;
  });
}

test.describe("DESKTOP-SORTIR-01 — shell responsive", () => {
  test("639px — mobile Sortir maquette, pas de rails desktop", async ({ citizenAPage }) => {
    await gotoSortir(citizenAPage, 639);
    await expect(citizenAPage.locator(MOBILE_HEADER)).toBeVisible();
    await expect(
      citizenAPage.locator(`${MOBILE_HEADER} [data-yunicity-mobile-header-control="logo"]`),
    ).toBeVisible();
    await expect(citizenAPage.locator(`${MOBILE_ONLY} h1`)).toBeVisible();
    await expect(citizenAPage.locator(MOBILE_SHELL)).toBeVisible();
    await expect(citizenAPage.locator(MOBILE_FEATURED)).toBeVisible();
    expect(await isCssVisible(citizenAPage, LEFT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, RIGHT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, EDITORIAL)).toBe(false);
    expect(await isCssVisible(citizenAPage, MEDIUM_HEADER)).toBe(false);
  });

  test("768px — shell medium maquette, rails desktop masqués", async ({ citizenAPage }) => {
    await gotoSortir(citizenAPage, 768);
    expect(await isCssVisible(citizenAPage, TABLET_DESKTOP)).toBe(true);
    expect(await isCssVisible(citizenAPage, DESKTOP_SHELL)).toBe(false);
    expect(await isCssVisible(citizenAPage, LEFT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, RIGHT_RAIL)).toBe(false);
    await expect(citizenAPage.locator(MEDIUM_SHELL)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_HEADER)).toBeVisible();
    await expect(citizenAPage.locator(EDITORIAL)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_AGENDA)).toBeVisible();
    await expect(citizenAPage.locator(TONIGHT)).toBeVisible();
  });

  test("1023px — medium haute, shell 3 colonnes masqué", async ({ citizenAPage }) => {
    await gotoSortir(citizenAPage, 1023);
    expect(await isCssVisible(citizenAPage, TABLET_DESKTOP)).toBe(true);
    expect(await isCssVisible(citizenAPage, MEDIUM_SHELL)).toBe(true);
    expect(await isCssVisible(citizenAPage, LEFT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, RIGHT_RAIL)).toBe(false);
  });

  test("1024px — rails + éditorial desktop, layout tablette masqué", async ({ citizenAPage }) => {
    await gotoSortir(citizenAPage, 1024);
    await expect(citizenAPage.locator(LEFT_RAIL)).toBeVisible();
    await expect(citizenAPage.locator(RIGHT_RAIL)).toBeVisible();
    await expect(citizenAPage.locator(EDITORIAL)).toBeVisible();
    await expect(citizenAPage.locator(TONIGHT)).toBeVisible();
    expect(await isCssVisible(citizenAPage, TABLET_DESKTOP)).toBe(false);
  });

  test("1366px — toggles filtres cochables", async ({ citizenAPage }) => {
    await gotoSortir(citizenAPage, 1366, 900);
    await expect(citizenAPage.locator(TOGGLE_FREE)).toBeVisible();
    await expect(citizenAPage.locator(TOGGLE_NEARBY)).toBeVisible();

    await citizenAPage.locator(TOGGLE_FREE).click();
    await expect(citizenAPage.locator(TOGGLE_FREE)).toHaveAttribute("aria-checked", "true");

    await citizenAPage.locator(TOGGLE_NEARBY).click();
    await expect(citizenAPage.locator(TOGGLE_NEARBY)).toHaveAttribute("aria-checked", "true");

    await citizenAPage.locator(TOGGLE_FREE).click();
    await expect(citizenAPage.locator(TOGGLE_FREE)).toHaveAttribute("aria-checked", "false");
  });
});
