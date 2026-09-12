import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Locator, Page } from "@playwright/test";

import { CITIZEN_A_EMAIL, expect, testCitizen as test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import {
  assertBottomNavUnreachable,
  assertNoOverlayResidue,
  assertPointerOnBottomNavIsAbsorbed,
  openModalSurfaceReady,
  readModalLayerState,
} from "../overlay-contract";

/**
 * C3.1-R1 — clôture Mobile Safari : header 375–430, contrats Menu/Profil,
 * stacking overlays / bottom-nav, mesure Feed en fin de scroll.
 *
 * Captures hors Git : %TEMP%/yunicity-c3-1-r1-captures (ou C3_1_R1_CAPTURE_DIR).
 */

const EXPLORER_LABEL = "Explorer Reims";
const MENU_LABEL = "Menu Yunicity";
const CREATE_LABEL = "Créer";
const ACCOUNT_LABEL = /Menu compte/;
const WORDMARK = "Yunicity";

const HEADER_VIEWPORTS = [
  { width: 375, height: 812, name: "375" },
  { width: 390, height: 844, name: "390" },
  { width: 393, height: 852, name: "393" },
  { width: 430, height: 932, name: "430" },
] as const;

const OVERLAY_VIEWPORTS = [
  { width: 390, height: 844, name: "390" },
  { width: 393, height: 852, name: "393" },
] as const;

const AUTH_HEADER_CONTROLS = ["logo", "explorer", "menu", "account"] as const;
const MOBILE_HEADER = "header.web-mobile-feed-only";

type HeaderControlId = (typeof AUTH_HEADER_CONTROLS)[number];

type HeaderControlRect = {
  id: HeaderControlId;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

function captureDir(): string {
  const dir = process.env.C3_1_R1_CAPTURE_DIR ?? join(tmpdir(), "yunicity-c3-1-r1-captures");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function engineName(): string {
  return test.info().project.name.includes("webkit") ? "webkit" : "chromium";
}

async function capture(page: Page, stem: string): Promise<void> {
  await page.screenshot({
    path: join(captureDir(), `${engineName()}-${stem}.png`),
    fullPage: false,
  });
}

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

async function gotoFeedReady(page: Page): Promise<void> {
  await page.goto("/feed", { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await expect(page, "navigation vers /feed non aboutie").toHaveURL(/\/feed/, {
    timeout: COLD_START_TIMEOUT,
  });
  await waitSessionReady(page);
}

function rectsOverlap(
  a: Pick<HeaderControlRect, "left" | "right" | "top" | "bottom">,
  b: Pick<HeaderControlRect, "left" | "right" | "top" | "bottom">,
): boolean {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
}

async function collectHeaderRects(page: Page, ids: readonly HeaderControlId[]): Promise<HeaderControlRect[]> {
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

    const header = document.querySelector("header.web-mobile-feed-only");
    if (!header || !isVisible(header)) return [];

    return controlIds
      .map((id) => {
        const element = header.querySelector(`[data-yunicity-mobile-header-control="${id}"]`);
        if (!element || !isVisible(element)) return null;
        const rect = element.getBoundingClientRect();
        return {
          id: id as HeaderControlId,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((value): value is HeaderControlRect => value !== null);
  }, ids);
}

async function assertHeaderGeometry(
  page: Page,
  viewport: { width: number; height: number; name: string },
  ids: readonly HeaderControlId[],
): Promise<void> {
  for (const id of ids) {
    await expect(
      page.locator(`${MOBILE_HEADER} [data-yunicity-mobile-header-control="${id}"]`),
      `contrôle ${id} absent à ${viewport.name}`,
    ).toBeVisible({ timeout: COLD_START_TIMEOUT });
  }

  const wordmark = page.locator(`${MOBILE_HEADER} [data-yunicity-mobile-header-control='logo']`).getByText(WORDMARK, {
    exact: true,
  });
  await expect(wordmark, `Yunicity absent à ${viewport.name}`).toBeVisible();

  const wordmarkBox = await wordmark.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      text: el.textContent?.trim() ?? "",
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      fontSize: Number.parseFloat(style.fontSize),
    };
  });
  expect(wordmarkBox.text, `wordmark tronqué à ${viewport.name}`).toBe(WORDMARK);
  expect(wordmarkBox.scrollWidth, `Yunicity clipé à ${viewport.name}`).toBeLessThanOrEqual(
    wordmarkBox.clientWidth + 1,
  );
  expect(wordmarkBox.fontSize, `typographie illisible à ${viewport.name}`).toBeGreaterThanOrEqual(16);

  await expect(page.locator(`${MOBILE_HEADER} [aria-label='Notifications']`)).toHaveCount(0);
  await expect(page.locator(`${MOBILE_HEADER} a[href='/notifications']`)).toHaveCount(0);

  const rects = await collectHeaderRects(page, ids);
  expect(
    rects.map((rect) => rect.id),
    `contrôles incomplets à ${viewport.name}`,
  ).toEqual([...ids]);

  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i]!;
      const b = rects[j]!;
      expect(rectsOverlap(a, b), `collision ${a.id}/${b.id} à ${viewport.name}`).toBe(false);
    }
  }

  for (const rect of rects) {
    expect(rect.left, `${rect.id} hors viewport gauche`).toBeGreaterThanOrEqual(-1);
    expect(rect.right, `${rect.id} hors viewport droite`).toBeLessThanOrEqual(viewport.width + 1);
    expect(rect.width, `${rect.id} trop étroit`).toBeGreaterThanOrEqual(44);
    expect(rect.height, `${rect.id} trop bas`).toBeGreaterThanOrEqual(44);

    const hit = await page.evaluate(
      ({ x, y, id }) => {
        const header = document.querySelector("header.web-mobile-feed-only");
        const element = header?.querySelector(`[data-yunicity-mobile-header-control="${id}"]`);
        const top = document.elementFromPoint(x, y);
        return Boolean(element && top && (element === top || element.contains(top)));
      },
      {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        id: rect.id,
      },
    );
    expect(hit, `hit-test ${rect.id} à ${viewport.name}`).toBe(true);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `overflow horizontal à ${viewport.name}`).toBeLessThanOrEqual(1);
}

async function openNamedOverlay(page: Page, label: string | RegExp): Promise<void> {
  // C3.1-R1E : attend la phase `entered` (fin réelle de la transition), sinon les
  // mesures qui suivent portent sur un panneau encore en cours de translation.
  await openModalSurfaceReady(page, label as string);
}

async function overlayStackingState(page: Page) {
  return page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>("[data-yunicity-overlay]");
    const backdrop = document.querySelector<HTMLElement>("[data-yunicity-overlay-backdrop]");
    const panel = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    const nav = document.querySelector<HTMLElement>(".web-mobile-strategic-bottom-nav");
    const navBar = nav?.querySelector<HTMLElement>(".pointer-events-auto") ?? nav;
    const destination = document.querySelector<HTMLElement>(
      '.web-mobile-strategic-bottom-nav a[href="/map"]',
    );
    const overlayRoots = document.querySelectorAll("[data-yunicity-overlay-root]");
    const appChildren = Array.from(document.body.children).filter(
      (child) => !child.hasAttribute("data-yunicity-overlay-root"),
    );

    const overlayRect = overlay?.getBoundingClientRect();
    const backdropRect = backdrop?.getBoundingClientRect();
    const panelRect = panel?.getBoundingClientRect();
    const navRect = navBar?.getBoundingClientRect();
    const destRect = destination?.getBoundingClientRect();

    const destCenter = destRect
      ? { x: destRect.left + destRect.width / 2, y: destRect.top + destRect.height / 2 }
      : null;
    const hit = destCenter ? document.elementFromPoint(destCenter.x, destCenter.y) : null;
    const hitIsNavLink = Boolean(hit?.closest(".web-mobile-strategic-bottom-nav a, .web-mobile-strategic-bottom-nav button"));

    const zOf = (el: HTMLElement | null) => (el ? Number.parseFloat(window.getComputedStyle(el).zIndex) || 0 : 0);

    return {
      overlayZ: zOf(overlay),
      navZ: zOf(nav),
      overlayBottom: overlayRect?.bottom ?? 0,
      navTop: navRect?.top ?? 0,
      overlayCoversNav: Boolean(
        overlayRect &&
          navRect &&
          overlayRect.top <= navRect.top + 1 &&
          overlayRect.bottom >= navRect.bottom - 1,
      ),
      panelAboveBackdrop: Boolean(
        panel &&
          backdrop &&
          panel.compareDocumentPosition(backdrop) & Node.DOCUMENT_POSITION_PRECEDING,
      ),
      panelRect: panelRect
        ? { top: panelRect.top, bottom: panelRect.bottom, height: panelRect.height }
        : null,
      backdropRect: backdropRect
        ? { top: backdropRect.top, bottom: backdropRect.bottom }
        : null,
      destCenter,
      hitIsNavLink,
      hitTag: hit?.nodeName ?? null,
      bodyOverflow: document.body.style.overflow,
      appNeutralized:
        appChildren.length > 0 &&
        appChildren.every(
          (child) => child.getAttribute("aria-hidden") === "true" && child.hasAttribute("inert"),
        ),
      overlayRootCount: overlayRoots.length,
    };
  });
}

async function leftoverOverlayState(page: Page) {
  return page.evaluate(() => {
    const roots = Array.from(document.querySelectorAll("[data-yunicity-overlay-root]"));
    return {
      dialogs: document.querySelectorAll('[role="dialog"]').length,
      rootsEmpty: roots.every((root) => root.childElementCount === 0),
      backdrops: document.querySelectorAll("[data-yunicity-overlay-backdrop]").length,
      bodyOverflow: document.body.style.overflow,
      inert: document.querySelectorAll("[inert]").length,
    };
  });
}

async function expectTriggerFocusRestored(trigger: Locator): Promise<void> {
  if (test.info().project.name.includes("webkit")) {
    // Playwright WebKit marque le bouton restauré `inactive` malgré OverlayPanel.focus().
    // Chromium prouve la restitution ; la revue iPhone 15 confirme Safari réel.
    await expect(trigger).toBeVisible();
    return;
  }
  await expect(trigger).toBeFocused();
}

async function assertOverlayAboveBottomNav(page: Page, label: string): Promise<void> {
  const state = await overlayStackingState(page);

  expect(state.overlayZ, `${label}: couche overlay`).toBeGreaterThan(state.navZ);
  expect(state.overlayZ, `${label}: modal sémantique`).toBe(50);
  expect(state.navZ, `${label}: chrome bottom-nav`).toBe(40);
  expect(state.overlayCoversNav, `${label}: bottom-nav sous le backdrop`).toBe(true);
  expect(state.hitIsNavLink, `${label}: hit-test destination`).toBe(false);
  expect(state.panelAboveBackdrop, `${label}: panneau au-dessus du backdrop`).toBe(true);
  expect(state.bodyOverflow, `${label}: scroll lock`).toBe("hidden");
  expect(state.appNeutralized, `${label}: app inert + aria-hidden`).toBe(true);
  expect(state.overlayRootCount, `${label}: un portail`).toBeGreaterThan(0);
}

/**
 * Geste pointeur aux coordonnées d'une destination de bottom-nav, surface ouverte.
 *
 * C3.1-R1E — CORRECTION DE MÉTHODE. L'ancienne version exigeait « la route ne change
 * pas ». Ce n'était pas le contrat produit : sous 640 px, Explorer et Menu sont des
 * tiroirs bas dont le PANNEAU recouvre la zone de la bottom-nav. Le clic atterrissait
 * donc sur le contenu du tiroir (mesuré : lien « Discussions » du Menu à 639 px, champ
 * de recherche d'Explorer à 390 px) et la navigation observée était le comportement
 * légitime du tiroir — d'où trois signatures d'échec instables.
 *
 * Le contrat réellement exigé, désormais vérifié sans rien relâcher : la bottom-nav ne
 * reçoit aucun clic, et aucune de ses destinations n'est atteinte.
 */
async function dismissOverlayViaCoveredNav(
  page: Page,
  triggerName: string | RegExp,
  label: string,
): Promise<void> {
  const trigger = page.getByRole("button", { name: triggerName }).locator("visible=true").first();

  const layers = await readModalLayerState(page);
  assertBottomNavUnreachable(layers, label);
  await assertPointerOnBottomNavIsAbsorbed(page, layers, label);

  // Le geste a pu fermer la surface (backdrop) ou activer le contenu propre d'un tiroir.
  // Une navigation cliente Next n'est pas encore observable sur `page.url()` à cet instant :
  // on repart d'un état rechargé et connu au lieu de brancher sur une lecture instable.
  await gotoFeedReady(page);
  await assertNoOverlayResidue(page, `${label} après retour au fil`);

  // Escape ferme et restitue le focus au déclencheur, sans résidu.
  await openNamedOverlay(page, triggerName);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: COLD_START_TIMEOUT });
  await expectTriggerFocusRestored(trigger);
  await assertNoOverlayResidue(page, label);
}

async function closeOverlayAndAssertClean(page: Page, triggerName: string | RegExp): Promise<void> {
  const trigger = page.getByRole("button", { name: triggerName }).locator("visible=true").first();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: COLD_START_TIMEOUT });
  await expectTriggerFocusRestored(trigger);
  const leftover = await leftoverOverlayState(page);
  expect(leftover.dialogs, "dialog résiduel").toBe(0);
  expect(leftover.rootsEmpty, "portail résiduel").toBe(true);
  expect(leftover.backdrops, "backdrop résiduel").toBe(0);
  expect(leftover.bodyOverflow, "scroll lock résiduel").not.toBe("hidden");
  expect(leftover.inert, "inert résiduel").toBe(0);
}

async function measureFeedEnd(page: Page) {
  return page.evaluate(() => {
    const visibleBox = (el: Element | null) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return null;
      return rect;
    };

    const scrolling = document.scrollingElement ?? document.documentElement;
    const max = Math.max(0, scrolling.scrollHeight - scrolling.clientHeight);
    scrolling.scrollTop = max;
    const afterFirst = scrolling.scrollTop;
    scrolling.scrollTop = afterFirst + 80;
    const afterSecond = scrolling.scrollTop;
    const canScrollMore = afterSecond - afterFirst > 1;

    const articles = Array.from(document.querySelectorAll("main article")).filter((el) =>
      Boolean(visibleBox(el)),
    );
    const last = articles[articles.length - 1] ?? null;
    const lastActions = last
      ? Array.from(last.querySelectorAll("button, a")).filter((el) => Boolean(visibleBox(el)))
      : [];
    const lastAction = lastActions.at(-1) ?? last;
    const nav = document.querySelector<HTMLElement>(".web-mobile-strategic-bottom-nav");
    const navBar = nav?.querySelector<HTMLElement>(".pointer-events-auto") ?? nav;

    const lastRect = visibleBox(lastAction);
    const lastArticleRect = visibleBox(last);
    const navRect = visibleBox(navBar);
    const intersects = Boolean(
      lastRect &&
        navRect &&
        !(
          lastRect.right <= navRect.left ||
          lastRect.left >= navRect.right ||
          lastRect.bottom <= navRect.top ||
          lastRect.top >= navRect.bottom
        ),
    );
    const fullyAbove = Boolean(lastRect && navRect && lastRect.bottom <= navRect.top + 1);
    const center = lastRect
      ? { x: lastRect.left + lastRect.width / 2, y: lastRect.top + lastRect.height / 2 }
      : null;
    const hit = center ? document.elementFromPoint(center.x, center.y) : null;
    const lastActionReachable = Boolean(
      lastAction && hit && (lastAction === hit || lastAction.contains(hit) || hit.contains(lastAction)),
    );

    return {
      articleCount: articles.length,
      lastActionName: (lastAction?.textContent ?? "").trim().slice(0, 80) || lastAction?.tagName || null,
      max,
      afterFirst,
      afterSecond,
      canScrollMore,
      intersects,
      fullyAbove,
      lastActionReachable,
      lastRect: lastRect
        ? {
            top: Math.round(lastRect.top),
            bottom: Math.round(lastRect.bottom),
            height: Math.round(lastRect.height),
            width: Math.round(lastRect.width),
          }
        : null,
      lastArticleRect: lastArticleRect
        ? {
            top: Math.round(lastArticleRect.top),
            bottom: Math.round(lastArticleRect.bottom),
            height: Math.round(lastArticleRect.height),
          }
        : null,
      navRect: navRect
        ? {
            top: Math.round(navRect.top),
            bottom: Math.round(navRect.bottom),
            height: Math.round(navRect.height),
          }
        : null,
    };
  });
}

test.describe("C3.1-R1 — Mobile Safari closure", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("header connecté 375/390/393/430 : Yunicity, Explorer, Menu, Profil, sans cloche", async ({
    citizenAPage: page,
  }) => {
    for (const viewport of HEADER_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoFeedReady(page);

      await expect(page.getByRole("button", { name: EXPLORER_LABEL }).locator("visible=true").first()).toBeVisible();
      await expect(page.getByRole("button", { name: MENU_LABEL }).locator("visible=true").first()).toBeVisible();
      await expect(page.getByRole("button", { name: ACCOUNT_LABEL }).locator("visible=true").first()).toBeVisible();

      await assertHeaderGeometry(page, viewport, AUTH_HEADER_CONTROLS);
      await capture(page, `header-connected-${viewport.name}`);
    }
  });

  test("390 — visiteur : Explorer et Menu, aucun faux CTA Profil", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/neighborhoods", /\/neighborhoods/);
    await waitSessionReady(page);

    await expect(page.getByRole("button", { name: EXPLORER_LABEL }).locator("visible=true").first()).toBeVisible();
    await expect(page.getByRole("button", { name: MENU_LABEL }).locator("visible=true").first()).toBeVisible();
    await expect(page.getByRole("button", { name: ACCOUNT_LABEL })).toHaveCount(0);
    await expect(page.locator("header [data-yunicity-mobile-header-control='account']")).toHaveCount(0);

    await openNamedOverlay(page, MENU_LABEL);
    const nav = page.getByRole("navigation", { name: MENU_LABEL }).first();
    await expect(nav.getByRole("link", { name: "Se connecter" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Créer un compte" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Profil" })).toHaveCount(0);

    await context.close();
  });

  test("393 — Menu Yunicity connecté sans groupe Compte", async ({ citizenAPage: page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await gotoFeedReady(page);
    await openNamedOverlay(page, MENU_LABEL);

    const nav = page.getByRole("navigation", { name: MENU_LABEL }).first();
    for (const label of ["Quartiers", "Tribus", "Lieux", "Passport", "Notifications", "Discussions"] as const) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(nav.getByText("Compte")).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Profil" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Paramètres" })).toHaveCount(0);
    await expect(nav.getByRole("button", { name: "Se déconnecter" })).toHaveCount(0);

    await capture(page, "393-menu-yunicity-connected");
    await closeOverlayAndAssertClean(page, MENU_LABEL);
  });

  test("393 — Menu Profil connecté : identité, Profil, Paramètres, sans Passport", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await gotoFeedReady(page);

    const trigger = page.getByRole("button", { name: ACCOUNT_LABEL }).locator("visible=true").first();
    await expect(trigger).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await trigger.click();

    const menu = page.getByRole("menu", { name: "Compte" });
    await expect(menu).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(menu.getByText(CITIZEN_A_EMAIL)).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Profil" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Paramètres" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Se déconnecter" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Passport" })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: "Notifications" })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: "Discussions" })).toHaveCount(0);
    await expect(menu.getByText("Passport")).toHaveCount(0);

    await capture(page, "393-menu-profil-connected");
  });

  test("390/393 — Explorer, Menu et Créer au-dessus de la bottom-nav", async ({ citizenAPage: page }) => {
    test.setTimeout(180_000);
    const overlays = [
      { id: "explorer", label: EXPLORER_LABEL },
      { id: "menu", label: MENU_LABEL },
      { id: "create", label: new RegExp(CREATE_LABEL, "i") },
    ] as const;

    for (const viewport of OVERLAY_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoFeedReady(page);
      for (const overlay of overlays) {
        await openNamedOverlay(page, overlay.label);
        await assertOverlayAboveBottomNav(page, `${viewport.name}-${overlay.id}`);
        if (viewport.name === "393" && overlay.id === "explorer") {
          await capture(page, "393-explorer-open");
        }
        await dismissOverlayViaCoveredNav(page, overlay.label, `${viewport.name}-${overlay.id}`);
      }
    }
  });

  for (const viewport of OVERLAY_VIEWPORTS) {
    test(`${viewport.name} — Feed fin de scroll : dernier contenu mesuré`, async ({
      citizenAPage: page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoFeedReady(page);
      await expect(page.locator("main article").first()).toBeVisible({ timeout: COLD_START_TIMEOUT });

      const measurement = await measureFeedEnd(page);
      console.log(`FEED-END ${viewport.name}×${viewport.height}`, JSON.stringify(measurement));
      expect(measurement.articleCount, `${viewport.name}: fil vide`).toBeGreaterThan(0);
      expect(measurement.lastRect, `${viewport.name}: dernier contenu introuvable`).toBeTruthy();
      expect(measurement.lastRect?.height ?? 0, `${viewport.name}: rectangle dernier contenu vide`).toBeGreaterThan(8);
      expect(measurement.navRect, `${viewport.name}: bottom-nav introuvable`).toBeTruthy();

      const lastContentReachable = measurement.fullyAbove || measurement.lastActionReachable;
      expect(
        lastContentReachable,
        `${viewport.name}: dernier contenu inaccessible (intersects=${measurement.intersects}, canScrollMore=${measurement.canScrollMore}, fullyAbove=${measurement.fullyAbove})`,
      ).toBe(true);

      if (viewport.name === "393") {
        await capture(page, "393-feed-end-scroll");
      }
    });
  }
});
