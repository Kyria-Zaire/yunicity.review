import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "1279x900", width: 1279, height: 900 },
] as const;

const STREAM = "[data-feed-stream-list]";
const CONTEXT = '[data-feed-stream-item="context-module"]';
const EXPECTED_STREAM_ORDER = ["post", "local-video", "post", "post", "context-module"] as const;
const EXPECTED_CONTEXT_FAMILIES = ["must-see"] as const;

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator(STREAM)).toBeVisible();
}

test.describe("C3-FEED-R2B - contexte dans le stream medium", () => {
  for (const viewport of MEDIUM) {
    test(`${viewport.label} - aucune region context parallele`, async ({ authedPage }) => {
      await gotoFeed(authedPage, viewport);

      const stream = authedPage.locator(STREAM);
      const localVideo = stream.locator(':scope > li[data-feed-stream-item="local-video"]');
      const mustSee = stream.locator(
        ':scope > li[data-feed-stream-item="context-module"][data-feed-context-module="must-see"]',
      );

      await expect(localVideo, "vidéo locale absente du stream court").toHaveCount(1, { timeout: 15_000 });
      await expect(mustSee, "module must-see absent du premier slot atteignable").toHaveCount(1, {
        timeout: 15_000,
      });
      await expect(stream.locator(":scope > li"), "stream court incomplet ou dupliqué").toHaveCount(
        EXPECTED_STREAM_ORDER.length,
        { timeout: 15_000 },
      );

      const state = await stream.evaluate((streamElement, contextSelector) => {
        const directItems = [...streamElement.children];
        const modules = directItems.filter(
          (item) => item instanceof HTMLElement && item.matches(contextSelector),
        );
        const kinds = directItems.map((item, index) => ({
          index,
          kind: item.getAttribute("data-feed-stream-item"),
          family: item.getAttribute("data-feed-context-module"),
          parentIsStream: item.parentElement === streamElement,
        }));
        const contextIndices = kinds.flatMap((item) =>
          item.kind === "context-module" && item.family === "must-see" ? [item.index] : [],
        );
        if (contextIndices.length !== 1) {
          throw new Error(`module contextuel must-see attendu une fois. Relevé : ${JSON.stringify(kinds)}`);
        }
        const contextIndex = contextIndices[0];
        if (contextIndex === undefined) {
          throw new Error(`index du module contextuel must-see absent. Relevé : ${JSON.stringify(kinds)}`);
        }
        const contextItem = directItems[contextIndex];
        if (!contextItem) {
          throw new Error(
            `item contextuel introuvable à l'index ${contextIndex}. Relevé : ${JSON.stringify(kinds)}`,
          );
        }
        const effectivelyVisible = (element: Element | null) => {
          if (!(element instanceof HTMLElement)) return false;
          const rect = element.getBoundingClientRect();
          if (element.getClientRects().length === 0 || rect.width <= 0 || rect.height <= 0) return false;
          for (let node: Element | null = element; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (
              style.display === "none" ||
              style.display === "contents" ||
              style.visibility === "hidden" ||
              style.visibility === "collapse" ||
              node.hasAttribute("hidden") ||
              node.hasAttribute("inert") ||
              style.contentVisibility === "hidden"
            ) {
              return false;
            }
          }
          return true;
        };
        const section =
          contextItem instanceof HTMLElement ? contextItem.querySelector(":scope > section") : null;
        const heading = section?.querySelector(":scope > div > h2") ?? null;
        const cta = section?.querySelector(':scope > div > a[href="/sortir"]') ?? null;
        const sectionRect = section?.getBoundingClientRect() ?? null;

        return {
          streamCount: document.querySelectorAll("[data-feed-stream-list]").length,
          contextRegionCount: document.querySelectorAll('[data-feed-medium-region="context"]')
            .length,
          kinds,
          realContentBeforeModule: kinds.slice(0, contextIndex).filter(
            (item) => item.kind === "post" || item.kind === "local-video",
          ).length,
          moduleCount: modules.length,
          moduleFamilies: modules.map((module) => module.getAttribute("data-feed-context-module")),
          mustSeeIndex: contextIndex,
          mustSeeCount: modules.filter(
            (module) => module.getAttribute("data-feed-context-module") === "must-see",
          ).length,
          localPrivilegeCount: modules.filter(
            (module) => module.getAttribute("data-feed-context-module") === "local-privilege",
          ).length,
          localNowCount: modules.filter(
            (module) => module.getAttribute("data-feed-context-module") === "local-now",
          ).length,
          mustSeeDirectChild: contextItem.parentElement === streamElement,
          mustSeeVisible: effectivelyVisible(contextItem),
          sectionCount: contextItem instanceof HTMLElement ? contextItem.querySelectorAll(":scope > section").length : 0,
          sectionVisible: effectivelyVisible(section),
          sectionWidth: sectionRect?.width ?? -1,
          sectionHeight: sectionRect?.height ?? -1,
          headingText: heading?.textContent?.trim() ?? "",
          headingVisible: effectivelyVisible(heading),
          ctaText: cta?.textContent?.trim() ?? "",
          ctaHref: cta instanceof HTMLAnchorElement ? cta.getAttribute("href") : null,
          ctaVisible: effectivelyVisible(cta),
        };
      }, CONTEXT);

      expect(state.streamCount).toBe(1);
      expect(state.contextRegionCount).toBe(0);
      expect(state.kinds).toEqual(
        EXPECTED_STREAM_ORDER.map((kind, index) => ({
          index,
          kind,
          family: kind === "context-module" ? "must-see" : null,
          parentIsStream: true,
        })),
      );
      expect(state.realContentBeforeModule).toBe(4);
      expect(state.moduleCount).toBe(EXPECTED_CONTEXT_FAMILIES.length);
      expect(state.moduleFamilies).toEqual([...EXPECTED_CONTEXT_FAMILIES]);
      expect(state.mustSeeIndex).toBe(4);
      expect(state.mustSeeCount).toBe(1);
      // Slots 10 and 17 are unreachable with the QA stream's four real contents.
      expect(state.localPrivilegeCount).toBe(0);
      expect(state.localNowCount).toBe(0);
      expect(state.mustSeeDirectChild).toBe(true);
      expect(state.mustSeeVisible).toBe(true);
      expect(state.sectionCount).toBe(1);
      expect(state.sectionVisible).toBe(true);
      expect(state.sectionWidth).toBeGreaterThan(0);
      expect(state.sectionHeight).toBeGreaterThan(0);
      expect(state.headingText).toBe("À ne pas manquer");
      expect(state.headingVisible).toBe(true);
      expect(state.ctaText).toBe("Voir tout");
      expect(state.ctaHref).toBe("/sortir");
      expect(state.ctaVisible).toBe(true);
    });
  }
});
