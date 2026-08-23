/**
 * C3-FEED-M4 — ossature éditoriale du Feed medium (640 → 1279,98 px).
 *
 * Avant ce ticket, le rythme vertical n'avait aucune source unique : mesuré aux
 * cinq viewports, l'écart entre grandes surfaces prenait 3 à 4 valeurs
 * concurrentes (16 / 20 / 24 / 32 px), issues de `mt-5` portés par les enfants,
 * d'un `space-y-5 lg:space-y-6` sur la liste et d'un `space-y-4` sur les blocs
 * locaux. Aucune identité de région n'existait non plus.
 *
 * Cette spec verrouille les cinq régions, leur ordre, et le fait que la grille
 * soit l'unique propriétaire de l'espacement entre elles.
 */
import type { Page } from "@playwright/test";

import { FEED_MEDIUM_REGIONS } from "@/lib/layout/feed-medium-regions";
import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "834x1112", width: 834, height: 1112 },
  { label: "1024x900", width: 1024, height: 900 },
  { label: "1279x900", width: 1279, height: 900 },
] as const;

const GRID = ".feed-medium-editorial-grid";
const REGION = "[data-feed-medium-region]";
const PRIMARY = '[data-feed-medium-surface="primary"]';

function visible(page: Page, selector: string) {
  return page.locator(selector).filter({ visible: true });
}

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  // `test.use({ viewport })` est inopérant : le contexte authentifié est
  // worker-scoped (budget de session R1M), la page en hérite.
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
}

/**
 * Les quatre blocs locaux de la région `context` sont montés paresseusement.
 * On atteint le bas puis on remonte, en attendant l'état réel du DOM — ni pause
 * ni retry d'assertion.
 */
async function mountContext(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document.querySelectorAll(
            '[data-feed-medium-region="context"] [data-feed-medium-surface="primary"]',
          ).length,
      ),
    )
    .toBe(4);
  await page.evaluate(() => window.scrollTo(0, 0));
}

test.describe("C3-FEED-M4 — grille éditoriale du Feed medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — grille unique, cinq régions, ordre et pleine largeur`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      await mountContext(authedPage);

      await expect(visible(authedPage, GRID), "grille éditoriale absente ou dupliquée").toHaveCount(
        1,
      );

      const m = await authedPage.evaluate(
        ({ gridSel, regionSel }) => {
          const grid = document.querySelector(gridSel)!;
          const cs = getComputedStyle(grid as HTMLElement);
          const regions = [...grid.querySelectorAll(regionSel)];
          const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
          const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
          const scroll = window.scrollY;
          const boites = regions.map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top + scroll, bottom: r.bottom + scroll, left: r.left, right: r.right };
          });
          return {
            display: cs.display,
            colonnes: cs.gridTemplateColumns.split(" ").length,
            maxWidth: cs.maxWidth,
            noms: regions.map((el) => el.getAttribute("data-feed-medium-region")),
            gaps: boites.slice(1).map((b, i) => Math.round(b.top - boites[i]!.bottom)),
            gauches: boites.map((b) => b.left - rail.right),
            droites: boites.map((b) => shell.right - b.right),
            railRight: rail.right,
            overflow:
              document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          };
        },
        { gridSel: GRID, regionSel: REGION },
      );

      // Une seule voie éditoriale : aucun aside droit inventé ici.
      expect(m.display, "la grille n'est pas une grille").toBe("grid");
      expect(m.colonnes, "seconde colonne inattendue").toBe(1);
      expect(m.maxWidth, "largeur maximale réductrice").toBe("none");

      // Cinq régions exactes, sans doublon, dans l'ordre éditorial.
      expect(m.noms, "régions ou ordre incorrects").toEqual([...FEED_MEDIUM_REGIONS]);
      expect(new Set(m.noms).size, "région dupliquée").toBe(FEED_MEDIUM_REGIONS.length);

      // Chaque région occupe toute la zone : axes M3.2 préservés.
      expect(Math.max(...m.gauches.map(Math.abs)), "région hors axe gauche").toBeLessThanOrEqual(1);
      expect(Math.max(...m.droites.map(Math.abs)), "région hors axe droit").toBeLessThanOrEqual(1);
      expect(Math.min(...m.gauches), "région passant sous le rail").toBeGreaterThanOrEqual(-1);
      expect(m.overflow, "débordement horizontal").toBe(true);

      // Source unique du rythme : un seul écart, à ±1 px près.
      const distincts = [...new Set(m.gaps)];
      expect(
        Math.max(...m.gaps) - Math.min(...m.gaps),
        `écarts inter-régions hétérogènes : ${m.gaps.join(", ")}`,
      ).toBeLessThanOrEqual(1);
      expect(distincts.length, `valeurs de gap concurrentes : ${distincts.join("/")}`).toBeLessThanOrEqual(2);
    });

    test(`${vp.label} — aucun double espacement parent/enfant sur les régions`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      await mountContext(authedPage);

      const marges = await authedPage.evaluate(
        ({ gridSel, regionSel }) => {
          const grid = document.querySelector(gridSel)!;
          return [...grid.querySelectorAll(regionSel)].map((el) => {
            const cs = getComputedStyle(el as HTMLElement);
            return {
              nom: el.getAttribute("data-feed-medium-region"),
              haut: parseFloat(cs.marginTop) || 0,
              bas: parseFloat(cs.marginBottom) || 0,
            };
          });
        },
        { gridSel: GRID, regionSel: REGION },
      );

      for (const region of marges) {
        expect(region.haut, `marge supérieure résiduelle sur « ${region.nom} »`).toBe(0);
        expect(region.bas, `marge inférieure résiduelle sur « ${region.nom} »`).toBe(0);
      }
    });

    test(`${vp.label} — les surfaces primaires restent plates et alignées`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      await mountContext(authedPage);

      const m = await authedPage.evaluate(
        ({ gridSel, primarySel }) => {
          const grid = document.querySelector(gridSel)!;
          const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
          const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
          const surfaces = [...grid.querySelectorAll(primarySel)].filter(
            (el) => el.getBoundingClientRect().width > 0,
          );
          return {
            n: surfaces.length,
            rayons: surfaces.map(
              (el) => parseFloat(getComputedStyle(el as HTMLElement).borderTopLeftRadius) || 0,
            ),
            ombres: surfaces.map((el) => getComputedStyle(el as HTMLElement).boxShadow),
            largeurs: surfaces.map((el) => Math.round(el.getBoundingClientRect().width)),
            axes: surfaces.every((el) => {
              const r = el.getBoundingClientRect();
              return Math.abs(r.left - rail.right) <= 1 && Math.abs(r.right - shell.right) <= 1;
            }),
          };
        },
        { gridSel: GRID, primarySel: PRIMARY },
      );

      expect(m.n, "surfaces primaires de la baseline").toBe(10);
      expect(Math.max(...m.rayons), "rayon réintroduit par la grille").toBeLessThanOrEqual(2);
      expect(m.ombres.every((o) => o === "none"), "ombre réintroduite par la grille").toBe(true);
      expect(new Set(m.largeurs).size, `largeurs hétérogènes : ${m.largeurs.join("/")}`).toBe(1);
      expect(m.axes, "surface hors axes après mise en grille").toBe(true);
    });
  }

  // ── Lazy mounting de la région context ─────────────────────────────────────
  test("768 — le montage paresseux ne duplique ni ne réordonne les régions", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const avant = await authedPage.evaluate(
      ({ gridSel, regionSel }) => {
        const grid = document.querySelector(gridSel)!;
        const regions = [...grid.querySelectorAll(regionSel)];
        return {
          noms: regions.map((el) => el.getAttribute("data-feed-medium-region")),
          contextes: regions.filter(
            (el) => el.getAttribute("data-feed-medium-region") === "context",
          ).length,
          surfacesContext: grid.querySelectorAll(
            '[data-feed-medium-region="context"] [data-feed-medium-surface="primary"]',
          ).length,
          largeur: Math.round(grid.getBoundingClientRect().width),
        };
      },
      { gridSel: GRID, regionSel: REGION },
    );

    expect(avant.contextes, "région context dupliquée avant montage").toBe(1);
    expect(avant.noms, "ordre des régions avant montage").toEqual([...FEED_MEDIUM_REGIONS]);

    await mountContext(authedPage);

    const apres = await authedPage.evaluate(
      ({ gridSel, regionSel }) => {
        const grid = document.querySelector(gridSel)!;
        const regions = [...grid.querySelectorAll(regionSel)];
        const surfaces = [
          ...grid.querySelectorAll(
            '[data-feed-medium-region="context"] [data-feed-medium-surface="primary"]',
          ),
        ];
        const boites = regions.map((el) => el.getBoundingClientRect());
        return {
          noms: regions.map((el) => el.getAttribute("data-feed-medium-region")),
          contextes: regions.filter(
            (el) => el.getAttribute("data-feed-medium-region") === "context",
          ).length,
          surfacesContext: surfaces.length,
          rondes: surfaces.filter((el) => {
            const cs = getComputedStyle(el as HTMLElement);
            return (parseFloat(cs.borderTopLeftRadius) || 0) > 2 || cs.boxShadow !== "none";
          }).length,
          largeur: Math.round(grid.getBoundingClientRect().width),
          chevauchement: boites.some((b, i) => i > 0 && b.top < boites[i - 1]!.bottom - 1),
          headerSticky: !!document.querySelector(".feed-medium-header"),
        };
      },
      { gridSel: GRID, regionSel: REGION },
    );

    expect(apres.contextes, "région context dupliquée après montage").toBe(1);
    expect(apres.surfacesContext, "blocs locaux montés").toBe(4);
    expect(apres.noms, "ordre altéré par le montage").toEqual([...FEED_MEDIUM_REGIONS]);
    expect(apres.rondes, "rayon ou ombre réintroduits au montage").toBe(0);
    expect(apres.largeur, "colonne élargie par le montage").toBe(avant.largeur);
    expect(apres.chevauchement, "chevauchement de régions après montage").toBe(false);
    expect(apres.headerSticky, "header sticky perdu").toBe(true);
  });

  // ── État filtré alternatif ─────────────────────────────────────────────────
  test("768 — l'état filtré reste dans la même région stream", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountContext(authedPage);
    const filtre = authedPage.locator("[data-feed-medium-header-filter]");

    const lire = async () =>
      authedPage.evaluate(
        ({ gridSel, regionSel }) => {
          const grid = document.querySelector(gridSel)!;
          const regions = [...grid.querySelectorAll(regionSel)];
          const stream = grid.querySelector('[data-feed-medium-region="stream"]');
          return {
            noms: regions.map((el) => el.getAttribute("data-feed-medium-region")),
            streams: regions.filter(
              (el) => el.getAttribute("data-feed-medium-region") === "stream",
            ).length,
            streamLeft: stream ? Math.round(stream.getBoundingClientRect().left) : -1,
            streamWidth: stream ? Math.round(stream.getBoundingClientRect().width) : -1,
          };
        },
        { gridSel: GRID, regionSel: REGION },
      );

    const avant = await lire();
    expect(avant.streams).toBe(1);

    await filtre.click();
    await expect(filtre).toHaveAttribute("aria-expanded", "true");

    const pendant = await lire();
    expect(pendant.streams, "double région stream en état filtré").toBe(1);
    expect(pendant.noms, "context n'est plus après stream").toEqual([...FEED_MEDIUM_REGIONS]);
    expect(pendant.streamLeft, "saut horizontal du stream").toBe(avant.streamLeft);
    expect(pendant.streamWidth, "largeur du stream modifiée").toBe(avant.streamWidth);

    await filtre.click();
    await expect(filtre, "le filtre ne se désactive plus").toHaveAttribute("aria-expanded", "false");
    expect((await lire()).noms).toEqual([...FEED_MEDIUM_REGIONS]);
  });

  // ── Accessibilité : ordre visuel = ordre DOM ───────────────────────────────
  test("768 — l'ordre visuel suit l'ordre du DOM", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountContext(authedPage);

    const a11y = await authedPage.evaluate(
      ({ gridSel, regionSel }) => {
        const grid = document.querySelector(gridSel)!;
        const regions = [...grid.querySelectorAll(regionSel)];
        const scroll = window.scrollY;
        const tops = regions.map((el) => el.getBoundingClientRect().top + scroll);
        return {
          croissant: tops.every((t, i) => i === 0 || t >= tops[i - 1]!),
          ordresCss: regions.map((el) => getComputedStyle(el as HTMLElement).order),
          regionsSansNom: regions.filter(
            (el) => el.getAttribute("role") === "region" && !el.getAttribute("aria-label"),
          ).length,
        };
      },
      { gridSel: GRID, regionSel: REGION },
    );

    expect(a11y.croissant, "ordre visuel différent de l'ordre DOM").toBe(true);
    expect(
      a11y.ordresCss.every((o) => o === "0" || o === "normal"),
      `order CSS contredisant le DOM : ${a11y.ordresCss.join("/")}`,
    ).toBe(true);
    expect(a11y.regionsSansNom, "role=region sans nom accessible").toBe(0);
  });

  // ── Frontières ─────────────────────────────────────────────────────────────
  test("frontière 639/640 — grille absente puis présente", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 639, height: 900 });
    expect(
      await authedPage.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel)!).display,
        GRID,
      ),
      "639 : la grille medium s'applique au mobile",
    ).not.toBe("grid");

    await gotoFeed(authedPage, { width: 640, height: 900 });
    expect(
      await authedPage.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel)!).display,
        GRID,
      ),
      "640 : grille medium attendue",
    ).toBe("grid");
  });

  test("frontière 1279/1280 — grille présente puis absente", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    expect(
      await authedPage.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel)!).display,
        GRID,
      ),
    ).toBe("grid");

    await gotoFeed(authedPage, { width: 1280, height: 900 });
    expect(
      await authedPage.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel)!).display,
        GRID,
      ),
      "1280 : la grille medium fuit sur le desktop",
    ).not.toBe("grid");
  });

  // ── Isolation des autres routes ────────────────────────────────────────────
  for (const route of [
    "/videos",
    "/map",
    "/sortir",
    "/search",
    "/tribes",
    "/passport",
    "/subscriptions",
  ]) {
    test(`768 — ${route} ne rend pas la grille éditoriale Feed`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await authedPage.waitForLoadState("domcontentloaded");
      await expect(
        visible(authedPage, GRID),
        `${route} : la grille éditoriale Feed a fuité`,
      ).toHaveCount(0);
      await expect(visible(authedPage, REGION), `${route} : région Feed rendue`).toHaveCount(0);
    });
  }

  test("768 — contrat R2 : quatre régions visibles, la vidéo vit dans le stream", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountContext(authedPage);

    const m = await authedPage.evaluate((regionSel) => {
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      const regions = [...document.querySelectorAll(regionSel)].filter(visible);
      const boites = regions.map((el) => el.getBoundingClientRect());
      const stream = document.querySelector('[data-feed-medium-region="stream"]')!;
      const liste = stream.querySelector("[data-feed-stream-list]");
      return {
        noms: regions.map((el) => el.getAttribute("data-feed-medium-region")),
        gaps: boites.slice(1).map((b, i) => Math.round(b.top - boites[i]!.bottom)),
        // Ordre DOM == ordre visuel : chaque région commence après la précédente.
        ordreCoherent: boites.every((b, i) => i === 0 || b.top >= boites[i - 1]!.top - 1),
        // La vidéo est bien un contenu contractuel du stream.
        videoDansStream: stream.querySelectorAll('[data-feed-stream-item="local-video"]').length,
        postsDansStream: stream.querySelectorAll('[data-feed-stream-item="post"]').length,
        listeUnique: liste !== null && document.querySelectorAll("[data-feed-stream-list]").length,
        // Le wrapper desktop masqué ne revendique aucune identité de région.
        discoveryResiduel: document.querySelectorAll('[data-feed-medium-region="discovery"]').length,
        wrapperDesktopVisible: [...document.querySelectorAll("[data-feed-desktop-video-section]")]
          .filter(visible).length,
      };
    }, REGION);

    expect(m.noms, "régions medium visibles").toEqual([
      "stories",
      "composer",
      "stream",
      "context",
    ]);
    expect(m.gaps.length, "nombre d'écarts inter-régions").toBe(3);
    expect(m.gaps, "les trois écarts inter-régions ne valent pas 20 px").toEqual([20, 20, 20]);
    expect(m.ordreCoherent, "ordre visuel différent de l'ordre DOM").toBe(true);
    expect(m.videoDansStream, "publication vidéo absente ou dupliquée dans le stream").toBe(1);
    expect(m.postsDansStream, "publications du stream").toBe(3);
    expect(m.listeUnique, "conteneur de stream absent ou dupliqué").toBe(1);
    expect(
      m.discoveryResiduel,
      "un élément revendique encore l'identité de région `discovery`",
    ).toBe(0);
    expect(m.wrapperDesktopVisible, "section vidéo desktop visible en medium").toBe(0);
  });
});
