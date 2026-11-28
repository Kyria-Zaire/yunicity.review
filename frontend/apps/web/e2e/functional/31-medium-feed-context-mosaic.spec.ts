import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

/**
 * ── Conflit de contrats, tranché ─────────────────────────────────────────────
 * Cette spec interdisait tout module contextuel dans le flux medium
 * (« modules contextuels ENCORE injectés dans le flux medium »). La spec 34,
 * sous le MÊME tag C3-FEED-R2B, les exige sous la borne desktop, aux rangs de
 * la cadence. Les deux ne pouvaient pas avoir raison.
 *
 * Cause : les modules étaient absents à TOUTE largeur — une exclusion desktop
 * appliquée sans condition de largeur au flux unique. Cette spec a codifié cet
 * état comme la règle voulue.
 *
 * DÉCISION PRODUIT : cadence unique, rendu par palier. Les modules sont
 * visibles sous 1024 px et masqués au-delà. Ce que cette spec prouve en propre
 * reste intact : un seul flux, AUCUNE région context parallèle, la vidéo au
 * rang 1, et le header medium borné à son palier.
 */
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
      // Les modules vivent DANS le flux — jamais dans une région parallèle.
      await expect(
        contextModules,
        "cadence absente du flux",
      ).not.toHaveCount(0, { timeout: 15_000 });
      if (viewport.tier === "medium") {
        await expect(
          contextModules.first(),
          "module contextuel masqué sous la borne",
        ).toBeVisible({ timeout: 15_000 });
      }
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
        /* Le palier desktop masque les modules au rendu : leurs <li> restent
           dans le flux. Compter les noeuds confondrait « masqué » et « absent
           du flux », la distinction même que porte la décision. */
        const modulesVisibles = directItems.filter((item) => {
          if (item.getAttribute("data-feed-stream-item") !== "context-module") return false;
          for (let node: Element | null = item; node; node = node.parentElement) {
            if (getComputedStyle(node).display === "none") return false;
          }
          return item.getBoundingClientRect().height > 0;
        }).length;

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
          modulesVisibles,
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
      // Cadence présente dans le flux à tout palier…
      expect(
        state.kinds.filter((item) => item.kind === "context-module").length,
        "cadence absente du flux",
      ).toBeGreaterThan(0);
      // …et visible seulement sous la borne.
      if (viewport.tier === "medium") {
        expect(state.modulesVisibles, "modules masqués sous la borne").toBeGreaterThan(0);
      } else {
        expect(state.modulesVisibles, "modules visibles au-delà de la borne").toBe(0);
      }

      if (viewport.tier === "medium") {
        expect(state.mediumHeaderVisible, "header medium absent dans la bande").toBe(true);
      } else {
        expect(state.mediumHeaderVisible, "header medium fuité sur desktop").toBe(false);
      }
    });
  }
});
