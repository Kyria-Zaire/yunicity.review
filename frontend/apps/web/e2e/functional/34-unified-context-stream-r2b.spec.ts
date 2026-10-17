import type { FeedPost } from "@yunicity/types";
import type { Locator, Page } from "@playwright/test";

import { FEED_VIEWPORT_DESKTOP_MIN_PX } from "@/lib/layout/feed-breakpoints";

import { expect, test } from "../fixtures";

const VIEWPORTS = [
  { width: 375, height: 900 },
  { width: 639, height: 900 },
  { width: 640, height: 900 },
  { width: 768, height: 1024 },
  { width: 1279, height: 900 },
  { width: 1280, height: 900 },
  { width: 1535, height: 900 },
  { width: 1536, height: 900 },
] as const;

/**
 * Borne du palier desktop — prise au contrat, jamais recopiee. Cette spec
 * portait 1280, valeur d'AVANT R4B ; `feed-breakpoints.ts` dit 1024.
 */
const DESKTOP_MIN_WIDTH = FEED_VIEWPORT_DESKTOP_MIN_PX;

/**
 * Cadence UNIQUE : les deux familles dont la source se resout entrent dans le
 * flux a TOUTE largeur, aux memes rangs. C'est le contrat de
 * `feed-context-stream.ts` — « les trois bandes partageront cette meme cadence
 * et ne feront varier que le RENDU ».
 */
const CADENCE_FAMILIES = ["must-see", "local-privilege"] as const;
const CADENCE_POSITIONS = [4, 10] as const;

const DESKTOP_CONTEXT_FAMILIES = [] as const;
const DESKTOP_MODULE_POSITIONS = [] as const;

/** Familles VISIBLES : le palier desktop les masque au rendu (globals.css). */
function expectedContextFamilies(width: number) {
  return width >= DESKTOP_MIN_WIDTH ? DESKTOP_CONTEXT_FAMILIES : CADENCE_FAMILIES;
}

function expectedModulePositions(width: number) {
  return width >= DESKTOP_MIN_WIDTH ? DESKTOP_MODULE_POSITIONS : CADENCE_POSITIONS;
}

const STREAM = "[data-feed-stream-list]";
// The Playwright user is not a member of the seeded public tribe.
// Only context families carrying real content for that viewer are eligible.
const INITIAL_CONTEXT_FAMILIES = CADENCE_FAMILIES;

function post(index: number): FeedPost {
  const id = `r2b-${String(index).padStart(2, "0")}`;
  return {
    id,
    type: "post",
    author: {
      type: "citizen",
      id: `author-${id}`,
      display_name: "Citoyenne R2B",
      username: `r2b_${index}`,
      logo_url: null,
    },
    city: "Reims",
    title: null,
    body: `Publication controlee ${index}`,
    media_url: null,
    location: null,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  };
}

const POSTS = Array.from({ length: 40 }, (_, index) => post(index + 1));

async function stubLongFeed(page: Page): Promise<{
  calls: () => number;
  cursors: () => readonly (string | null)[];
}> {
  let calls = 0;
  const cursors: (string | null)[] = [];
  await page.route("**/api/v1/feed?*", async (route) => {
    calls += 1;
    const cursor = new URL(route.request().url()).searchParams.get("cursor");
    cursors.push(cursor);
    const items = cursor ? POSTS.slice(20) : POSTS.slice(0, 20);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items, next_cursor: cursor ? null : "r2b-page-2" }),
    });
  });
  return { calls: () => calls, cursors: () => cursors };
}

async function gotoFeed(page: Page, viewport: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto("/feed");
  await expect(page.locator(STREAM)).toBeVisible();
}

async function waitForAsyncStreamSources(page: Page): Promise<void> {
  const localVideo = page.locator(`${STREAM} > li[data-feed-stream-item="local-video"]`);

  await expect(
    localVideo,
    "vidéo locale absente du stream après résolution de la source",
  ).toHaveCount(1, { timeout: 15_000 });
  await expectEffectivelyVisible(localVideo, "vidéo locale");
}

/**
 * Attend la PRESENCE de la cadence dans le DOM, sans rien exiger du rendu.
 * Indispensable au-dela de la borne : le palier y masque les modules, donc
 * attendre leur visibilite n'aboutirait jamais et la mesure lirait une cadence
 * encore vide.
 */
async function waitForCadenceInDom(
  page: Page,
  families: readonly (typeof CADENCE_FAMILIES)[number][],
): Promise<void> {
  for (const family of families) {
    await expect(
      page.locator(
        `${STREAM} > li[data-feed-stream-item="context-module"][data-feed-context-module="${family}"]`,
      ),
      `module contextuel ${family} absent du flux (cadence)`,
    ).toHaveCount(1, { timeout: 15_000 });
  }
}

async function waitForContextModules(
  page: Page,
  families: readonly (typeof INITIAL_CONTEXT_FAMILIES)[number][],
): Promise<void> {
  for (const family of families) {
    const contextModule = page.locator(
      `${STREAM} > li[data-feed-stream-item="context-module"][data-feed-context-module="${family}"]`,
    );

    await expect(
      contextModule,
      `module contextuel ${family} absent du stream après résolution de sa source`,
    ).toHaveCount(1, { timeout: 15_000 });
    await expectEffectivelyVisible(contextModule, `module contextuel ${family}`);
  }
}

async function expectEffectivelyVisible(locator: Locator, label: string): Promise<void> {
  await expect
    .poll(
      () =>
        locator.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          if (
            element.getClientRects().length === 0 ||
            rect.width <= 0 ||
            rect.height <= 0
          ) {
            return false;
          }
          for (let node: Element | null = element; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              node.hasAttribute("hidden") ||
              node.hasAttribute("inert")
            ) {
              return false;
            }
          }
          return true;
        }),
      { message: `${label} présent mais non effectivement visible`, timeout: 15_000 },
    )
    .toBe(true);
}

async function streamState(page: Page) {
  return page.locator(STREAM).evaluate((stream) => {
    const items = [...stream.children];
    let realContents = 0;
    const modulePositions: number[] = [];
    for (const item of items) {
      if (item.getAttribute("data-feed-stream-item") === "context-module") {
        modulePositions.push(realContents);
      } else {
        realContents += 1;
      }
    }
    const postIds = items
      .filter((item) => item.getAttribute("data-feed-stream-item") === "post")
      .map((item) => item.getAttribute("data-feed-post-id"));
    /*
     * Le palier desktop masque les modules AU RENDU : leurs <li> restent donc
     * dans le DOM. Mesurer `querySelectorAll` seul confondrait « masque » et
     * « absent du flux » — exactement la distinction que porte la decision.
     */
    const effectivementVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      if (element.getClientRects().length === 0 || rect.width <= 0 || rect.height <= 0) {
        return false;
      }
      for (let node: Element | null = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          node.hasAttribute("hidden") ||
          node.hasAttribute("inert")
        ) {
          return false;
        }
      }
      return true;
    };

    const moduleItems = items.filter(
      (item) => item.getAttribute("data-feed-stream-item") === "context-module",
    );
    const contextFamilies = moduleItems.map((item) =>
      item.getAttribute("data-feed-context-module"),
    );
    const visibleModules = moduleItems.filter(effectivementVisible);
    const contextFamiliesVisibles = visibleModules.map((item) =>
      item.getAttribute("data-feed-context-module"),
    );

    /** Rangs des modules VISIBLES, en contenus reels deja rendus. */
    const modulePositionsVisibles: number[] = [];
    let reels = 0;
    for (const item of items) {
      if (item.getAttribute("data-feed-stream-item") === "context-module") {
        if (effectivementVisible(item)) modulePositionsVisibles.push(reels);
      } else {
        reels += 1;
      }
    }

    /** Un module masque ne doit laisser aucun controle au clavier. */
    const focusablesDansModulesMasques = moduleItems
      .filter((item) => !effectivementVisible(item))
      .reduce(
        (total, item) =>
          total +
          [...item.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')].filter(
            (control) => (control as HTMLElement).offsetParent !== null,
          ).length,
        0,
      );

    return {
      contextFamilies,
      contextFamiliesVisibles,
      modulePositions,
      modulePositionsVisibles,
      focusablesDansModulesMasques,
      postIds,
      videos: items.filter((item) => item.getAttribute("data-feed-stream-item") === "local-video")
        .length,
    };
  });
}

test.describe("C3-FEED-R2B - unified context stream", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.width}px - une liste et un article par publication`, async ({ authedPage }) => {
      await stubLongFeed(authedPage);
      await gotoFeed(authedPage, viewport);
      await waitForAsyncStreamSources(authedPage);
      // La cadence entre dans le flux a toute largeur…
      await waitForCadenceInDom(authedPage, CADENCE_FAMILIES);
      // …et seules les familles du palier doivent etre effectivement visibles.
      await waitForContextModules(authedPage, expectedContextFamilies(viewport.width));

      const state = await streamState(authedPage);
      expect(await authedPage.locator(STREAM).count()).toBe(1);
      expect(new Set(state.postIds).size).toBe(state.postIds.length);
      // Un article PAR PUBLICATION : le comptage doit être borné aux entrées
      // « post ». Le teaser vidéo rend lui aussi un <article>
      // (feed-video-stream-item.tsx), donc `${STREAM} article` valait
      // publications + 1 et ne pouvait jamais égaler le nombre de posts.
      expect(
        await authedPage.locator(`${STREAM} li[data-feed-stream-item="post"] article`).count(),
        "un article par publication",
      ).toBe(state.postIds.length);
      expect(state.videos).toBe(1);

      // Cadence UNIQUE : meme flux, memes rangs, a toute largeur.
      expect(state.contextFamilies, "cadence du flux alteree par le palier").toEqual([
        ...CADENCE_FAMILIES,
      ]);
      expect(state.modulePositions, "rangs de cadence alteres par le palier").toEqual([
        ...CADENCE_POSITIONS,
      ]);

      // Rendu PAR PALIER : le desktop les masque, sans espace ni focus residuel.
      expect(state.contextFamiliesVisibles, "modules visibles hors contrat du palier").toEqual([
        ...expectedContextFamilies(viewport.width),
      ]);
      expect(state.modulePositionsVisibles, "rangs visibles hors contrat du palier").toEqual([
        ...expectedModulePositions(viewport.width),
      ]);
      expect(
        state.focusablesDansModulesMasques,
        "un module masque laisse un controle atteignable au clavier",
      ).toBe(0);
    });
  }

  test("le sentinel append automatiquement sans déplacer les modules", async ({ authedPage }) => {
    const feed = await stubLongFeed(authedPage);
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await waitForAsyncStreamSources(authedPage);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);
    await expect.poll(() => feed.calls()).toBe(1);
    const before = await streamState(authedPage);

    await authedPage.locator("[data-feed-stream-sentinel]").scrollIntoViewIfNeeded();
    await expect.poll(() => feed.calls()).toBe(2);
    await expect.poll(() => authedPage.locator(`${STREAM} [data-feed-post-id]`).count()).toBe(40);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);

    const after = await streamState(authedPage);
    expect(before.contextFamilies).toEqual([...INITIAL_CONTEXT_FAMILIES]);
    expect(before.modulePositions).toEqual([4, 10]);
    expect(after.contextFamilies).toEqual([...INITIAL_CONTEXT_FAMILIES]);
    expect(after.modulePositions).toEqual([4, 10]);
    expect(after.postIds.slice(0, before.postIds.length)).toEqual(before.postIds);
    expect(new Set(after.postIds).size).toBe(after.postIds.length);
    expect(feed.cursors()).toEqual([null, "r2b-page-2"]);
  });

  test("le bouton Charger plus reste un fallback manuel réel", async ({ authedPage }) => {
    await authedPage.addInitScript(() => {
      class DormantIntersectionObserver {
        readonly root = null;
        readonly rootMargin = "0px";
        readonly thresholds: number[] = [];

        constructor() {}

        disconnect() {}
        observe() {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
        unobserve() {}
      }

      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: DormantIntersectionObserver,
      });
    });
    const feed = await stubLongFeed(authedPage);
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await waitForAsyncStreamSources(authedPage);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);
    await expect.poll(() => feed.calls()).toBe(1);

    const loadMore = authedPage.getByRole("button", { name: "Charger plus", exact: true });
    await expect(loadMore).toBeVisible();
    await loadMore.click();

    await expect.poll(() => feed.calls()).toBe(2);
    await expect.poll(() => authedPage.locator(`${STREAM} [data-feed-post-id]`).count()).toBe(40);
    expect(feed.cursors()).toEqual([null, "r2b-page-2"]);
    const after = await streamState(authedPage);
    expect(new Set(after.postIds).size).toBe(after.postIds.length);
  });

  /**
   * Franchir la borne ne duplique ni le fetch ni la cadence.
   *
   * Ce test basculait aussi des onglets « Récent » / « Populaire ». Mesuré :
   * aucun `role="tab"` n'existe sur /feed, à aucune largeur — DÉCISION
   * PRODUIT : ne pas les construire pour un test. Ce qui restait prouvable est
   * conservé et renforcé : traverser la borne du palier ne relance aucun
   * appel, laisse la cadence du flux INTACTE, et ne fait varier que le rendu.
   */
  test("franchir la borne ne duplique ni le fetch ni la cadence", async ({ authedPage }) => {
    const feed = await stubLongFeed(authedPage);
    let localVideoRequests = 0;

    authedPage.on("request", (request) => {
      if (
        request.method() === "GET" &&
        new URL(request.url()).pathname === "/api/v1/local-videos/feed"
      ) {
        localVideoRequests += 1;
      }
    });

    const sousLaBorne = DESKTOP_MIN_WIDTH - 1;
    await gotoFeed(authedPage, { width: 375, height: 900 });
    await waitForAsyncStreamSources(authedPage);
    await waitForCadenceInDom(authedPage, CADENCE_FAMILIES);
    await waitForContextModules(authedPage, CADENCE_FAMILIES);
    await expect.poll(() => feed.calls()).toBe(1);

    const avant = await streamState(authedPage);
    expect(avant.contextFamiliesVisibles).toEqual([...CADENCE_FAMILIES]);

    // Juste sous la borne : rien ne change encore.
    await authedPage.setViewportSize({ width: sousLaBorne, height: 900 });
    await waitForContextModules(authedPage, CADENCE_FAMILIES);
    expect(feed.calls(), "un resize a relance le fetch").toBe(1);

    // Au-dela : le flux est le MEME, seul le rendu masque les modules.
    await authedPage.setViewportSize({ width: 1536, height: 900 });
    await expect
      .poll(async () => (await streamState(authedPage)).contextFamiliesVisibles.length, {
        timeout: 15_000,
      })
      .toBe(0);

    const apres = await streamState(authedPage);
    expect(apres.contextFamilies, "la cadence du flux a change au franchissement").toEqual(
      avant.contextFamilies,
    );
    expect(apres.modulePositions, "les rangs de cadence ont change").toEqual(
      avant.modulePositions,
    );
    expect(apres.postIds, "les publications ont change").toEqual(avant.postIds);
    expect(apres.videos).toBe(1);
    expect(
      apres.focusablesDansModulesMasques,
      "un module masque laisse un controle atteignable au clavier",
    ).toBe(0);

    expect(feed.calls(), "franchir la borne a relance le fetch").toBe(1);
    expect(
      localVideoRequests,
      `attendu 1 appel a /api/v1/local-videos/feed, obtenu ${localVideoRequests}`,
    ).toBe(1);
  });
});
