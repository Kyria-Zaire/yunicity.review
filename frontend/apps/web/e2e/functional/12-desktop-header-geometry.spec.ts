import type { Page } from "@playwright/test";

import { expect, testCitizen as test } from "../fixtures";
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

  /**
   * C3-D1.1-R7.1 — non-regression du decouplage de CitizenTopNav.
   *
   * D1.1 plafonne le corps Feed a 1072px. Tant que la top nav vivait dans la
   * colonne principale, elle heritait de ce plafond : des 1536px la variante
   * Tailwind `2xl` ajoute le badge Ctrl K et le libelle Notifications, la piste
   * centrale `minmax(0,1fr)` etait ecrasee et `overflow:hidden` ROGNAIT les
   * destinations (mesure R6A : chevauchement visible a 1536 et 1920).
   *
   * Le rognage est invisible pour les assertions de collision existantes : un
   * enfant tronque conserve son rect. Ce test mesure donc explicitement le
   * debordement interne de la nav, le retour a la ligne et le confinement dans
   * le wrapper — et couvre 1920px, absent des paliers d'acceptation.
   */
  for (const width of [1536, 1920] as const) {
    test(`top nav decouplee du corps Feed — ${width}px sans rognage`, async ({
      citizenAPage: page,
    }) => {
      await gotoFeedDesktop(page, width);
      await expectTopNavVisibility(page, width);
      await assertHeaderGeometry(page, width);

      await expect(page.locator(".citizen-top-nav")).toHaveCount(1);
      await expect(page.locator(".citizen-top-nav-inner")).toHaveCount(1);

      const nav = await page.evaluate((controlIds) => {
        const rectOf = (node: Element | null) => {
          if (!node) return null;
          const r = node.getBoundingClientRect();
          return {
            left: Math.round(r.left),
            right: Math.round(r.right),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            width: Math.round(r.width),
            height: Math.round(r.height),
          };
        };
        const header = document.querySelector(".citizen-top-nav");
        const inner = document.querySelector(".citizen-top-nav-inner");
        const primary = header?.querySelector('nav[aria-label="Navigation principale"]') ?? null;
        const explorer = header?.querySelector('[data-yunicity-header-control="explorer"]') ?? null;

        return {
          inner: rectOf(inner),
          primaryScrollWidth: primary ? (primary as HTMLElement).scrollWidth : -1,
          primaryClientWidth: primary ? (primary as HTMLElement).clientWidth : -1,
          innerScrollWidth: inner ? (inner as HTMLElement).scrollWidth : -1,
          innerClientWidth: inner ? (inner as HTMLElement).clientWidth : -1,
          controls: (controlIds as readonly string[]).map((id) => ({
            id,
            rect: rectOf(header?.querySelector(`[data-yunicity-header-control="${id}"]`) ?? null),
          })),
          explorerRect: rectOf(explorer),
          ctrlKRect: rectOf(explorer?.querySelector("kbd") ?? null),
          groupWrapper: rectOf(document.querySelector(".citizen-feed-shell .feed-app-shell-content")),
        };
      }, DESKTOP_HEADER_CONTROL_IDS);

      const ctx = `${width}px ${JSON.stringify(nav)}`;

      // La nav ne doit rien rogner horizontalement.
      expect(nav.primaryScrollWidth, `navigation principale rognee — ${ctx}`).toBeLessThanOrEqual(
        nav.primaryClientWidth,
      );
      expect(nav.innerScrollWidth, `wrapper nav rogne — ${ctx}`).toBeLessThanOrEqual(
        nav.innerClientWidth,
      );

      // Chaque controle est entierement contenu dans le wrapper nav.
      for (const control of nav.controls) {
        expect(control.rect, `controle ${control.id} absent — ${ctx}`).not.toBeNull();
        expect(control.rect!.left, `${control.id} deborde a gauche du wrapper — ${ctx}`).toBeGreaterThanOrEqual(
          nav.inner!.left,
        );
        expect(control.rect!.right, `${control.id} deborde a droite du wrapper — ${ctx}`).toBeLessThanOrEqual(
          nav.inner!.right,
        );
      }

      // Aucun retour a la ligne : les quatre destinations partagent une ligne.
      const destinationTops = new Set(
        nav.controls
          .filter((control) => control.id.startsWith("destination-"))
          .map((control) => control.rect!.top),
      );
      expect(destinationTops.size, `retour a la ligne dans la navigation — ${ctx}`).toBe(1);

      // Le badge Ctrl K (visible des 1536) reste contenu dans Explorer.
      expect(nav.ctrlKRect, `badge Ctrl K absent — ${ctx}`).not.toBeNull();
      expect(nav.ctrlKRect!.left, `Ctrl K deborde — ${ctx}`).toBeGreaterThanOrEqual(nav.explorerRect!.left);
      expect(nav.ctrlKRect!.right, `Ctrl K deborde — ${ctx}`).toBeLessThanOrEqual(nav.explorerRect!.right);

      // La nav dispose d'une largeur propre, superieure au corps Feed.
      expect(nav.inner!.width, `nav plafonnee au corps Feed — ${ctx}`).toBeGreaterThan(
        nav.groupWrapper!.width,
      );

      // Fumee corps Feed : le decouplage n'a pas deplace le contenu.
      await expect(page.locator(".feed-desktop-layout")).toHaveCount(1);
      await expect(page.locator(".feed-desktop-left-rail")).toHaveCount(1);
      await expect(page.locator(".feed-desktop-right-rail")).toHaveCount(1);
      await expect(page.locator("[data-feed-stream-list]")).toHaveCount(1);

      // Le rail contextuel HISTORIQUE reste interdit.
      await expect(page.locator(".web-context-rail-aside")).toHaveCount(0);
      const rightRail = page.locator(".feed-desktop-right-rail");
      await expect(rightRail, "rail droit desktop unique").toHaveCount(1);
      await expect(rightRail).toBeVisible();
      await expect(rightRail).toHaveAttribute("aria-label", "Contexte local");

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow horizontal — ${ctx}`).toBeLessThanOrEqual(1);
    });
  }

  /**
   * C3-D1.2-R2E — le badge de notifications est ancre a la cloche.
   *
   * Positionne en absolu sur le controle entier, il suivait son bord droit :
   * des `2xl` (1536px) le libellé « Notifications » devient `inline`, elargit le
   * controle, et le badge se retrouvait au-dessus de la fin du libellé.
   * Les assertions de collision existantes ne le voyaient pas : elles mesurent
   * les controles `data-yunicity-header-control`, jamais un enfant absolu.
   */
  for (const width of [1280, 1440, 1536, 1920] as const) {
    test(`badge notifications ancre a la cloche — ${width}px`, async ({ citizenAPage: page }) => {
      await gotoFeedDesktop(page, width);
      await expectTopNavVisibility(page, width);
      await assertHeaderGeometry(page, width);

      const measured = await page.evaluate(() => {
        const rectOf = (node: Element | null) => {
          if (!node) return null;
          const r = node.getBoundingClientRect();
          return {
            left: Math.round(r.left),
            right: Math.round(r.right),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            width: Math.round(r.width),
            height: Math.round(r.height),
          };
        };
        const header = document.querySelector(".citizen-top-nav");
        const control = header?.querySelector('[data-yunicity-header-control="notifications"]') ?? null;
        const label = control?.querySelector("[data-notification-label]") ?? null;
        const labelVisible = label ? getComputedStyle(label).display !== "none" : false;
        const badge = control?.querySelector("[data-notification-badge]") ?? null;

        return {
          control: rectOf(control),
          iconWrap: rectOf(control?.querySelector("[data-notification-icon-wrap]") ?? null),
          badge: rectOf(badge),
          badgeText: (badge?.textContent ?? "").trim(),
          label: rectOf(label),
          labelVisible,
          avatar: rectOf(header?.querySelector('[data-yunicity-header-control="account"]') ?? null),
          badgeCount: document.querySelectorAll("[data-notification-badge]").length,
          iconWrapCount: document.querySelectorAll("[data-notification-icon-wrap]").length,
        };
      });

      const ctx = `${width}px ${JSON.stringify(measured)}`;

      expect(measured.control, `controle notifications absent — ${ctx}`).not.toBeNull();
      expect(measured.iconWrapCount, `un seul wrapper cloche — ${ctx}`).toBe(1);
      expect(measured.iconWrap, `wrapper cloche absent — ${ctx}`).not.toBeNull();

      // Le libellé suit le comportement existant : masque < 1536, visible >= 1536.
      expect(measured.labelVisible, `visibilite du libellé — ${ctx}`).toBe(width >= 1536);

      if (measured.badgeCount === 0) {
        // Compteur nul : rien a prouver, le badge n'existe pas.
        return;
      }

      const badge = measured.badge!;
      const iconWrap = measured.iconWrap!;
      const control = measured.control!;

      expect(badge.width, `badge sans surface — ${ctx}`).toBeGreaterThan(0);
      expect(badge.height, `badge sans hauteur — ${ctx}`).toBeGreaterThan(0);
      expect(badge.width, `pastille trop large — ${ctx}`).toBeLessThanOrEqual(10);
      expect(badge.height, `pastille trop haute — ${ctx}`).toBeLessThanOrEqual(10);

      // Contenu par le controle : jamais rogne hors de sa boite.
      expect(badge.left, `badge deborde a gauche du controle — ${ctx}`).toBeGreaterThanOrEqual(control.left);
      expect(badge.right, `badge deborde a droite du controle — ${ctx}`).toBeLessThanOrEqual(control.right);
      expect(badge.top, `badge deborde en haut du controle — ${ctx}`).toBeGreaterThanOrEqual(control.top);
      expect(badge.bottom, `badge deborde en bas du controle — ${ctx}`).toBeLessThanOrEqual(control.bottom);

      // Ancrage geometrique a la cloche : coin haut-droit du wrapper.
      expect(
        Math.abs(badge.right - iconWrap.right),
        `badge non ancre horizontalement a la cloche — ${ctx}`,
      ).toBeLessThanOrEqual(10);
      expect(
        Math.abs(badge.top - iconWrap.top),
        `badge non ancre verticalement a la cloche — ${ctx}`,
      ).toBeLessThanOrEqual(10);

      // Aucun recouvrement du libellé, avec un ecart visuel positif.
      if (measured.labelVisible) {
        const label = measured.label!;
        const horizontalOverlap = Math.min(badge.right, label.right) - Math.max(badge.left, label.left);
        const verticalOverlap = Math.min(badge.bottom, label.bottom) - Math.max(badge.top, label.top);
        const intersects = horizontalOverlap > 0 && verticalOverlap > 0;
        expect(intersects, `badge recouvre le libellé — ${ctx}`).toBe(false);
        expect(label.left - badge.right, `ecart badge/libellé — ${ctx}`).toBeGreaterThanOrEqual(4);
      }

      // Aucun recouvrement de l'avatar.
      if (measured.avatar) {
        const avatar = measured.avatar;
        const h = Math.min(badge.right, avatar.right) - Math.max(badge.left, avatar.left);
        const v = Math.min(badge.bottom, avatar.bottom) - Math.max(badge.top, avatar.top);
        expect(h > 0 && v > 0, `badge recouvre l'avatar — ${ctx}`).toBe(false);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow horizontal — ${ctx}`).toBeLessThanOrEqual(1);
    });
  }
});
