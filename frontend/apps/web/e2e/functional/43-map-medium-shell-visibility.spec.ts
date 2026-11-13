/**
 * MAP-MEDIUM-SHELL-P0-19 — la carte doit rester VISIBLE dans la bande medium.
 *
 * ── Pourquoi cette spec existe ───────────────────────────────────────────────
 * La gate précédente validait la présence de `.gm-style` et d'un canvas, puis
 * l'absence de débordement horizontal. Elle passait au vert alors que, entre 640
 * et 1023,98 px, le rail citoyen occupait TOUTE la largeur (950×884) et poussait
 * `main` à y=900 : la carte était rendue à y=963 pour un viewport de 900, donc
 * intégralement hors écran, et `elementFromPoint` au centre renvoyait la
 * navigation. La présence dans le DOM ne prouve donc rien — cette spec mesure la
 * GÉOMÉTRIE et l'OCCLUSION.
 *
 * Cause : `globals.css` posait, dans la seule bande medium, un
 * `display: block !important` sur `.map-mobile-shell .web-three-col`. Or
 * `grid-template-columns` n'a aucun effet sur un bloc : la grille du rail
 * (`.web-three-col:has(> [data-citizen-medium-rail])`) était annulée.
 *
 * Aucune mutation, aucune publication, aucun upload.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const GRID = ".web-three-col";
const RAIL = "[data-citizen-medium-rail]";
const MAP = ".gm-style";

/** Bande medium : le rail est une colonne étroite, la carte occupe le reste. */
const LARGEURS_MEDIUM = [640, 768, 900, 950] as const;

/** Bornes : mobile plein cadre en dessous, layout desktop au-dessus. */
const LARGEURS_BORNES = [390, 639, 1279, 1280, 1440] as const;

const HAUTEUR = 900;

/** Le rail ne doit jamais devenir une bande pleine largeur. */
const RAIL_LARGEUR_MAX = 160;

/** Tolérance de défilement : le shell porte un `padding-bottom: 2rem` légitime. */
const SCROLL_TOLERANCE = 64;

type Mesure = {
  gridDisplay: string | null;
  railBox: Box | null;
  mainBox: Box | null;
  mapBox: Box | null;
  mapVisiblePct: number;
  mapCenterInsideMap: boolean;
  mapCenterTag: string;
  mapSurfaceRendue: boolean;
  scrollHeight: number;
  scrollWidth: number;
  viewport: { w: number; h: number };
};

type Box = { x: number; y: number; w: number; h: number };

async function mesurer(page: Page): Promise<Mesure> {
  return page.evaluate(
    ({ gridSel, railSel, mapSel }) => {
      const box = (el: Element | null): Box | null => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      };
      const grid = document.querySelector(gridSel);
      const map = document.querySelector(mapSel);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let mapVisiblePct = 0;
      let mapCenterInsideMap = false;
      let mapCenterTag = "aucun";
      if (map) {
        const r = map.getBoundingClientRect();
        const iw = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
        const ih = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        const aire = r.width * r.height;
        mapVisiblePct = aire > 0 ? Math.round(((iw * ih) / aire) * 100) : 0;

        const cx = Math.min(Math.max(r.x + r.width / 2, 1), vw - 1);
        const cy = Math.min(Math.max(r.y + r.height / 2, 1), vh - 1);
        const au = document.elementFromPoint(cx, cy);
        mapCenterInsideMap = !!au && map.contains(au);
        mapCenterTag = au
          ? `${au.tagName.toLowerCase()}.${String(au.className).split(" ")[0]}`
          : "aucun";
      }

      // Surface réellement peinte : canvas WebGL (vectoriel) OU tuiles raster.
      // Le rendu logiciel des navigateurs headless refuse le vectoriel et bascule
      // en raster : exiger un canvas rendrait la gate dépendante du GPU de l'hôte.
      const canvas = map ? map.querySelector("canvas") : null;
      const tuiles = map ? map.querySelectorAll('img[src*="maps.googleapis.com"]').length : 0;

      return {
        gridDisplay: grid ? getComputedStyle(grid).display : null,
        railBox: box(document.querySelector(railSel)),
        mainBox: box(document.querySelector(".web-main-column")),
        mapBox: box(map),
        mapVisiblePct,
        mapCenterInsideMap,
        mapCenterTag,
        mapSurfaceRendue: !!canvas || tuiles > 0,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        viewport: { w: vw, h: vh },
      };
    },
    { gridSel: GRID, railSel: RAIL, mapSel: MAP },
  );
}

async function allerSurLaCarte(page: Page, largeur: number): Promise<void> {
  await page.setViewportSize({ width: largeur, height: HAUTEUR });
  await page.goto("/map", { waitUntil: "domcontentloaded" });
  await page.locator(MAP).first().waitFor({ state: "attached", timeout: 30_000 });
  // La surface arrive APRES le conteneur : attendre la condition plutot qu'un delai
  // fixe, sinon l'assertion de peinture est une course (mesure : echec intermittent
  // a 768px avec 1,5 s d'attente).
  await page
    .waitForFunction(
      (sel) => {
        const map = document.querySelector(sel);
        if (!map) return false;
        return (
          !!map.querySelector("canvas") ||
          map.querySelectorAll('img[src*="maps.googleapis.com"]').length > 0
        );
      },
      MAP,
      { timeout: 30_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(500);
}

test.describe("MAP-MEDIUM-SHELL-P0-19 — carte visible dans la bande medium", () => {
  for (const largeur of LARGEURS_MEDIUM) {
    test(`${largeur} — la carte occupe la zone principale et n'est pas recouverte`, async ({ page }) => {
      await allerSurLaCarte(page, largeur);
      const m = await mesurer(page);

      expect(m.gridDisplay, "la grille du shell doit rester une grille").toBe("grid");

      expect(m.railBox, "rail citoyen absent").not.toBeNull();
      const rail = m.railBox!;
      expect(rail.w, `le rail occupe ${rail.w}px : il redevient une bande pleine largeur`).toBeLessThanOrEqual(
        RAIL_LARGEUR_MAX,
      );
      expect(rail.x, "le rail doit rester collé au bord gauche").toBeLessThanOrEqual(2);

      expect(m.mainBox, "colonne principale absente").not.toBeNull();
      const main = m.mainBox!;
      expect(main.x, "la colonne principale doit être À CÔTÉ du rail, pas dessous").toBeGreaterThanOrEqual(
        rail.w - 2,
      );
      expect(main.y, "la colonne principale est repoussée sous la ligne de flottaison").toBeLessThan(
        HAUTEUR / 2,
      );

      expect(m.mapBox, "carte absente du DOM").not.toBeNull();
      const map = m.mapBox!;
      expect(m.mapVisiblePct, `carte visible à ${m.mapVisiblePct}% seulement`).toBeGreaterThanOrEqual(90);
      expect(map.w, "la carte doit occuper la largeur restante").toBeGreaterThanOrEqual(
        largeur - rail.w - 40,
      );
      expect(map.h, "la carte doit rester haute").toBeGreaterThanOrEqual(400);
      expect(map.y, "la carte démarre sous la ligne de flottaison").toBeLessThan(HAUTEUR / 2);

      expect(
        m.mapCenterInsideMap,
        `le centre de la carte est recouvert par ${m.mapCenterTag}`,
      ).toBe(true);

      expect(m.mapSurfaceRendue, "aucune surface de carte peinte (ni canvas ni tuile)").toBe(true);

      expect(m.scrollWidth, "débordement horizontal").toBeLessThanOrEqual(largeur + 1);
      expect(
        m.scrollHeight,
        "défilement vertical anormal : une colonne est injectée dans le flux",
      ).toBeLessThanOrEqual(HAUTEUR + SCROLL_TOLERANCE);
    });
  }

  for (const largeur of LARGEURS_BORNES) {
    test(`${largeur} — borne préservée : carte visible, aucun débordement`, async ({ page }) => {
      await allerSurLaCarte(page, largeur);
      const m = await mesurer(page);

      expect(m.mapBox, "carte absente du DOM").not.toBeNull();
      expect(m.mapVisiblePct, `carte visible à ${m.mapVisiblePct}% seulement`).toBeGreaterThanOrEqual(90);
      expect(m.mapBox!.h, "la carte doit rester haute").toBeGreaterThanOrEqual(400);
      expect(m.mapCenterInsideMap, `centre recouvert par ${m.mapCenterTag}`).toBe(true);
      expect(m.scrollWidth, "débordement horizontal").toBeLessThanOrEqual(largeur + 1);
    });
  }

  test("900 — une seule instance Google Maps est chargée", async ({ page }) => {
    let chargements = 0;
    page.on("request", (requete) => {
      if (requete.url().includes("maps.googleapis.com/maps/api/js")) chargements += 1;
    });
    await allerSurLaCarte(page, 900);
    expect(chargements, `${chargements} chargements de l'API Google Maps`).toBeLessThanOrEqual(1);
  });

  test("900 — /feed partage le shell et reste exempt de débordement", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: HAUTEUR });
    await page.goto("/feed", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_500);
    const m = await mesurer(page);

    expect(m.scrollWidth, "débordement horizontal sur /feed").toBeLessThanOrEqual(901);
    if (m.railBox) {
      expect(m.railBox.w, "le rail de /feed redevient une bande pleine largeur").toBeLessThanOrEqual(
        RAIL_LARGEUR_MAX,
      );
    }
  });
});
