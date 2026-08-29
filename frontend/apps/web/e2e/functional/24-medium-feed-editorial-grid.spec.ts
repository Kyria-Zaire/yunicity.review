import type { Page } from "@playwright/test";

import { FEED_MEDIUM_REGIONS } from "@/lib/layout/feed-medium-regions";
import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "1023x900", width: 1023, height: 900 },
] as const;

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("[data-feed-stream-list]")).toBeVisible();
}

test.describe("C3-FEED-R2B - colonne editoriale medium", () => {
  for (const viewport of MEDIUM) {
    test(`${viewport.label} - cinq regions et un flux unique`, async ({ authedPage }) => {
      await gotoFeed(authedPage, viewport);

      const state = await authedPage.evaluate(() => {
        const grid = document.querySelector(".feed-main-column");
        const shell = document.querySelector(".feed-app-shell-content");
        const mediumRail = document.querySelector("[data-citizen-medium-rail]");

        const describeChild = (child: Element) => {
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
            isFeedMainColumn: child.classList.contains("feed-main-column"),
          };
        };

        const flattenShellChildren = (parent: Element | null): Element[] => {
          if (!parent) return [];
          const flattened: Element[] = [];
          for (const child of parent.children) {
            if (getComputedStyle(child).display === "contents") {
              flattened.push(...child.children);
            } else {
              flattened.push(child);
            }
          }
          return flattened;
        };

        const childDiagnostics = flattenShellChildren(shell).map(describeChild);
        const visibleFlexItems = childDiagnostics.filter((child) => child.generatesBox);
        return {
          display: grid ? getComputedStyle(grid).display : null,
          gridLeft: grid?.getBoundingClientRect().left ?? null,
          columnPadLeft: (() => {
            const column = document.querySelector(".citizen-feed-shell .feed-main-column");
            return column ? parseFloat(getComputedStyle(column).paddingLeft) : 0;
          })(),
          mediumRailRight: mediumRail?.getBoundingClientRect().right ?? null,
          railToColumnGap:
            grid && mediumRail
              ? grid.getBoundingClientRect().left - mediumRail.getBoundingClientRect().right
              : null,
          firstRegionLeft: (() => {
            const region = document.querySelector("[data-feed-medium-region]");
            return region ? region.getBoundingClientRect().left : null;
          })(),
          visibleFlexItems: visibleFlexItems.length,
          visibleFlexItemContract: visibleFlexItems.map((child) => ({
            display: child.display,
            generatesBox: child.generatesBox,
            isFeedMainColumn: child.isFeedMainColumn,
          })),
          childDiagnostics,
          regionNames: [...document.querySelectorAll("[data-feed-medium-region]")].map((region) =>
            region.getAttribute("data-feed-medium-region"),
          ),
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
          isFeedMainColumn: true,
        },
      ]);
      expect(state.gridLeft, "bord gauche du Feed non mesurable").not.toBeNull();
      expect(state.mediumRailRight, "bord droit du rail medium non mesurable").not.toBeNull();
      expect(
        state.railToColumnGap,
        "écart rail → bord colonne non mesurable",
      ).not.toBeNull();
      expect(
        state.firstRegionLeft,
        "première région medium non mesurable",
      ).not.toBeNull();
      // Gouttière éditoriale : le contenu démarre après rail.right + padding interne.
      expect(
        Math.abs(state.firstRegionLeft! - (state.mediumRailRight! + state.columnPadLeft)),
        `gouttière contenu incorrecte (rail→colonne=${state.railToColumnGap}px, pad=${state.columnPadLeft}px)`,
      ).toBeLessThanOrEqual(1);
      expect(state.regionNames).toEqual([...FEED_MEDIUM_REGIONS]);
      expect(state.streamLists).toBe(1);
      expect(state.contextRegions).toBe(0);
      expect(state.desktopVideoSections).toBe(0);
    });
  }

  test("1280x900 - le layout desktop 3 colonnes reste disponible", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 1280, height: 900 });
    const layout = authedPage.locator(".feed-desktop-layout");

    await expect(layout).toHaveCount(1);
    await expect(layout.locator(".feed-desktop-left-rail")).toHaveCount(1);
    await expect(layout.locator(".feed-desktop-right-rail")).toHaveCount(1);

    const desktopState = await layout.evaluate((layoutElement) => {
      const leftRail = layoutElement.querySelector(":scope > .feed-desktop-left-rail");
      const center = layoutElement.querySelector(":scope > .feed-desktop-center");
      const rightRail = layoutElement.querySelector(":scope > .feed-desktop-right-rail");
      if (
        !(leftRail instanceof HTMLElement) ||
        !(center instanceof HTMLElement) ||
        !(rightRail instanceof HTMLElement)
      ) {
        return null;
      }

      const leftRect = leftRail.getBoundingClientRect();
      const rightRect = rightRail.getBoundingClientRect();
      return {
        leftRailVisible: leftRect.width > 0 && leftRect.height > 0,
        rightRailVisible: rightRect.width > 0 && rightRect.height > 0,
        leftBeforeCenter: Boolean(
          leftRail.compareDocumentPosition(center) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        centerBeforeRight: Boolean(
          center.compareDocumentPosition(rightRail) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        streamLists: layoutElement.querySelectorAll("[data-feed-stream-list]").length,
        contextRails: document.querySelectorAll(".web-context-rail-aside").length,
      };
    });

    expect(desktopState, "structure desktop Feed absente").not.toBeNull();
    expect(desktopState).toEqual({
      leftRailVisible: true,
      rightRailVisible: true,
      leftBeforeCenter: true,
      centerBeforeRight: true,
      streamLists: 1,
      contextRails: 0,
    });
  });
});
