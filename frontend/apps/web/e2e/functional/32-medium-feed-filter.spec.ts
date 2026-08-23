/**
 * C3-FEED-M10 — expérience de filtre Feed medium (640 → 1279,98).
 *
 * Contrat réel : unique dimension « centres d'intérêt du profil », application
 * immédiate à l'ouverture de la Sheet, réinitialisation explicite.
 */
import type { Page } from "@playwright/test";

import {
  FEED_MEDIUM_FILTER_CRITERION_IDS,
  FEED_MEDIUM_FILTER_PANEL_TITLE,
} from "@/lib/layout/feed-medium-filter-contract";
import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "834x1112", width: 834, height: 1112 },
  { label: "1024x900", width: 1024, height: 900 },
  { label: "1279x900", width: 1279, height: 900 },
] as const;

const FILTER = "[data-feed-medium-header-filter]";
const PANEL = "[data-feed-medium-filter-panel]";
const RESET = "[data-feed-medium-filter-reset]";
const LIST = "[data-feed-stream-list]";
const PRIMARY = '[data-feed-medium-surface="primary"]';

async function gotoFeed(page: Page, size: { width: number; height: number }) {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
}

async function openFilter(page: Page) {
  const btn = page.locator(FILTER);
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(PANEL)).toBeVisible();
}

async function mountContext(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document.querySelectorAll(
            '[data-feed-medium-region="context"] [data-feed-medium-surface="primary"]',
          ).length,
      ),
    )
    .toBe(4);
  await page.evaluate(() => window.scrollTo(0, 0));
}

test.describe("C3-FEED-M10 — filtre Feed medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — déclencheur unique, surface unique, critère réel`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      const btn = authedPage.locator(FILTER);
      await expect(btn).toHaveCount(1);
      const box = await btn.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      await expect(btn).toHaveAccessibleName(/filtrer/i);

      await openFilter(authedPage);
      await expect(authedPage.getByRole("dialog", { name: FEED_MEDIUM_FILTER_PANEL_TITLE })).toHaveCount(
        1,
      );
      await expect(
        authedPage.locator(`[data-feed-medium-filter-criterion="${FEED_MEDIUM_FILTER_CRITERION_IDS[0]}"]`),
      ).toHaveCount(1);
      await expect(authedPage.locator("[data-feed-medium-filter-interest]")).toHaveCount(1);
      await expect(authedPage.locator("[data-feed-medium-filter-interest]")).toHaveAttribute(
        "data-feed-medium-filter-interest",
        "culture",
      );
      await expect(authedPage.locator(PANEL)).toContainText(/vidéo locale/i);
      expect(
        await authedPage.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
    });
  }

  test("768 — activation, réinitialisation, stream unique", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const avant = await authedPage.evaluate((sel) => ({
      lists: document.querySelectorAll(sel).length,
      posts: document.querySelectorAll(`${sel} [data-feed-stream-item="post"]`).length,
      videos: document.querySelectorAll(`${sel} [data-feed-stream-item="local-video"]`).length,
    }), LIST);

    await openFilter(authedPage);
    const btn = authedPage.locator(FILTER);
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await expect(btn).toHaveAttribute("data-feed-medium-filter-active", "");
    await expect(authedPage.locator("[data-feed-medium-filter-status]")).toContainText(/filtre actif/i);

    await authedPage.locator(RESET).click();
    await expect(authedPage.locator(PANEL)).toHaveCount(0);
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(btn).toHaveAttribute("aria-pressed", "false");

    const apres = await authedPage.evaluate((sel) => ({
      lists: document.querySelectorAll(sel).length,
      posts: document.querySelectorAll(`${sel} [data-feed-stream-item="post"]`).length,
      videos: document.querySelectorAll(`${sel} [data-feed-stream-item="local-video"]`).length,
    }), LIST);
    expect(apres.lists).toBe(1);
    expect(apres.lists).toBe(avant.lists);
    expect(apres.videos).toBe(avant.videos);
    expect(apres.posts).toBe(avant.posts);
  });

  test("768 — Escape et restitution du focus", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await openFilter(authedPage);
    await authedPage.keyboard.press("Escape");
    await expect(authedPage.locator(PANEL)).toHaveCount(0);
    await expect(authedPage.locator(FILTER)).toBeFocused();
    // Fermer ne désactive pas (contrat immédiat + Fermer).
    await expect(authedPage.locator(FILTER)).toHaveAttribute("aria-pressed", "true");
  });

  test("768 — onglets Feed ferment le panneau sans casser le stream", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await openFilter(authedPage);
    await authedPage.locator(RESET).click();
    await expect(authedPage.locator(PANEL)).toHaveCount(0);
    await authedPage.getByRole("tab", { name: /récent/i }).click();
    await expect(authedPage.locator(LIST)).toHaveCount(1);
    await expect(authedPage.locator(`${LIST} [data-feed-stream-item="local-video"]`)).toHaveCount(0);
    await authedPage.getByRole("tab", { name: /pour vous/i }).click();
    await expect(authedPage.locator(`${LIST} [data-feed-stream-item="local-video"]`)).toHaveCount(1);
  });

  test("768 — dix surfaces primaires et context après stream", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountContext(authedPage);
    await openFilter(authedPage);
    await authedPage.locator(RESET).click();
    await expect(authedPage.locator(PANEL)).toHaveCount(0);

    const m = await authedPage.evaluate((primarySel) => {
      const grid = document.querySelector(".feed-medium-editorial-grid")!;
      const surfaces = [...grid.querySelectorAll(primarySel)].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      const regions = [...grid.querySelectorAll("[data-feed-medium-region]")].map((el) =>
        el.getAttribute("data-feed-medium-region"),
      );
      return { n: surfaces.length, regions };
    }, PRIMARY);
    expect(m.n).toBe(10);
    expect(m.regions.indexOf("context")).toBeGreaterThan(m.regions.indexOf("stream"));
  });

  test("bascule 639 / 640 — mobile intact puis filtre medium", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 639, height: 900 });
    await expect(authedPage.locator(FILTER).filter({ visible: true })).toHaveCount(0);
    await expect(authedPage.locator(PANEL)).toHaveCount(0);

    await authedPage.setViewportSize({ width: 640, height: 900 });
    await expect(authedPage.locator(FILTER).filter({ visible: true })).toHaveCount(1);
    await openFilter(authedPage);
  });

  test("bascule 1279 / 1280 — desktop hors Sheet M10", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    await openFilter(authedPage);
    await expect(authedPage.locator(PANEL)).toBeVisible();
    await authedPage.keyboard.press("Escape");

    await authedPage.setViewportSize({ width: 1280, height: 900 });
    await expect(authedPage.locator(FILTER).filter({ visible: true })).toHaveCount(0);
    await expect(authedPage.locator(PANEL)).toHaveCount(0);
  });

  for (const route of [
    "/videos",
    "/map",
    "/sortir",
    "/search",
    "/tribes",
    "/passport",
    "/subscriptions",
    "/stories",
  ]) {
    test(`768 — ${route} n'hérite pas du filtre Feed M10`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await expect(authedPage.locator("main").first()).toBeVisible();
      const fuite = await authedPage.evaluate(() => ({
        panel: document.querySelectorAll("[data-feed-medium-filter-panel]").length,
        criterion: document.querySelectorAll("[data-feed-medium-filter-criterion]").length,
        headerFilter: document.querySelectorAll("[data-feed-medium-header-filter]").length,
      }));
      expect(fuite.panel).toBe(0);
      expect(fuite.criterion).toBe(0);
      expect(fuite.headerFilter).toBe(0);
    });
  }
});
