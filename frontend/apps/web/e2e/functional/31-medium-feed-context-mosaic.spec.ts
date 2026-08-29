import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const STREAM_PREFIX = ["post", "local-video", "post", "post"] as const;

const VIEWPORTS = [
  { label: "640x900", width: 640, height: 900, tier: "medium" as const },
  { label: "768x1024", width: 768, height: 1024, tier: "medium" as const },
  { label: "1023x900", width: 1023, height: 900, tier: "medium" as const },
  { label: "1024x900", width: 1024, height: 900, tier: "desktop" as const },
  { label: "1279x900", width: 1279, height: 900, tier: "desktop" as const },
] as const;

const STREAM = "[data-feed-stream-list]";
const CONTEXT = '[data-feed-stream-item="context-module"]';

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator(STREAM)).toBeVisible();
}

test.describe("C3-FEED-R2B - stream medium aligné desktop", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.label} - aucune région context parallèle ni module dans le flux`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, viewport);

      const stream = authedPage.locator(STREAM);
      const localVideo = stream.locator(':scope > li[data-feed-stream-item="local-video"]');
      const contextModules = stream.locator(CONTEXT);

      await expect(localVideo, "vidéo locale absente du stream").toHaveCount(1, {
        timeout: 15_000,
      });
      await expect(
        contextModules,
        "modules contextuels encore injectés dans le flux medium",
      ).toHaveCount(0, { timeout: 15_000 });
      await expect(
        stream.locator(":scope > li").first(),
        "stream vide ou non monté",
      ).toBeVisible({ timeout: 15_000 });

      const state = await stream.evaluate((streamElement) => {
        const directItems = [...streamElement.children];
        const kinds = directItems.map((item, index) => ({
          index,
          kind: item.getAttribute("data-feed-stream-item"),
          parentIsStream: item.parentElement === streamElement,
        }));

        return {
          streamCount: document.querySelectorAll("[data-feed-stream-list]").length,
          contextRegionCount: document.querySelectorAll('[data-feed-medium-region="context"]').length,
          mediumHeaderVisible: (() => {
            const header = document.querySelector(".feed-medium-header");
            return Boolean(
              header &&
                getComputedStyle(header).display !== "none" &&
                header.getBoundingClientRect().height > 0,
            );
          })(),
          totalItems: directItems.length,
          kinds,
        };
      });

      expect(state.streamCount).toBe(1);
      expect(state.contextRegionCount).toBe(0);
      expect(state.totalItems).toBeGreaterThanOrEqual(STREAM_PREFIX.length);
      expect(state.kinds.slice(0, STREAM_PREFIX.length)).toEqual(
        STREAM_PREFIX.map((kind, index) => ({
          index,
          kind,
          parentIsStream: true,
        })),
      );
      expect(state.kinds.filter((item) => item.kind === "local-video")).toHaveLength(1);
      expect(state.kinds.findIndex((item) => item.kind === "local-video")).toBe(1);
      expect(state.kinds.filter((item) => item.kind === "context-module")).toHaveLength(0);

      if (viewport.tier === "medium") {
        expect(state.mediumHeaderVisible, "header medium absent dans la bande").toBe(true);
      } else {
        expect(state.mediumHeaderVisible, "header medium fuité sur desktop").toBe(false);
      }
    });
  }
});
