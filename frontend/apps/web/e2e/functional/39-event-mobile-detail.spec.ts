/**
 * EVENT-MOBILE-DETAIL-01 — smoke /events/[id] maquette mobile (≤639).
 */
import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL, bearer, expect, test, type QaUser } from "../fixtures";

const MOBILE = "[data-event-mobile-detail]";
const HERO = "[data-event-mobile-hero]";
const PARTICIPATE = "[data-event-mobile-participate]";
const NAV = ".web-mobile-strategic-bottom-nav";
const DESKTOP = "[data-event-desktop-detail]";
const MEDIUM = "[data-event-medium-detail]";

async function resolveFeaturedEventId(api: APIRequestContext, user: QaUser): Promise<string> {
  const response = await api.get(`${API_URL}/api/v1/events?city=Reims`, {
    headers: bearer(user),
  });
  expect(response.ok(), "liste des événements QA indisponible").toBe(true);
  const items = ((await response.json()) as { items: Array<{ id: string; title: string }> }).items;
  const featured =
    items.find((item) => /cathédrale|cathedrale/i.test(item.title)) ?? items[0];
  expect(featured?.id, "événement QA seedé attendu").toBeTruthy();
  return featured!.id;
}

async function gotoEventDetail(page: Page, eventId: string, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(`/events/${eventId}`);
  await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
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

test.describe("EVENT-MOBILE-DETAIL-01 — détail mobile", () => {
  test("390px — hero + Participer + navbar Sortir, pas de vues medium/desktop", async ({
    citizenAPage,
    api,
    citizenA,
  }) => {
    const eventId = await resolveFeaturedEventId(api, citizenA);
    await gotoEventDetail(citizenAPage, eventId, 390);

    expect(await isCssVisible(citizenAPage, MOBILE)).toBe(true);
    expect(await isCssVisible(citizenAPage, HERO)).toBe(true);
    expect(await isCssVisible(citizenAPage, PARTICIPATE)).toBe(true);
    expect(await isCssVisible(citizenAPage, NAV)).toBe(true);
    expect(await isCssVisible(citizenAPage, MEDIUM)).toBe(false);
    expect(await isCssVisible(citizenAPage, DESKTOP)).toBe(false);
    await expect(citizenAPage.getByRole("link", { name: /Retour à Sortir/i })).toBeVisible();
    await expect(citizenAPage.locator("[data-event-mobile-hero-header]")).toBeVisible();
    await expect(citizenAPage.locator(PARTICIPATE).getByRole("button", { name: /^Participer$/ })).toBeVisible();
    await expect(citizenAPage.getByRole("link", { name: /^Sortir$/ })).toBeVisible();
  });

  test("768px — vue mobile masquée", async ({ citizenAPage, api, citizenA }) => {
    const eventId = await resolveFeaturedEventId(api, citizenA);
    await gotoEventDetail(citizenAPage, eventId, 768);
    expect(await isCssVisible(citizenAPage, MOBILE)).toBe(false);
    expect(await isCssVisible(citizenAPage, NAV)).toBe(false);
  });
});
