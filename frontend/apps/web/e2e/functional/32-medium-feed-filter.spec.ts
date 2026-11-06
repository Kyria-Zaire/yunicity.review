/**
 * C3-FEED-M10 — expérience de filtre Feed medium (640 → 1023,98).
 *
 * Contrat réel : unique dimension « centres d'intérêt du profil », application
 * immédiate à l'ouverture de la Sheet, réinitialisation explicite.
 *
 * ── Borne haute ──────────────────────────────────────────────────────────────
 * Cette spec visait 1279,98 px, borne d'AVANT R4B. `feed-breakpoints.ts` fait
 * foi : `FEED_VIEWPORT_MEDIUM_MAX_PX = 1023` et `FEED_VIEWPORT_DESKTOP_MIN_PX
 * = 1024` — « la frontière Desktop passe de 1280 à 1024 ». Le header medium
 * qui PORTE le filtre est borné à la même valeur dans `globals.css` : « le
 * desktop >= 1024 conserve son propre header ».
 *
 * Au-delà de la borne, le filtre n'est donc pas une perte : c'est le palier
 * suivant. Les largeurs 1024 → 1280 restent mesurées, mais sur la règle vraie
 * — header desktop présent, header medium absent — plutôt que supprimées.
 */
import type { Page } from "@playwright/test";

import { FEED_CONTEXT_SLOT_POSITIONS } from "@/lib/feed/feed-context-stream";
import {
  FEED_VIEWPORT_DESKTOP_MIN_PX,
  FEED_VIEWPORT_MEDIUM_MAX_PX,
} from "@/lib/layout/feed-breakpoints";
import {
  FEED_MEDIUM_FILTER_CRITERION_IDS,
  FEED_MEDIUM_FILTER_PANEL_TITLE,
} from "@/lib/layout/feed-medium-filter-contract";
import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "834x1112", width: 834, height: 1112 },
  { label: `${FEED_VIEWPORT_MEDIUM_MAX_PX}x900`, width: FEED_VIEWPORT_MEDIUM_MAX_PX, height: 900 },
] as const;

/** Largeurs du palier suivant — le filtre M10 n'y appartient pas. */
const AU_DELA_DU_PALIER = [
  { label: `${FEED_VIEWPORT_DESKTOP_MIN_PX}x900`, width: FEED_VIEWPORT_DESKTOP_MIN_PX, height: 900 },
  { label: "1279x900", width: 1279, height: 900 },
  { label: "1280x900", width: 1280, height: 900 },
] as const;

const FILTER = "[data-feed-medium-header-filter]";
const PANEL = "[data-feed-medium-filter-panel]";
const RESET = "[data-feed-medium-filter-reset]";
const LIST = "[data-feed-stream-list]";
/** Header du palier medium — hôte du filtre. */
const HEADER_MEDIUM = ".feed-medium-header";
/** Header du palier suivant — celui que le desktop conserve (cf. spec 12). */
const HEADER_DESKTOP = "header.citizen-top-nav";

async function gotoFeed(page: Page, size: { width: number; height: number }) {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
}

async function openFilter(page: Page) {
  const btn = page.locator(FILTER);
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(PANEL)).toBeVisible();
}

test.describe("C3-FEED-M10 — filtre Feed medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — déclencheur unique, surface unique, critère réel`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      const btn = authedPage.locator(FILTER);
      await expect(btn).toHaveCount(1);
      const box = await btn.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      await expect(btn).toHaveAccessibleName(/filtrer/i);

      await openFilter(authedPage);
      await expect(authedPage.getByRole("dialog", { name: FEED_MEDIUM_FILTER_PANEL_TITLE })).toHaveCount(
        1,
      );
      await expect(
        authedPage.locator(`[data-feed-medium-filter-criterion="${FEED_MEDIUM_FILTER_CRITERION_IDS[0]}"]`),
      ).toHaveCount(1);
      await expect(authedPage.locator("[data-feed-medium-filter-interest]")).toHaveCount(1);
      await expect(authedPage.locator("[data-feed-medium-filter-interest]")).toHaveAttribute(
        "data-feed-medium-filter-interest",
        "culture",
      );
      await expect(authedPage.locator(PANEL)).toContainText(/vidéo locale/i);
      expect(
        await authedPage.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
    });
  }

  for (const vp of AU_DELA_DU_PALIER) {
    test(`${vp.label} — palier suivant : header desktop, pas de filtre medium`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);

      // Le header medium n'est pas « perdu » : il est borné. Son successeur
      // doit donc être là — sans quoi la largeur n'aurait aucun header.
      await expect(
        authedPage.locator(HEADER_DESKTOP).filter({ visible: true }),
        "header du palier suivant absent",
      ).toHaveCount(1);
      await expect(
        authedPage.locator(HEADER_MEDIUM).filter({ visible: true }),
        "header medium débordant sur le palier suivant",
      ).toHaveCount(0);

      // Le filtre vit DANS le header medium : il suit sa borne, et sa Sheet
      // ne doit subsister nulle part.
      await expect(authedPage.locator(FILTER).filter({ visible: true })).toHaveCount(0);
      await expect(authedPage.locator(PANEL)).toHaveCount(0);

      expect(
        await authedPage.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
        "débordement horizontal",
      ).toBe(true);
    });
  }

  test("768 — activation, réinitialisation, stream unique", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const avant = await authedPage.evaluate((sel) => ({
      lists: document.querySelectorAll(sel).length,
      posts: document.querySelectorAll(`${sel} [data-feed-stream-item="post"]`).length,
      videos: document.querySelectorAll(`${sel} [data-feed-stream-item="local-video"]`).length,
    }), LIST);

    await openFilter(authedPage);
    const btn = authedPage.locator(FILTER);
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await expect(btn).toHaveAttribute("data-feed-medium-filter-active", "");
    await expect(authedPage.locator("[data-feed-medium-filter-status]")).toContainText(/filtre actif/i);

    await authedPage.locator(RESET).click();
    await expect(authedPage.locator(PANEL)).toHaveCount(0);
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(btn).toHaveAttribute("aria-pressed", "false");

    const apres = await authedPage.evaluate((sel) => ({
      lists: document.querySelectorAll(sel).length,
      posts: document.querySelectorAll(`${sel} [data-feed-stream-item="post"]`).length,
      videos: document.querySelectorAll(`${sel} [data-feed-stream-item="local-video"]`).length,
    }), LIST);
    expect(apres.lists).toBe(1);
    expect(apres.lists).toBe(avant.lists);
    expect(apres.videos).toBe(avant.videos);
    expect(apres.posts).toBe(avant.posts);
  });

  test("768 — Escape et restitution du focus", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await openFilter(authedPage);
    await authedPage.keyboard.press("Escape");
    await expect(authedPage.locator(PANEL)).toHaveCount(0);
    await expect(authedPage.locator(FILTER)).toBeFocused();
    // Fermer ne désactive pas (contrat immédiat + Fermer).
    await expect(authedPage.locator(FILTER)).toHaveAttribute("aria-pressed", "true");
  });

  /**
   * Fermer le panneau ne casse pas le stream.
   *
   * Ce test pilotait sa preuve par des onglets « Récent » / « Pour vous ».
   * Mesuré : aucun `role="tab"`, aucun `role="tablist"` et aucune affordance
   * « Récent » n'existe sur /feed, à aucune largeur — la seule affordance de
   * vue est un bouton du rail gauche, invisible à 768. DÉCISION PRODUIT : ne
   * pas construire ces onglets pour satisfaire un test. L'attente périmée part,
   * et ce qui est réellement prouvable reste : le panneau se ferme, le stream
   * demeure unique et garde ses entrées enrichies.
   *
   * Aucun filtre fonctionnel n'est retiré : le critère M10 et sa
   * réinitialisation sont exercés ici même.
   */
  test("768 — fermer le panneau ne casse pas le stream", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const avant = await authedPage.evaluate((sel) => ({
      videos: document.querySelectorAll(`${sel} [data-feed-stream-item="local-video"]`).length,
      modules: document.querySelectorAll(`${sel} [data-feed-stream-item="context-module"]`).length,
    }), LIST);

    await openFilter(authedPage);
    await authedPage.locator(RESET).click();
    await expect(authedPage.locator(PANEL)).toHaveCount(0);

    await expect(authedPage.locator(LIST)).toHaveCount(1);
    const apres = await authedPage.evaluate((sel) => ({
      videos: document.querySelectorAll(`${sel} [data-feed-stream-item="local-video"]`).length,
      modules: document.querySelectorAll(`${sel} [data-feed-stream-item="context-module"]`).length,
    }), LIST);
    expect(apres, "le stream a changé en fermant le panneau").toEqual(avant);
  });

  test("768 — le filtre préserve le flux enrichi unique", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const streamList = authedPage.locator(LIST);

    // Await pour vous stream: should have video + context asynchronously
    await expect(
      streamList.locator('[data-feed-stream-item="local-video"]'),
      "attendu: vidéo locale dans le stream",
    ).toHaveCount(1, { timeout: 15_000 });

    await expect(
      streamList.locator(
        ':scope > li[data-feed-stream-item="context-module"][data-feed-context-module="must-see"]',
      ),
      "attendu: module must-see atteignable",
    ).toHaveCount(1, { timeout: 15_000 });

    /*
     * L'attente etait « exactement 5 items (post, local-video, post, post,
     * context-module) » : un total FIGE, couple a un seed de trois
     * publications. Mesure : douze items — neuf publications, la video, et les
     * deux modules de la cadence. Figer un total casse des que le seed bouge et
     * ne prouve rien de la structure.
     *
     * On asserte donc la STRUCTURE, derivee du contrat de cadence :
     * video au rang editorial, modules aux rangs dus, publications uniques.
     */
    const initialKinds = await streamList.locator(":scope > li").evaluateAll((items) =>
      items.map((el) => ({
        kind: el.getAttribute("data-feed-stream-item"),
        family: el.getAttribute("data-feed-context-module"),
      })),
    );

    const contenusReels = initialKinds.filter((item) => item.kind !== "context-module").length;
    const rangsAttendus = FEED_CONTEXT_SLOT_POSITIONS.filter(
      (rang) => rang <= contenusReels,
    );
    const rangsMesures: number[] = [];
    let reels = 0;
    for (const item of initialKinds) {
      if (item.kind === "context-module") rangsMesures.push(reels);
      else reels += 1;
    }

    expect(initialKinds.filter((i) => i.kind === "local-video"), "video dupliquee").toHaveLength(1);
    expect(initialKinds.findIndex((i) => i.kind === "local-video"), "video hors rang").toBe(1);
    expect(rangsMesures, "modules hors des rangs de la cadence").toEqual([...rangsAttendus]);
    expect(
      initialKinds.filter((i) => i.kind === "context-module")[0]?.family,
      "premiere famille de la cadence",
    ).toBe("must-see");

    // Verify post ID uniqueness at baseline
    const initialPostIds = await streamList
      .locator(":scope > li[data-feed-stream-item='post']")
      .evaluateAll((posts) => {
        const ids: string[] = [];
        for (const post of posts) {
          const id = post.getAttribute("data-feed-post-id");
          if (typeof id !== "string") {
            throw new Error("post missing data-feed-post-id attribute");
          }
          const trimmed = id.trim();
          if (trimmed.length === 0) {
            throw new Error(`post has empty data-feed-post-id: "${id}"`);
          }
          ids.push(id);
        }
        if (ids.length === 0) {
          throw new Error("aucune publication dans le flux");
        }
        const uniqueIds = new Set(ids);
        if (uniqueIds.size !== ids.length) {
          const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
          throw new Error(
            `duplicate post IDs detected (expected all unique): ${duplicates.join(", ")}`,
          );
        }
        return ids;
      });
    // Nombre de publications = ce que l'API sert, pas une constante de seed.
    expect(initialPostIds.length, "aucune publication").toBeGreaterThan(0);

    // Verify context module structure and visibility
    const contextModule = streamList.locator(
      ':scope > li[data-feed-stream-item="context-module"][data-feed-context-module="must-see"]',
    );
    const section = contextModule.locator(":scope > section").first();
    await expect(section, "contexte: une section").toHaveCount(1);

    const contextState = await contextModule.evaluate((el) => {
      const section = el.querySelector(":scope > section");
      if (!section) return { valid: false, reason: "pas de section" };

      const heading = section.querySelector("h2");
      const headingText = heading?.textContent?.trim() ?? "";

      const ctaLink = section.querySelector('a[href="/sortir"]');
      const ctaText = ctaLink?.textContent?.trim() ?? "";

      const rect = section.getBoundingClientRect();

      const isVisible = (node: Element | null) => {
        if (!node || !(node instanceof HTMLElement)) return false;
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (node.hasAttribute("hidden") || node.hasAttribute("inert")) return false;
        return rect.width > 0 && rect.height > 0;
      };

      return {
        valid: true,
        headingText,
        hasHeading: headingText.length > 0,
        hasCtaLink: ctaText.length > 0,
        ctaHref: ctaLink instanceof HTMLAnchorElement ? ctaLink.getAttribute("href") : null,
        sectionVisible: isVisible(section),
        sectionWidth: rect.width,
        sectionHeight: rect.height,
      };
    });

    expect(contextState.valid).toBe(true);
    expect(contextState.headingText).toContain("À ne pas manquer");
    expect(contextState.hasCtaLink).toBe(true);
    expect(contextState.ctaHref).toBe("/sortir");
    expect(contextState.sectionVisible).toBe(true);
    expect(contextState.sectionWidth).toBeGreaterThan(0);
    expect(contextState.sectionHeight).toBeGreaterThan(0);

    // Filter activation: open, reset, verify stream unchanged
    await openFilter(authedPage);
    await expect(authedPage.locator(PANEL)).toBeVisible();
    await authedPage.locator(RESET).click();
    await expect(authedPage.locator(PANEL)).toHaveCount(0);

    const afterReset = await streamList.locator(":scope > li").evaluateAll((items) =>
      items.map((el) => ({
        kind: el.getAttribute("data-feed-stream-item"),
        family: el.getAttribute("data-feed-context-module"),
      })),
    );
    expect(afterReset).toEqual(initialKinds);

    /*
     * Suivaient trois bascules d'onglets « Récent » / « Populaire » / « Pour
     * vous ». Aucune de ces affordances n'existe dans le produit (mesuré :
     * zéro `role="tab"` sur /feed) et la décision est de ne pas les construire
     * pour un test. Le flux enrichi, son ordre, l'unicité des publications et
     * la restitution après réinitialisation restent prouvés ci-dessus.
     */

    const restored = await streamList.locator(":scope > li").evaluateAll((items) =>
      items.map((el) => ({
        kind: el.getAttribute("data-feed-stream-item"),
        family: el.getAttribute("data-feed-context-module"),
      })),
    );
    expect(restored).toEqual(initialKinds);

    // Verify post ID restoration after tab transitions
    const restoredPostIds = await streamList
      .locator(":scope > li[data-feed-stream-item='post']")
      .evaluateAll((posts) => {
        const ids: string[] = [];
        for (const post of posts) {
          const id = post.getAttribute("data-feed-post-id");
          if (typeof id !== "string") {
            throw new Error("post missing data-feed-post-id attribute after restoration");
          }
          const trimmed = id.trim();
          if (trimmed.length === 0) {
            throw new Error(`post has empty data-feed-post-id after restoration: "${id}"`);
          }
          ids.push(id);
        }
        if (ids.length === 0) {
          throw new Error("aucune publication apres restitution");
        }
        const uniqueIds = new Set(ids);
        if (uniqueIds.size !== ids.length) {
          const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
          throw new Error(
            `duplicate post IDs detected after restoration (expected all unique): ${duplicates.join(", ")}`,
          );
        }
        return ids;
      });
    // Invariant reel : la reinitialisation restitue EXACTEMENT la meme liste —
    // l'egalite couvre deja la longueur, sans figer de constante de seed.
    expect(restoredPostIds, "liste restituee differente").toEqual(initialPostIds);
  });

  test("bascule 639 / 640 — mobile intact puis filtre medium", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 639, height: 900 });
    await expect(authedPage.locator(FILTER).filter({ visible: true })).toHaveCount(0);
    await expect(authedPage.locator(PANEL)).toHaveCount(0);

    await authedPage.setViewportSize({ width: 640, height: 900 });
    await expect(authedPage.locator(FILTER).filter({ visible: true })).toHaveCount(1);
    await openFilter(authedPage);
  });

  test(`bascule ${FEED_VIEWPORT_MEDIUM_MAX_PX} / ${FEED_VIEWPORT_DESKTOP_MIN_PX} — palier suivant hors Sheet M10`, async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: FEED_VIEWPORT_MEDIUM_MAX_PX, height: 900 });
    await openFilter(authedPage);
    await expect(authedPage.locator(PANEL)).toBeVisible();
    await authedPage.keyboard.press("Escape");

    await authedPage.setViewportSize({ width: FEED_VIEWPORT_DESKTOP_MIN_PX, height: 900 });

    // Franchir la borne remplace un header par l'autre — ce n'est pas une
    // disparition du chrome.
    await expect(authedPage.locator(FILTER).filter({ visible: true })).toHaveCount(0);
    await expect(authedPage.locator(PANEL)).toHaveCount(0);
    await expect(authedPage.locator(HEADER_MEDIUM).filter({ visible: true })).toHaveCount(0);
    await expect(
      authedPage.locator(HEADER_DESKTOP).filter({ visible: true }),
      "header du palier suivant absent après la bascule",
    ).toHaveCount(1);
  });

  for (const route of [
    "/videos",
    "/map",
    "/sortir",
    "/search",
    "/tribes",
    "/passport",
    "/subscriptions",
    "/stories",
  ]) {
    test(`768 — ${route} n'hérite pas du filtre Feed M10`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await expect(authedPage.locator("main").first()).toBeVisible();
      const fuite = await authedPage.evaluate(() => ({
        panel: document.querySelectorAll("[data-feed-medium-filter-panel]").length,
        criterion: document.querySelectorAll("[data-feed-medium-filter-criterion]").length,
        headerFilter: document.querySelectorAll("[data-feed-medium-header-filter]").length,
      }));
      expect(fuite.panel).toBe(0);
      expect(fuite.criterion).toBe(0);
      expect(fuite.headerFilter).toBe(0);
    });
  }
});
