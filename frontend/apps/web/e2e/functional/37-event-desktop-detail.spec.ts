/**
 * DESKTOP-EVENT-DETAIL-01 — smoke desktop /events/[id] maquette Sortir.
 */
import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL, bearer, expect, test, type QaUser } from "../fixtures";

const DETAIL = "[data-event-desktop-detail]";
const HERO = "[data-event-desktop-hero]";
const META = "[data-event-desktop-meta]";
const SIDEBAR = "[data-event-desktop-sidebar]";
const BREADCRUMBS = "[data-event-detail-breadcrumbs]";
const ABOUT = "[data-event-desktop-about]";

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

test.describe("DESKTOP-EVENT-DETAIL-01 — détail desktop", () => {
  test("1024px — chrome Retour + breadcrumbs + hero + Participer + similaires", async ({
    citizenAPage,
    api,
    citizenA,
  }) => {
    const eventId = await resolveFeaturedEventId(api, citizenA);
    await gotoEventDetail(citizenAPage, eventId, 1024);

    expect(await isCssVisible(citizenAPage, DETAIL)).toBe(true);
    await expect(citizenAPage.getByRole("link", { name: /Retour à Sortir/i })).toBeVisible();
    await expect(citizenAPage.locator(BREADCRUMBS)).toBeVisible();
    await expect(citizenAPage.locator(HERO)).toBeVisible();
    await expect(citizenAPage.locator(META)).toBeVisible();
    await expect(citizenAPage.locator(ABOUT)).toBeVisible();
    await expect(citizenAPage.locator(SIDEBAR)).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: /^Participer$/ })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Votre agenda" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Vous aimerez aussi" })).toBeVisible();

    const heroImg = citizenAPage.locator(`${HERO} img`).first();
    await expect(heroImg).toBeVisible();
    const src = await heroImg.getAttribute("src");
    expect(src?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test("639px — vue desktop masquée (mobile only)", async ({ citizenAPage, api, citizenA }) => {
    const eventId = await resolveFeaturedEventId(api, citizenA);
    await gotoEventDetail(citizenAPage, eventId, 639);
    expect(await isCssVisible(citizenAPage, DETAIL)).toBe(false);
  });
});
