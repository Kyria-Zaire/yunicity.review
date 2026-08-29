import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { test } from "../fixtures";

/**
 * C3-FEED-RESPONSIVE-SHELL-R4A — isolation des navigations par palier.
 *
 * Ces assertions ferment deux trous de R4 :
 *   1. R4 verifiait que les rails Desktop sont VISIBLES a 1024px, jamais qu'ils
 *      sont MASQUES en dessous. Une declaration `display: flex` posterieure et
 *      de meme specificite gagnait la cascade : le rail de navigation etait
 *      rendu dans le flux sur Mobile et Medium.
 *   2. R4 mesurait le CONTENEUR du logo, dont la largeur etait correcte, alors
 *      que le wordmark debordait par-dessus le bouton Recherche. On mesure
 *      desormais le texte lui-meme.
 */

const MOBILE = [
  { w: 320, h: 800 },
  { w: 344, h: 882 },
  { w: 360, h: 740 },
  { w: 390, h: 844 },
  { w: 414, h: 896 },
  { w: 639, h: 900 },
] as const;

const MEDIUM = [
  { w: 640, h: 900 },
  { w: 768, h: 1024 },
  { w: 1023, h: 600 },
] as const;

const MIN_GAP_PX = 4;

async function gotoFeed(page: Page): Promise<void> {
  await page.goto("/feed");
  await page.locator(".feed-main-column").first().waitFor({ state: "attached" });
  await page.waitForLoadState("networkidle");
}

async function railState(page: Page) {
  return page.evaluate(() => {
    const probe = (selector: string) => {
      const node = document.querySelector(selector);
      if (!node) return { present: false, display: "absent", area: 0 };
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        present: true,
        display: style.display,
        visibility: style.visibility,
        area: rect.width * rect.height,
      };
    };
    return { left: probe(".feed-desktop-left-rail"), right: probe(".feed-desktop-right-rail") };
  });
}

test.describe("R4A — le rail Desktop n'existe visuellement qu'en Desktop", () => {
  for (const { w, h } of [...MOBILE, ...MEDIUM]) {
    test(`panneau de navigation invisible et sans emprise — ${w}x${h}`, async ({
      authedPage: page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      const rails = await railState(page);
      expect(rails.left.display, `rail gauche masque a ${w}px`).toBe("none");
      expect(rails.right.display, `rail droit masque a ${w}px`).toBe("none");
      expect(rails.left.area, `rail gauche sans surface a ${w}px`).toBe(0);
      expect(rails.right.area, `rail droit sans surface a ${w}px`).toBe(0);

      // Aucune surface invisible ne capture le clic : au point ou le rail se
      // trouverait, c'est le contenu du fil qui repond.
      const topLeftOwner = await page.evaluate(() => {
        const el = document.elementFromPoint(8, 120);
        return el?.closest(".feed-desktop-left-rail") ? "rail" : "contenu";
      });
      expect(topLeftOwner, `pas de surface fantome du rail a ${w}px`).toBe("contenu");

      // Aucun element du rail n'est atteignable au clavier.
      const railFocusable = await page.evaluate(() => {
        const rail = document.querySelector(".feed-desktop-left-rail");
        if (!rail) return 0;
        return Array.from(rail.querySelectorAll("a, button, [tabindex]")).filter((node) => {
          const r = node.getBoundingClientRect();
          return r.width > 0 || r.height > 0;
        }).length;
      });
      expect(railFocusable, `aucun focusable actif dans le rail a ${w}px`).toBe(0);
    });
  }

  for (const { w, h } of [
    { w: 1024, h: 600 },
    { w: 1025, h: 600 },
    { w: 1280, h: 800 },
    { w: 1366, h: 900 },
  ]) {
    test(`les deux rails restent visibles en Desktop — ${w}x${h}`, async ({
      authedPage: page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      const rails = await railState(page);
      expect(rails.left.display).not.toBe("none");
      expect(rails.right.display).not.toBe("none");
      expect(rails.left.area).toBeGreaterThan(0);
      expect(rails.right.area).toBeGreaterThan(0);
    });
  }
});

test.describe("R4A — header Mobile : le texte lui-meme ne chevauche rien", () => {
  for (const { w, h } of MOBILE) {
    test(`gaps reels entre commandes — ${w}x${h}`, async ({ authedPage: page }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      const measured = await page.evaluate(() => {
        const slot = document.querySelector('[data-yunicity-mobile-header-control="logo"]');
        // Le WORDMARK, pas son conteneur : c'est lui qui debordait.
        const wordmark = Array.from(slot?.querySelectorAll("span") ?? []).find(
          (n) => (n.textContent ?? "").trim() === "Yunicity" && n.children.length === 0,
        );
        const right = (selector: string) =>
          document.querySelector(selector)?.getBoundingClientRect() ?? null;
        return {
          brandRight: wordmark?.getBoundingClientRect().right ?? null,
          explorer: right('[data-yunicity-mobile-header-control="explorer"]'),
          menu: right('[data-yunicity-mobile-header-control="menu"]'),
          account: right('[data-yunicity-mobile-header-control="account"]'),
        };
      });

      expect(measured.brandRight, "wordmark present").not.toBeNull();
      expect(measured.explorer, "bouton Recherche present").not.toBeNull();

      expect(
        measured.brandRight!,
        `Yunicity ne chevauche pas Recherche a ${w}px`,
      ).toBeLessThanOrEqual(measured.explorer!.left - MIN_GAP_PX);

      if (measured.menu) {
        expect(
          measured.explorer!.right,
          `Recherche / Menu : gap >= ${MIN_GAP_PX}px a ${w}px`,
        ).toBeLessThanOrEqual(measured.menu.left - MIN_GAP_PX);
      }
      if (measured.menu && measured.account) {
        expect(
          measured.menu.right,
          `Menu / Avatar : gap >= ${MIN_GAP_PX}px a ${w}px`,
        ).toBeLessThanOrEqual(measured.account.left - MIN_GAP_PX);
      }

      const widths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(widths.scrollWidth).toBe(widths.clientWidth);
    });
  }
});

test("R4A — sequence de resize : aucun shell fantome, aucun refetch", async ({
  authedPage: page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await gotoFeed(page);

  const calls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/v1/")) calls.push(req.url());
  });

  const sequence = [360, 640, 1024, 414, 1280, 360];
  for (const width of sequence) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => ({
      columns: document.querySelectorAll(".feed-main-column").length,
      streams: document.querySelectorAll("[data-feed-stream-list]").length,
      leftDisplay: getComputedStyle(document.querySelector(".feed-desktop-left-rail")!).display,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(state.columns, `colonne unique a ${width}px`).toBe(1);
    expect(state.streams, `flux unique a ${width}px`).toBeLessThanOrEqual(1);
    expect(
      state.leftDisplay === "none",
      `rail masque hors Desktop a ${width}px`,
    ).toBe(width < 1024);
    expect(state.scrollWidth, `aucun overflow a ${width}px`).toBe(state.clientWidth);
  }

  await page.waitForTimeout(600);
  const railCalls = calls.filter((u) => u.includes("passport") || u.includes("weather"));
  expect(railCalls.length, `appels de rail : ${railCalls.join(", ")}`).toBeLessThanOrEqual(3);
});
