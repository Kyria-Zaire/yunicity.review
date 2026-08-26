import type { Page } from "@playwright/test";

import { FEED_MEDIUM_REGIONS } from "@/lib/layout/feed-medium-regions";
import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "1279x900", width: 1279, height: 900 },
] as const;

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("[data-feed-stream-list]")).toBeVisible();
}

test.describe("C3-FEED-R2B - colonne editoriale medium", () => {
  for (const viewport of MEDIUM) {
    test(`${viewport.label} - trois regions et un flux unique`, async ({ authedPage }) => {
      await gotoFeed(authedPage, viewport);

      const state = await authedPage.evaluate(() => {
        const grid = document.querySelector(".feed-medium-editorial-grid");
        const shell = document.querySelector(".feed-app-shell-content");
        const mediumRail = document.querySelector("[data-citizen-medium-rail]");
        const regions = [...document.querySelectorAll("[data-feed-medium-region]")];
        const childDiagnostics = shell
          ? [...shell.children].map((child) => {
              const style = getComputedStyle(child);
              const rect = child.getBoundingClientRect();
              const clientRects = child.getClientRects().length;
              const hidden = child.hasAttribute("hidden");
              const inert = child.hasAttribute("inert");
              let ancestorsVisible = true;
              let ancestor = child.parentElement;

              while (ancestor) {
                const ancestorStyle = getComputedStyle(ancestor);
                if (
                  ancestorStyle.display === "none" ||
                  ancestorStyle.visibility === "hidden" ||
                  ancestorStyle.visibility === "collapse" ||
                  ancestorStyle.getPropertyValue("content-visibility") === "hidden" ||
                  ancestor.hasAttribute("hidden") ||
                  ancestor.hasAttribute("inert")
                ) {
                  ancestorsVisible = false;
                  break;
                }
                if (ancestor === document.body) break;
                ancestor = ancestor.parentElement;
              }

              const generatesBox =
                style.display !== "none" &&
                style.display !== "contents" &&
                style.visibility !== "hidden" &&
                style.visibility !== "collapse" &&
                style.getPropertyValue("content-visibility") !== "hidden" &&
                !hidden &&
                !inert &&
                clientRects > 0 &&
                rect.width > 0 &&
                rect.height > 0 &&
                ancestorsVisible;

              return {
                tag: child.tagName,
                classes: child.getAttribute("class") ?? "",
                display: style.display,
                visibility: style.visibility,
                width: rect.width,
                height: rect.height,
                clientRects,
                hidden,
                inert,
                ancestorsVisible,
                generatesBox,
                isFeedMediumColumn: child.classList.contains("feed-medium-column"),
              };
            })
          : [];
        const visibleFlexItems = childDiagnostics.filter((child) => child.generatesBox);
        return {
          display: grid ? getComputedStyle(grid).display : null,
          gridLeft: grid?.getBoundingClientRect().left ?? null,
          mediumRailRight: mediumRail?.getBoundingClientRect().right ?? null,
          visibleFlexItems: visibleFlexItems.length,
          visibleFlexItemContract: visibleFlexItems.map((child) => ({
            display: child.display,
            generatesBox: child.generatesBox,
            isFeedMediumColumn: child.isFeedMediumColumn,
          })),
          childDiagnostics,
          regionNames: regions.map((region) => region.getAttribute("data-feed-medium-region")),
          streamLists: document.querySelectorAll("[data-feed-stream-list]").length,
          contextRegions: document.querySelectorAll('[data-feed-medium-region="context"]').length,
          desktopVideoSections: document.querySelectorAll("[data-feed-desktop-video-section]").length,
        };
      });

      const childDiagnostics = state.childDiagnostics
        .map(
          (child) =>
            `${child.tag}.${child.classes || "(sans classe)"} display=${child.display} ` +
            `visibility=${child.visibility} rect=${child.width}x${child.height} ` +
            `clientRects=${child.clientRects} hidden=${child.hidden} inert=${child.inert} ` +
            `ancestorsVisible=${child.ancestorsVisible} generatesBox=${child.generatesBox}`,
        )
        .join(" | ");

      expect(state.display).toBe("grid");
      expect(
        state.visibleFlexItems,
        `nombre de boites flex reelles incorrect : ${childDiagnostics}`,
      ).toBe(1);
      expect(
        state.visibleFlexItemContract,
        `la boite flex reelle n'est pas la colonne Feed : ${childDiagnostics}`,
      ).toEqual([
        {
          display: "grid",
          generatesBox: true,
          isFeedMediumColumn: true,
        },
      ]);
      expect(state.gridLeft, "bord gauche du Feed non mesurable").not.toBeNull();
      expect(state.mediumRailRight, "bord droit du rail medium non mesurable").not.toBeNull();
      expect(Math.abs(state.gridLeft! - state.mediumRailRight!)).toBeLessThanOrEqual(1);
      expect(state.regionNames).toEqual([...FEED_MEDIUM_REGIONS]);
      expect(state.streamLists).toBe(1);
      expect(state.contextRegions).toBe(0);
      expect(state.desktopVideoSections).toBe(0);
    });
  }

  test("1280x900 - le rail gauche desktop reste disponible", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 1280, height: 900 });
    const shell = authedPage.locator(".feed-app-shell-content");
    const leftRail = shell.locator(":scope > .web-feed-desktop-contents > aside");

    await expect(shell).toHaveCount(1);
    await expect(leftRail).toHaveCount(1);
    await expect(leftRail).toBeVisible();

    const desktopState = await shell.evaluate((shellElement) => {
      const rail = shellElement.querySelector(":scope > .web-feed-desktop-contents > aside");
      const feedColumn = shellElement.querySelector(":scope > .feed-medium-column");
      if (!(rail instanceof HTMLElement) || !(feedColumn instanceof HTMLElement)) return null;

      const railRect = rail.getBoundingClientRect();
      return {
        railHasPositiveRect: railRect.width > 0 && railRect.height > 0,
        railBeforeFeed: Boolean(
          rail.compareDocumentPosition(feedColumn) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        streamLists: shellElement.querySelectorAll("[data-feed-stream-list]").length,
        contextRails: shellElement.querySelectorAll(".web-context-rail-aside").length,
      };
    });

    expect(desktopState, "structure desktop Feed absente").not.toBeNull();
    expect(desktopState).toEqual({
      railHasPositiveRect: true,
      railBeforeFeed: true,
      streamLists: 1,
      contextRails: 0,
    });
  });
});
