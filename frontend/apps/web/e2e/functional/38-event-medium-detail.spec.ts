/**
 * EVENT-MEDIUM-DETAIL-01 — smoke /events/[id] maquette medium (640–1023).
 */
import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL, bearer, expect, test, type QaUser } from "../fixtures";

const MEDIUM = "[data-event-medium-detail]";
const DESKTOP = "[data-event-desktop-detail]";
const HEADER = "[data-event-medium-header]";
const HERO = "[data-event-desktop-hero]";
const PARTICIPATE = "[data-event-medium-participate]";
const LIEU = "[data-event-medium-lieu]";
const AGENDA = "[data-event-medium-agenda]";
const SIMILAR = "[data-event-medium-similar]";
const RAIL = "[data-citizen-medium-rail]";

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
  await page.setViewportSize({ width, height: 1024 });
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

test.describe("EVENT-MEDIUM-DETAIL-01 — détail medium", () => {
  test("768px — header + hero + Participer + agenda barre + rail, pas de sidebar desktop", async ({
    citizenAPage,
    api,
    citizenA,
  }) => {
    const eventId = await resolveFeaturedEventId(api, citizenA);
    await gotoEventDetail(citizenAPage, eventId, 768);

    expect(await isCssVisible(citizenAPage, MEDIUM)).toBe(true);
    expect(await isCssVisible(citizenAPage, DESKTOP)).toBe(false);
    expect(await isCssVisible(citizenAPage, HEADER)).toBe(true);
    expect(await isCssVisible(citizenAPage, HERO)).toBe(true);
    expect(await isCssVisible(citizenAPage, PARTICIPATE)).toBe(true);
    expect(await isCssVisible(citizenAPage, AGENDA)).toBe(true);
    expect(await isCssVisible(citizenAPage, RAIL)).toBe(true);
    await expect(citizenAPage.locator(PARTICIPATE).getByRole("button", { name: /^Participer$/ })).toBeVisible();
    await expect(citizenAPage.locator(LIEU)).toBeVisible();
    await expect(citizenAPage.locator(LIEU).getByRole("link", { name: /Voir sur la carte/i })).toBeVisible();
    await expect(citizenAPage.locator(AGENDA).getByRole("heading", { name: "Votre agenda" })).toBeVisible();
    await expect(citizenAPage.locator("[data-event-desktop-sidebar]")).toHaveCount(1);
    expect(await isCssVisible(citizenAPage, "[data-event-desktop-sidebar]")).toBe(false);
    const similarCount = await citizenAPage.locator(SIMILAR).count();
    if (similarCount > 0) {
      expect(await isCssVisible(citizenAPage, SIMILAR)).toBe(true);
    }
  });

  test("1024px — vue medium masquée, desktop visible", async ({ citizenAPage, api, citizenA }) => {
    const eventId = await resolveFeaturedEventId(api, citizenA);
    await gotoEventDetail(citizenAPage, eventId, 1024);
    expect(await isCssVisible(citizenAPage, MEDIUM)).toBe(false);
    expect(await isCssVisible(citizenAPage, DESKTOP)).toBe(true);
  });

  test("639px — vue medium masquée", async ({ citizenAPage, api, citizenA }) => {
    const eventId = await resolveFeaturedEventId(api, citizenA);
    await gotoEventDetail(citizenAPage, eventId, 639);
    expect(await isCssVisible(citizenAPage, MEDIUM)).toBe(false);
  });
});
