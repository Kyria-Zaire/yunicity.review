import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import { waitForCitizenRouteReady } from "../landmark-assertions";
import {
  DESKTOP_HEADER_CONTROL_IDS,
  DESKTOP_HEADER_MIN_GAP_PX,
  type DesktopHeaderControlId,
  type HeaderControlRect,
} from "../../lib/layout/desktop-header-geometry";

const EXPLORER_LABEL = "Explorer Reims";
const MENU_LABEL = "Menu Yunicity";
const CREATE_LABEL = "Créer";
const DESKTOP_HEADER_MIN_WIDTH = 1280;

const DESKTOP_WIDTHS = [1280, 1366, 1440, 1536] as const;
const TRANSITION_WIDTHS = [
  { from: 1279, to: 1280 },
  { from: 1535, to: 1536 },
  { from: 1536, to: 1280 },
] as const;

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

async function collectHeaderRects(page: Page): Promise<HeaderControlRect[]> {
  return page.evaluate((controlIds) => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        style.opacity !== "0"
      );
    };

    const header = document.querySelector(".citizen-top-nav");
    if (!header || !isVisible(header)) {
      return [];
    }

    return (controlIds as readonly DesktopHeaderControlId[])
      .map((id) => {
        const element = header.querySelector(`[data-yunicity-header-control="${id}"]`);
        if (!element || !isVisible(element)) return null;
        const rect = element.getBoundingClientRect();
        return {
          id,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((value): value is HeaderControlRect => value !== null);
  }, DESKTOP_HEADER_CONTROL_IDS);
}

function rectsOverlap(
  a: Pick<HeaderControlRect, "left" | "right" | "top" | "bottom">,
  b: Pick<HeaderControlRect, "left" | "right" | "top" | "bottom">,
  minGap = DESKTOP_HEADER_MIN_GAP_PX,
): boolean {
  return !(
    a.right + minGap <= b.left ||
    b.right + minGap <= a.left ||
    a.bottom + minGap <= b.top ||
    b.bottom + minGap <= a.top
  );
}

function findOverlaps(rects: HeaderControlRect[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      if (a && b && rectsOverlap(a, b)) {
        pairs.push([a.id, b.id]);
      }
    }
  }
  return pairs;
}

async function waitForHeaderControls(page: Page): Promise<void> {
  for (const id of DESKTOP_HEADER_CONTROL_IDS) {
    await expect(
      page.locator(`.citizen-top-nav [data-yunicity-header-control="${id}"]`),
      `contrôle ${id} absent`,
    ).toBeVisible({ timeout: COLD_START_TIMEOUT });
  }
}

async function assertHeaderGeometry(page: Page, viewportWidth: number): Promise<HeaderControlRect[]> {
  await waitForHeaderControls(page);
  const rects = await collectHeaderRects(page);
  const foundIds = rects.map((rect) => rect.id);
  const missingIds = DESKTOP_HEADER_CONTROL_IDS.filter((id) => !foundIds.includes(id));
  expect(
    missingIds,
    `contrôles header incomplets à ${viewportWidth}px (manquants: ${missingIds.join(", ") || "aucun"})`,
  ).toEqual([]);

  const overlaps = findOverlaps(rects);
  expect(overlaps, `collisions à ${viewportWidth}px`).toEqual([]);

  for (const rect of rects) {
    expect(rect.left, `${rect.id} hors viewport (gauche)`).toBeGreaterThanOrEqual(-1);
    expect(rect.right, `${rect.id} hors viewport (droite)`).toBeLessThanOrEqual(viewportWidth + 1);
  }

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `overflow horizontal à ${viewportWidth}px`).toBeLessThanOrEqual(1);

  for (const id of ["notifications", "account", "explorer", "create", "menu"] as const) {
    const control = rects.find((rect) => rect.id === id);
    expect(control?.width, `${id} trop étroit`).toBeGreaterThanOrEqual(44);
    expect(control?.height, `${id} trop bas`).toBeGreaterThanOrEqual(44);
  }

  for (const control of rects) {
    const centerX = control.left + control.width / 2;
    const centerY = control.top + control.height / 2;
    const hit = await page.evaluate(
      ({ x, y, id }) => {
        const header = document.querySelector(".citizen-top-nav");
        const element = header?.querySelector(`[data-yunicity-header-control="${id}"]`);
        const top = document.elementFromPoint(x, y);
        return Boolean(element && top && (element === top || element.contains(top)));
      },
      { x: centerX, y: centerY, id: control.id },
    );
    expect(hit, `hit-test ${control.id} à ${viewportWidth}px`).toBe(true);
  }

  return rects;
}

async function gotoFeedDesktop(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await waitForCitizenRouteReady(
    page,
    "/feed",
    /\/feed(?:\?|$)/,
    page.getByRole("region", { name: "Publier sur le fil local" }).filter({ visible: true }),
  );
  await waitSessionReady(page);
}

async function expectTopNavVisibility(page: Page, width: number): Promise<void> {
  const topNav = page.locator(".citizen-top-nav");
  if (width >= DESKTOP_HEADER_MIN_WIDTH) {
    await expect(topNav).toBeVisible({ timeout: COLD_START_TIMEOUT });
  } else {
    await expect(topNav).toBeHidden({ timeout: COLD_START_TIMEOUT });
  }
}

test.describe("Desktop header geometry — anti-collision R6", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  for (const width of DESKTOP_WIDTHS) {
    test(`connecté ${width}px — aucune collision header`, async ({ citizenAPage: page }) => {
      await gotoFeedDesktop(page, width);
      await expectTopNavVisibility(page, width);
      const rects = await assertHeaderGeometry(page, width);

      const destinationLabels = ["Fil local", "Vidéos", "Carte", "Sortir"];
      for (const label of destinationLabels) {
        await expect(
          page.locator('.citizen-top-nav [data-yunicity-header-control^="destination-"]', {
            hasText: label,
          }),
        ).toBeVisible();
      }

      await expect(page.getByRole("button", { name: EXPLORER_LABEL }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: new RegExp(CREATE_LABEL, "i") }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: MENU_LABEL }).first()).toBeVisible();

      const notifications = rects.find((rect) => rect.id === "notifications");
      expect(notifications).toBeTruthy();
      if (width < 1536) {
        await expect(
          page.locator(
            '.citizen-top-nav [data-yunicity-header-control="notifications"] span[data-yunicity-header-label="notifications"]',
          ),
        ).toBeHidden();
      } else {
        await expect(
          page.locator(
            '.citizen-top-nav [data-yunicity-header-control="notifications"] span[data-yunicity-header-label="notifications"]',
          ),
        ).toBeVisible();
      }

      const explorerKbd = page.locator(
        '.citizen-top-nav [data-yunicity-header-control="explorer"] kbd',
      );
      if (width < 1536) {
        await expect(explorerKbd).toBeHidden();
      } else {
        await expect(explorerKbd).toBeVisible();
      }
    });
  }

  test("1366 visiteur — aucune collision header", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.setViewportSize({ width: 1366, height: 900 });
      await gotoCold(page, "/neighborhoods", /\/neighborhoods(?:\?|$)/);
      await waitSessionReady(page);
      await expectTopNavVisibility(page, 1366);
      await assertHeaderGeometry(page, 1366);
    } finally {
      await context.close();
    }
  });

  test("raccourci Ctrl+K ouvre Explorer même sans aide visuelle (1366)", async ({
    citizenAPage: page,
  }) => {
    await gotoFeedDesktop(page, 1366);
    await expectTopNavVisibility(page, 1366);
    await expect(
      page.locator('.citizen-top-nav [data-yunicity-header-control="explorer"] kbd'),
    ).toBeHidden();
    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });
  });

  for (const transition of TRANSITION_WIDTHS) {
    test(`transition ${transition.from} → ${transition.to}px`, async ({ citizenAPage: page }) => {
      await gotoFeedDesktop(page, transition.from);
      await expectTopNavVisibility(page, transition.from);
      if (transition.from >= DESKTOP_HEADER_MIN_WIDTH) {
        await assertHeaderGeometry(page, transition.from);
      }

      await page.setViewportSize({ width: transition.to, height: 900 });
      await waitSessionReady(page);
      await expectTopNavVisibility(page, transition.to);

      if (transition.to >= DESKTOP_HEADER_MIN_WIDTH) {
        await assertHeaderGeometry(page, transition.to);
      }

      const mainNavCount = await page.evaluate(() => {
        const isVisible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== "none";
        };
        return Array.from(document.querySelectorAll('nav[aria-label="Navigation principale"]')).filter(
          isVisible,
        ).length;
      });
      expect(mainNavCount).toBe(1);
    });
  }

  test("Menu Popover 1366 — ancré sans backdrop ni scroll lock", async ({ citizenAPage: page }) => {
    await gotoFeedDesktop(page, 1366);
    await expectTopNavVisibility(page, 1366);
    await assertHeaderGeometry(page, 1366);

    const menuTrigger = page.getByRole("button", { name: MENU_LABEL }).first();
    const triggerBox = await menuTrigger.boundingBox();
    expect(triggerBox).toBeTruthy();

    await menuTrigger.click();
    const popover = page.locator("[data-yunicity-popover-panel]").first();
    await expect(popover).toBeVisible({ timeout: COLD_START_TIMEOUT });

    const popoverBox = await popover.boundingBox();
    expect(popoverBox).toBeTruthy();
    expect(popoverBox!.x + popoverBox!.width).toBeLessThanOrEqual(1366 + 1);
    expect(popoverBox!.y).toBeGreaterThanOrEqual((triggerBox?.y ?? 0) + (triggerBox?.height ?? 0) - 2);

    const overlayState = await page.evaluate(() => ({
      backdrops: document.querySelectorAll("[data-yunicity-overlay-backdrop]").length,
      bodyOverflow: document.body.style.overflow,
      inertRoots: document.querySelectorAll("[inert]").length,
    }));
    expect(overlayState.backdrops).toBe(0);
    expect(overlayState.bodyOverflow).not.toBe("hidden");
    expect(overlayState.inertRoots).toBe(0);

    await assertHeaderGeometry(page, 1366);
  });
});
