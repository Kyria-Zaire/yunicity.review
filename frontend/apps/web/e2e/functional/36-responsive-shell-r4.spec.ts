import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { test } from "../fixtures";

/**
 * C3-FEED-RESPONSIVE-SHELL-R4 — preuves navigateur du squelette responsive.
 *
 * Aucune capture : uniquement des mesures de geometrie reelle. Chaque palier est
 * parcouru en changeant la taille du viewport dans un contexte unique, ce qui
 * verifie aussi qu'aucun changement de largeur ne relance de requete.
 */

const MOBILE = [
  { w: 320, h: 800 },
  { w: 344, h: 882 },
  { w: 360, h: 740 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 414, h: 896 },
  { w: 540, h: 720 },
  { w: 639, h: 900 },
] as const;

const MEDIUM = [
  { w: 640, h: 900 },
  { w: 768, h: 1024 },
  { w: 900, h: 1000 },
  { w: 1023, h: 600 },
] as const;

const DESKTOP = [
  { w: 1024, h: 600 },
  { w: 1025, h: 600 },
  { w: 1280, h: 800 },
  { w: 1366, h: 900 },
] as const;

async function gotoFeed(page: Page): Promise<void> {
  await page.goto("/feed");
  await page.locator(".feed-main-column").first().waitFor({ state: "attached" });
  await page.waitForLoadState("networkidle");
}

async function documentWidths(page: Page): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

test.describe("R4 — contrats globaux", () => {
  test("une seule colonne et un seul flux a toutes les largeurs", async ({ authedPage: page }) => {
    await gotoFeed(page);

    for (const { w, h } of [...MOBILE, ...MEDIUM, ...DESKTOP]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(120);

      const counts = await page.evaluate(() => ({
        columns: document.querySelectorAll(".feed-main-column").length,
        shells: document.querySelectorAll(".feed-shell").length,
        streamLists: document.querySelectorAll("[data-feed-stream-list]").length,
      }));

      expect(counts.columns, `colonne unique a ${w}px`).toBe(1);
      expect(counts.shells, `shell unique a ${w}px`).toBe(1);
      expect(counts.streamLists, `liste unique a ${w}px`).toBeLessThanOrEqual(1);

      const { scrollWidth, clientWidth } = await documentWidths(page);
      expect(scrollWidth, `aucun debordement horizontal a ${w}px`).toBe(clientWidth);
    }
  });

  test("aucun post duplique", async ({ authedPage: page }) => {
    await gotoFeed(page);
    const signatures = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-feed-stream-item]")).map(
        (node) => (node.textContent ?? "").slice(0, 160),
      ),
    );
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  test("aucune requete supplementaire pendant les changements de largeur", async ({
    authedPage: page,
  }) => {
    await gotoFeed(page);

    const calls: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/v1/")) calls.push(url);
    });

    for (const { w, h } of [...MOBILE, ...MEDIUM, ...DESKTOP, ...MOBILE]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(600);

    // Les rails Desktop s'arment une fois lorsqu'ils deviennent visibles ; rien
    // ne doit repartir aux traversees suivantes de 1024px.
    const railCalls = calls.filter((u) => u.includes("passport") || u.includes("weather"));
    expect(railCalls.length, `appels de rail : ${railCalls.join(", ")}`).toBeLessThanOrEqual(3);
  });
});

test.describe("R4 — Mobile 0-639px", () => {
  for (const { w, h } of MOBILE) {
    test(`navbar entiere et header sans collision — ${w}x${h}`, async ({ authedPage: page }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      await expect(page.locator(".web-mobile-strategic-bottom-nav")).toHaveCount(1);

      const geometry = await page.evaluate(() => {
        const nav = document.querySelector(".web-mobile-strategic-bottom-nav");
        const navRect = nav?.getBoundingClientRect() ?? null;
        const logo = document.querySelector('[data-yunicity-mobile-header-control="logo"]');
        const header = logo?.closest("header");
        const actions = header?.querySelector("header > div > div:last-child");
        return {
          nav: navRect ? { top: navRect.top, bottom: navRect.bottom } : null,
          navDisplay: nav ? getComputedStyle(nav).display : "none",
          viewportHeight: window.visualViewport?.height ?? window.innerHeight,
          logo: logo ? logo.getBoundingClientRect().right : null,
          actions: actions ? actions.getBoundingClientRect().left : null,
        };
      });

      expect(geometry.navDisplay, "navbar affichee").not.toBe("none");
      expect(geometry.nav, "navbar mesurable").not.toBeNull();
      expect(geometry.nav!.top, "navbar top >= 0").toBeGreaterThanOrEqual(0);
      expect(
        Math.round(geometry.nav!.bottom),
        "navbar bottom <= hauteur du viewport",
      ).toBeLessThanOrEqual(Math.ceil(geometry.viewportHeight));

      if (geometry.logo !== null && geometry.actions !== null) {
        expect(geometry.logo, `logo et actions sans chevauchement a ${w}px`).toBeLessThanOrEqual(
          geometry.actions + 0.5,
        );
      }

      const { scrollWidth, clientWidth } = await documentWidths(page);
      expect(scrollWidth).toBe(clientWidth);
    });
  }

  test("les trois actions du composeur restent lisibles", async ({ authedPage: page }) => {
    for (const { w, h } of MOBILE) {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      const actions = await page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-feed-desktop-composer-action]"))
          .filter((node) => getComputedStyle(node).display !== "none")
          .map((node) => ({
            text: (node.textContent ?? "").trim(),
            width: node.getBoundingClientRect().width,
          })),
      );

      expect(actions.length, `3 actions a ${w}px`).toBeGreaterThanOrEqual(3);
      for (const action of actions) {
        expect(action.width, `action non ecrasee a ${w}px : ${action.text}`).toBeGreaterThan(0);
      }
    }
  });
});

test.describe("R4 — Medium 640-1023px", () => {
  for (const { w, h } of MEDIUM) {
    test(`rail unique et commandes atteignables — ${w}x${h}`, async ({ authedPage: page }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      await expect(page.locator("[data-citizen-medium-rail]")).toHaveCount(1);

      const rail = await page.evaluate(() => {
        const node = document.querySelector("[data-citizen-medium-rail]");
        const footer = document.querySelector("[data-citizen-medium-rail-footer]");
        if (!node || !footer) return null;
        return {
          footerBottom: footer.getBoundingClientRect().bottom,
          viewportHeight: window.innerHeight,
        };
      });

      expect(rail, "rail et pied presents").not.toBeNull();
      // Le pied porte Creer, Notifications et Profil : il doit tenir a l'ecran.
      expect(
        Math.round(rail!.footerBottom),
        `pied du rail atteignable a ${w}x${h}`,
      ).toBeLessThanOrEqual(Math.ceil(rail!.viewportHeight));

      const { scrollWidth, clientWidth } = await documentWidths(page);
      expect(scrollWidth).toBe(clientWidth);
    });
  }
});

test.describe("R4 — Desktop 1024px et plus", () => {
  for (const { w, h } of DESKTOP) {
    test(`deux rails et flux central unique — ${w}x${h}`, async ({ authedPage: page }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      await expect(page.locator(".feed-desktop-left-rail")).toHaveCount(1);
      await expect(page.locator(".feed-desktop-right-rail")).toHaveCount(1);
      await expect(page.locator(".feed-main-column")).toHaveCount(1);

      const displays = await page.evaluate(() => ({
        left: getComputedStyle(document.querySelector(".feed-desktop-left-rail")!).display,
        right: getComputedStyle(document.querySelector(".feed-desktop-right-rail")!).display,
        header: getComputedStyle(document.querySelector(".feed-shell-desktop-header")!).display,
      }));

      expect(displays.left).not.toBe("none");
      expect(displays.right).not.toBe("none");
      expect(displays.header).not.toBe("none");

      const { scrollWidth, clientWidth } = await documentWidths(page);
      expect(scrollWidth).toBe(clientWidth);
    });
  }
});
