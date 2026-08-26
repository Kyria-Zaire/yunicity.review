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
    await expect(authedPage.locator(`${LIST} [data-feed-stream-item="context-module"]`)).toHaveCount(0);
    await authedPage.getByRole("tab", { name: /pour vous/i }).click();
    await expect(authedPage.locator(`${LIST} [data-feed-stream-item="local-video"]`)).toHaveCount(1);
  });

  test("768 — filtre et onglets préservent le flux enrichi unique", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const streamList = authedPage.locator(LIST);

    // Await pour vous stream: should have video + context asynchronously
    await expect(
      streamList.locator('[data-feed-stream-item="local-video"]'),
      "attendu: vidéo locale dans le stream",
    ).toHaveCount(1, { timeout: 15_000 });

    await expect(
      streamList.locator(
        ':scope > li[data-feed-stream-item="context-module"][data-feed-context-module="must-see"]',
      ),
      "attendu: module must-see atteignable",
    ).toHaveCount(1, { timeout: 15_000 });

    await expect(
      streamList.locator(":scope > li"),
      "attendu: exactement 5 items (post, local-video, post, post, context-module)",
    ).toHaveCount(5, { timeout: 15_000 });

    // Verify exact order and structure
    const initialKinds = await streamList.locator(":scope > li").evaluateAll((items) =>
      items.map((el) => ({
        kind: el.getAttribute("data-feed-stream-item"),
        family: el.getAttribute("data-feed-context-module"),
      })),
    );

    expect(initialKinds).toEqual([
      { kind: "post", family: null },
      { kind: "local-video", family: null },
      { kind: "post", family: null },
      { kind: "post", family: null },
      { kind: "context-module", family: "must-see" },
    ]);

    // Verify post ID uniqueness at baseline
    const initialPostIds = await streamList
      .locator(":scope > li[data-feed-stream-item='post']")
      .evaluateAll((posts) => {
        const ids: string[] = [];
        for (const post of posts) {
          const id = post.getAttribute("data-feed-post-id");
          if (typeof id !== "string") {
            throw new Error("post missing data-feed-post-id attribute");
          }
          const trimmed = id.trim();
          if (trimmed.length === 0) {
            throw new Error(`post has empty data-feed-post-id: "${id}"`);
          }
          ids.push(id);
        }
        if (ids.length !== 3) {
          throw new Error(`expected exactly 3 posts, found ${ids.length}: [${ids.join(", ")}]`);
        }
        const uniqueIds = new Set(ids);
        if (uniqueIds.size !== ids.length) {
          const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
          throw new Error(
            `duplicate post IDs detected (expected all unique): ${duplicates.join(", ")}`,
          );
        }
        return ids;
      });
    expect(initialPostIds).toHaveLength(3);

    // Verify context module structure and visibility
    const contextModule = streamList.locator(
      ':scope > li[data-feed-stream-item="context-module"][data-feed-context-module="must-see"]',
    );
    const section = contextModule.locator(":scope > section").first();
    await expect(section, "contexte: une section").toHaveCount(1);

    const contextState = await contextModule.evaluate((el) => {
      const section = el.querySelector(":scope > section");
      if (!section) return { valid: false, reason: "pas de section" };

      const heading = section.querySelector("h2");
      const headingText = heading?.textContent?.trim() ?? "";

      const ctaLink = section.querySelector('a[href="/sortir"]');
      const ctaText = ctaLink?.textContent?.trim() ?? "";

      const rect = section.getBoundingClientRect();

      const isVisible = (node: Element | null) => {
        if (!node || !(node instanceof HTMLElement)) return false;
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (node.hasAttribute("hidden") || node.hasAttribute("inert")) return false;
        return rect.width > 0 && rect.height > 0;
      };

      return {
        valid: true,
        headingText,
        hasHeading: headingText.length > 0,
        hasCtaLink: ctaText.length > 0,
        ctaHref: ctaLink instanceof HTMLAnchorElement ? ctaLink.getAttribute("href") : null,
        sectionVisible: isVisible(section),
        sectionWidth: rect.width,
        sectionHeight: rect.height,
      };
    });

    expect(contextState.valid).toBe(true);
    expect(contextState.headingText).toContain("À ne pas manquer");
    expect(contextState.hasCtaLink).toBe(true);
    expect(contextState.ctaHref).toBe("/sortir");
    expect(contextState.sectionVisible).toBe(true);
    expect(contextState.sectionWidth).toBeGreaterThan(0);
    expect(contextState.sectionHeight).toBeGreaterThan(0);

    // Filter activation: open, reset, verify stream unchanged
    await openFilter(authedPage);
    await expect(authedPage.locator(PANEL)).toBeVisible();
    await authedPage.locator(RESET).click();
    await expect(authedPage.locator(PANEL)).toHaveCount(0);

    const afterReset = await streamList.locator(":scope > li").evaluateAll((items) =>
      items.map((el) => ({
        kind: el.getAttribute("data-feed-stream-item"),
        family: el.getAttribute("data-feed-context-module"),
      })),
    );
    expect(afterReset).toEqual(initialKinds);

    // Récent: no video, no context-module
    await authedPage.getByRole("tab", { name: /récent/i }).click();
    await expect(streamList).toHaveCount(1);
    await expect(streamList.locator('[data-feed-stream-item="local-video"]')).toHaveCount(0);
    await expect(streamList.locator('[data-feed-stream-item="context-module"]')).toHaveCount(0);

    // Populaire: no video, no context-module
    await authedPage.getByRole("tab", { name: /populaire/i }).click();
    await expect(streamList).toHaveCount(1);
    await expect(streamList.locator('[data-feed-stream-item="local-video"]')).toHaveCount(0);
    await expect(streamList.locator('[data-feed-stream-item="context-module"]')).toHaveCount(0);

    // Return to Pour vous: full restoration
    await authedPage.getByRole("tab", { name: /pour vous/i }).click();
    await expect(streamList.locator('[data-feed-stream-item="local-video"]')).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(
      streamList.locator(
        ':scope > li[data-feed-stream-item="context-module"][data-feed-context-module="must-see"]',
      ),
    ).toHaveCount(1, { timeout: 15_000 });

    const restored = await streamList.locator(":scope > li").evaluateAll((items) =>
      items.map((el) => ({
        kind: el.getAttribute("data-feed-stream-item"),
        family: el.getAttribute("data-feed-context-module"),
      })),
    );
    expect(restored).toEqual(initialKinds);

    // Verify post ID restoration after tab transitions
    const restoredPostIds = await streamList
      .locator(":scope > li[data-feed-stream-item='post']")
      .evaluateAll((posts) => {
        const ids: string[] = [];
        for (const post of posts) {
          const id = post.getAttribute("data-feed-post-id");
          if (typeof id !== "string") {
            throw new Error("post missing data-feed-post-id attribute after restoration");
          }
          const trimmed = id.trim();
          if (trimmed.length === 0) {
            throw new Error(`post has empty data-feed-post-id after restoration: "${id}"`);
          }
          ids.push(id);
        }
        if (ids.length !== 3) {
          throw new Error(
            `expected exactly 3 posts after restoration, found ${ids.length}: [${ids.join(", ")}]`,
          );
        }
        const uniqueIds = new Set(ids);
        if (uniqueIds.size !== ids.length) {
          const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
          throw new Error(
            `duplicate post IDs detected after restoration (expected all unique): ${duplicates.join(", ")}`,
          );
        }
        return ids;
      });
    expect(restoredPostIds).toHaveLength(3);
    expect(restoredPostIds).toEqual(initialPostIds);
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
