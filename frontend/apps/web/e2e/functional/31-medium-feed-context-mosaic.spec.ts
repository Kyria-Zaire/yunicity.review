/**
 * C3-FEED-M9 — mosaïque éditoriale de la région context (640 → 1279,98).
 *
 * RED : quatre surfaces empilées pleine largeur, gap 16 px, aucune composition.
 * GREEN : 1 col (640–767) · 2 col (768–1023) · mosaïque 7/5 puis 5/7 (1024–1279).
 */
import type { Page } from "@playwright/test";

import {
  FEED_MEDIUM_CONTEXT_GAP_PX,
  FEED_MEDIUM_CONTEXT_PADDING_PX,
  FEED_MEDIUM_CONTEXT_TILES,
  isFeedMediumContextTileSequenceValid,
} from "@/lib/layout/feed-medium-context-tiles";
import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "834x1112", width: 834, height: 1112 },
  { label: "1024x900", width: 1024, height: 900 },
  { label: "1279x900", width: 1279, height: 900 },
] as const;

const CONTEXT = '[data-feed-medium-region="context"]';
const TILE = "[data-feed-medium-context-tile]";
const PRIMARY = '[data-feed-medium-surface="primary"]';

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
}

async function mountContext(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document.querySelectorAll(
            '[data-feed-medium-region="context"] [data-feed-medium-context-tile]',
          ).length,
      ),
    )
    .toBe(4);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function mesurerMosaïque(page: Page) {
  return page.evaluate(
    ({ contextSel, tileSel, gapPx, padPx }) => {
      const round = (n: number) => Math.round(n * 100) / 100;
      const ctx = document.querySelector(contextSel)!;
      const wrap = ctx.querySelector(":scope > div") as HTMLElement;
      const cs = getComputedStyle(wrap);
      const tiles = [...ctx.querySelectorAll(tileSel)] as HTMLElement[];
      const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
      const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
      const ctxBox = ctx.getBoundingClientRect();
      const boxes = tiles.map((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          id: el.getAttribute("data-feed-medium-context-tile"),
          left: round(r.left),
          right: round(r.right),
          top: round(r.top),
          bottom: round(r.bottom),
          width: round(r.width),
          height: round(r.height),
          radius: parseFloat(s.borderTopLeftRadius) || 0,
          shadow: s.boxShadow,
          padding: s.padding,
          margin: s.margin,
          primary: el.getAttribute("data-feed-medium-surface") === "primary",
        };
      });
      const gap = parseFloat(cs.gap || cs.rowGap || "0") || 0;
      return {
        display: cs.display,
        template: cs.gridTemplateColumns,
        gap: round(gap),
        tokenGap: getComputedStyle(document.documentElement)
          .getPropertyValue("--feed-medium-context-gap")
          .trim(),
        tokenPad: getComputedStyle(document.documentElement)
          .getPropertyValue("--feed-medium-context-padding")
          .trim(),
        ids: boxes.map((b) => b.id),
        boxes,
        axisL: round(ctxBox.left - rail.right),
        axisR: round(shell.right - ctxBox.right),
        overflow:
          document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        gapPx,
        padPx,
        titles: tiles.map((el) => (el.querySelector("h2")?.textContent ?? "").trim()),
      };
    },
    {
      contextSel: CONTEXT,
      tileSel: TILE,
      gapPx: FEED_MEDIUM_CONTEXT_GAP_PX,
      padPx: FEED_MEDIUM_CONTEXT_PADDING_PX,
    },
  );
}

test.describe("C3-FEED-M9 — mosaïque context medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — identités, ordre, surfaces plates, axes région`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      await mountContext(authedPage);
      const m = await mesurerMosaïque(authedPage);

      expect(m.ids, "identités").toEqual([...FEED_MEDIUM_CONTEXT_TILES]);
      expect(isFeedMediumContextTileSequenceValid(m.ids as string[]), "ordre").toBe(true);
      expect(m.boxes.every((b) => b.primary), "marqueur primary manquant").toBe(true);
      expect(Math.max(...m.boxes.map((b) => b.radius)), "rayon").toBeLessThanOrEqual(2);
      expect(m.boxes.every((b) => b.shadow === "none"), "ombre").toBe(true);
      expect(Math.abs(m.axisL), "axe gauche région").toBeLessThanOrEqual(1);
      expect(Math.abs(m.axisR), "axe droit région").toBeLessThanOrEqual(1);
      expect(m.overflow, "overflow").toBe(true);
      expect(m.gap, "gap").toBe(FEED_MEDIUM_CONTEXT_GAP_PX);
      expect(m.tokenGap).toBe("16px");
      expect(m.tokenPad).toBe("16px");
      for (const b of m.boxes) {
        expect(b.margin, "marge tuile").toMatch(/^0px/);
        expect(b.padding).toContain(`${FEED_MEDIUM_CONTEXT_PADDING_PX}px`);
      }
      // Ordre DOM = ordre visuel (tops non décroissants hors même rangée).
      for (let i = 1; i < m.boxes.length; i++) {
        expect(m.boxes[i]!.top + 1).toBeGreaterThanOrEqual(m.boxes[i - 1]!.top);
      }
    });
  }

  test("640 — une colonne compacte pleine largeur", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 640, height: 900 });
    await mountContext(authedPage);
    const m = await mesurerMosaïque(authedPage);
    expect(m.display).toBe("grid");
    expect(new Set(m.boxes.map((b) => b.width)).size).toBe(1);
    expect(m.boxes[0]!.width).toBeGreaterThan(500);
    for (let i = 1; i < m.boxes.length; i++) {
      expect(m.boxes[i]!.top).toBeGreaterThan(m.boxes[i - 1]!.bottom - 1);
    }
  });

  for (const vp of [
    { label: "768", width: 768, height: 1024 },
    { label: "834", width: 834, height: 1112 },
  ] as const) {
    test(`${vp.label} — deux colonnes équilibrées`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      await mountContext(authedPage);
      const m = await mesurerMosaïque(authedPage);
      const lefts = [...new Set(m.boxes.map((b) => Math.round(b.left)))];
      expect(lefts.length, "nombre de colonnes").toBe(2);
      expect(Math.abs(m.boxes[0]!.width - m.boxes[1]!.width), "colonnes inégales").toBeLessThanOrEqual(
        2,
      );
      expect(Math.abs(m.boxes[0]!.top - m.boxes[1]!.top), "rangée 1 non alignée").toBeLessThanOrEqual(
        2,
      );
      expect(Math.abs(m.boxes[2]!.top - m.boxes[3]!.top), "rangée 2 non alignée").toBeLessThanOrEqual(
        2,
      );
      const gapH = Math.round(m.boxes[1]!.left - m.boxes[0]!.right);
      expect(Math.abs(gapH - FEED_MEDIUM_CONTEXT_GAP_PX)).toBeLessThanOrEqual(1);
    });
  }

  for (const vp of [
    { label: "1024", width: 1024, height: 900 },
    { label: "1279", width: 1279, height: 900 },
  ] as const) {
    test(`${vp.label} — mosaïque 7/5 puis 5/7`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      await mountContext(authedPage);
      const m = await mesurerMosaïque(authedPage);
      const [p, t, ms, ln] = m.boxes;
      expect(p!.width).toBeGreaterThan(t!.width);
      expect(ln!.width).toBeGreaterThan(ms!.width);
      expect(Math.abs(p!.width / t!.width - 7 / 5)).toBeLessThan(0.08);
      expect(Math.abs(ln!.width / ms!.width - 7 / 5)).toBeLessThan(0.08);
      expect(Math.abs(p!.top - t!.top)).toBeLessThanOrEqual(2);
      expect(Math.abs(ms!.top - ln!.top)).toBeLessThanOrEqual(2);
      expect(p!.id).toBe("privilege");
      expect(t!.id).toBe("tribes");
      expect(ms!.id).toBe("must-see");
      expect(ln!.id).toBe("local-now");
    });
  }

  test("768 — lazy mounting sans duplication", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const avant = await authedPage.evaluate(() => ({
      regions: document.querySelectorAll('[data-feed-medium-region="context"]').length,
      tiles: document.querySelectorAll(
        '[data-feed-medium-region="context"] [data-feed-medium-context-tile]',
      ).length,
    }));
    expect(avant.regions).toBe(1);

    await mountContext(authedPage);

    const apres = await authedPage.evaluate(() => {
      const ctx = document.querySelector('[data-feed-medium-region="context"]')!;
      const tiles = [...ctx.querySelectorAll("[data-feed-medium-context-tile]")];
      const boxes = tiles.map((el) => el.getBoundingClientRect());
      return {
        regions: document.querySelectorAll('[data-feed-medium-region="context"]').length,
        tiles: tiles.length,
        ids: tiles.map((el) => el.getAttribute("data-feed-medium-context-tile")),
        overlap: boxes.some((b, i) =>
          boxes.some(
            (o, j) =>
              i !== j &&
              b.left < o.right - 1 &&
              b.right > o.left + 1 &&
              b.top < o.bottom - 1 &&
              b.bottom > o.top + 1,
          ),
        ),
        stories: document.querySelectorAll('[data-feed-medium-region="stories"]').length,
        composer: document.querySelectorAll('[data-feed-medium-region="composer"]').length,
        stream: document.querySelectorAll('[data-feed-medium-region="stream"]').length,
      };
    });
    expect(apres.regions).toBe(1);
    expect(apres.tiles).toBe(4);
    expect(apres.ids).toEqual([...FEED_MEDIUM_CONTEXT_TILES]);
    expect(apres.overlap, "chevauchement").toBe(false);
    expect(apres.stories).toBe(1);
    expect(apres.composer).toBe(1);
    expect(apres.stream).toBe(1);

    await authedPage.evaluate(() => window.scrollTo(0, 0));
    const haut = await mesurerMosaïque(authedPage);
    expect(haut.ids).toEqual([...FEED_MEDIUM_CONTEXT_TILES]);
  });

  test("768 — total 10 surfaces primaires plates", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountContext(authedPage);
    const m = await authedPage.evaluate((primarySel) => {
      const surfaces = [
        ...document.querySelectorAll(`.feed-medium-editorial-grid ${primarySel}`),
      ].filter((el) => el.getBoundingClientRect().width > 0);
      return {
        n: surfaces.length,
        rayons: surfaces.map(
          (el) => parseFloat(getComputedStyle(el as HTMLElement).borderTopLeftRadius) || 0,
        ),
        ombres: surfaces.map((el) => getComputedStyle(el as HTMLElement).boxShadow),
        primaryOnControl: [
          ...document.querySelectorAll(
            `a${primarySel}, button${primarySel}, img${primarySel}`,
          ),
        ].length,
      };
    }, PRIMARY);
    expect(m.n).toBe(10);
    expect(Math.max(...m.rayons)).toBeLessThanOrEqual(2);
    expect(m.ombres.every((o) => o === "none")).toBe(true);
    expect(m.primaryOnControl).toBe(0);
  });

  test("768 — focus CTA tuile visible et cible ≥ 44", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountContext(authedPage);
    const cta = authedPage
      .locator(`${CONTEXT} [data-feed-medium-context-tile="tribes"] a`)
      .filter({ hasText: /voir tout/i })
      .first();
    await cta.focus();
    const box = await cta.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    const outline = await cta.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline === "none" || outline.length > 0).toBe(true);
  });

  test("bascule 639 / 640 — mobile inchangé, mosaïque absente puis active", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 639, height: 900 });
    const mobile = await authedPage.evaluate(() => {
      const ctx = document.querySelector('[data-feed-medium-region="context"]');
      const r = ctx?.getBoundingClientRect();
      return {
        visible: (r?.width ?? 0) > 0 && (r?.height ?? 0) > 0,
        mosaic: getComputedStyle(
          (ctx?.querySelector(":scope > div") as HTMLElement) || document.body,
        ).gridTemplateColumns,
      };
    });
    expect(mobile.visible, "context visible en mobile").toBe(false);

    await authedPage.setViewportSize({ width: 640, height: 900 });
    await mountContext(authedPage);
    const m = await mesurerMosaïque(authedPage);
    expect(m.display).toBe("grid");
    expect(m.ids).toEqual([...FEED_MEDIUM_CONTEXT_TILES]);
  });

  test("bascule 1279 / 1280 — desktop hors contrat M9", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    await mountContext(authedPage);
    const medium = await mesurerMosaïque(authedPage);
    expect(medium.boxes[0]!.width).toBeGreaterThan(medium.boxes[1]!.width);

    await authedPage.setViewportSize({ width: 1280, height: 900 });
    const desktop = await authedPage.evaluate(() => {
      const shell = document.querySelector(".citizen-medium-shell");
      const ctx = document.querySelector('[data-feed-medium-region="context"]');
      const wrap = ctx?.querySelector(":scope > div") as HTMLElement | null;
      const tilesInFeed = document.querySelectorAll(
        '[data-feed-medium-region="context"] [data-feed-medium-context-tile]',
      ).length;
      return {
        hasShell: !!shell,
        mosaicActive:
          wrap &&
          getComputedStyle(wrap).display === "grid" &&
          getComputedStyle(wrap).gridTemplateColumns.split(" ").length >= 12,
        tilesInFeed,
      };
    });
    expect(desktop.mosaicActive, "mosaïque 12 col active à 1280").toBeFalsy();
  });

  for (const route of [
    "/videos",
    "/map",
    "/sortir",
    "/search",
    "/tribes",
    "/passport",
    "/subscriptions",
  ]) {
    test(`768 — ${route} n'hérite pas de la mosaïque Feed`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await expect(authedPage.locator("main").first()).toBeVisible();
      const fuite = await authedPage.evaluate(() => ({
        tiles: document.querySelectorAll("[data-feed-medium-context-tile]").length,
        context: document.querySelectorAll('[data-feed-medium-region="context"]').length,
      }));
      expect(fuite.tiles, "tuile context Feed fuitée").toBe(0);
      expect(fuite.context, "région context Feed fuitée").toBe(0);
    });
  }
});
