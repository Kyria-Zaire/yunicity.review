import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { expect, test, type Page } from "@playwright/test";
import { build } from "esbuild";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

import tailwindConfig from "../../tailwind.config";

/**
 * MEDIA-02 — les six surfaces raccordées, mesurées.
 *
 * Le raccordement était prouvé par un inventaire de source. Cela dit qu'une
 * carte appelle la primitive, pas que la boîte obtenue est la bonne. Ici on
 * mesure la boîte réelle de chaque variante, avec un média portrait 9:16 — le
 * cas qui monopolisait la hauteur avant MEDIA-02.
 */

const LARGEURS = [390, 900, 1440] as const;

/** Plafonds CSS de la variante `compact`, par palier. */
function plafondCompact(largeur: number, hauteurVp: number): number {
  if (largeur < 640) return Math.min(hauteurVp * 0.3, 300);
  if (largeur < 1024) return Math.min(hauteurVp * 0.36, 340);
  return Math.min(hauteurVp * 0.4, 380);
}

/** Côté fixe de la vignette : 6rem = 96 px. */
const COTE_VIGNETTE = 96;

let pageUrlCache: string | null = null;
const dossiersTemporaires: string[] = [];

test.afterAll(async () => {
  for (const dossier of dossiersTemporaires) {
    await rm(dossier, { recursive: true, force: true });
  }
});

async function pageHarnais(): Promise<string> {
  if (pageUrlCache) return pageUrlCache;

  const source = await readFile("app/globals.css", "utf8");
  const brand = await readFile("../../packages/ui/src/brand.css", "utf8");
  const aplati = source.replace(/@import\s+["']@yunicity\/ui\/brand\.css["'];?/g, brand);
  const css = (await postcss([tailwindcss(tailwindConfig)]).process(aplati, { from: "app/globals.css" }))
    .css;
  for (const sentinelle of ["publication-media-frame--compact", "publication-media-frame--thumbnail"]) {
    if (!css.includes(sentinelle)) {
      throw new Error(`CSS MEDIA-02 incomplet : \`${sentinelle}\` absent.`);
    }
  }

  const sortie = await build({
    entryPoints: ["e2e/harness/media02-surfaces-mount.tsx"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    tsconfig: "tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"' },
    banner: { js: 'var process = { env: { NODE_ENV: "production" } };' },
    alias: {
      "@/hooks/use-yunicity-api": "./e2e/harness/media02-interaction-stubs.tsx",
      "@/lib/auth/auth-provider": "./e2e/harness/media02-interaction-stubs.tsx",
      "next/navigation": "./e2e/harness/media02-interaction-stubs.tsx",
      "next/image": "./e2e/harness/media02-interaction-stubs.tsx",
      "next/link": "./e2e/harness/media02-interaction-stubs.tsx",
    },
    logLevel: "silent",
  });

  const dossier = await mkdtemp(join(tmpdir(), "media02-surf-"));
  dossiersTemporaires.push(dossier);
  const fichier = join(dossier, "harnais.html");
  await writeFile(
    fichier,
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style></head>
<body><div id="media02-root"></div><script>${sortie.outputFiles[0]!.text}</script></body></html>`,
    "utf8",
  );
  pageUrlCache = pathToFileURL(fichier).href;
  return pageUrlCache;
}

async function ouvrir(page: Page, largeur: number, hauteur: number): Promise<void> {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.goto(await pageHarnais());
  await page.waitForFunction(() => window.media02SurfacesPret === true, undefined, {
    timeout: 20_000,
  });
  await expect(page.locator("[data-media02-surface]")).toHaveCount(5);
}

type Cadre = { surface: string; variante: string; w: number; h: number };

async function cadres(page: Page): Promise<Cadre[]> {
  return page.evaluate(() => {
    const out: Array<{ surface: string; variante: string; w: number; h: number }> = [];
    for (const section of document.querySelectorAll<HTMLElement>("[data-media02-surface]")) {
      const surface = section.getAttribute("data-media02-surface")!;
      for (const cadre of section.querySelectorAll<HTMLElement>("[data-publication-media-frame]")) {
        const boite = cadre.getBoundingClientRect();
        if (boite.width === 0 && boite.height === 0) continue;
        out.push({
          surface,
          variante: cadre.getAttribute("data-publication-media-frame")!,
          w: Math.round(boite.width),
          h: Math.round(boite.height),
        });
      }
    }
    return out;
  });
}

test.describe("MEDIA-02 — variantes mesurées sur les six surfaces", () => {
  for (const largeur of LARGEURS) {
    const hauteurVp = largeur === 390 ? 844 : 900;

    test(`${largeur} px — compact et thumbnail tiennent leur contrat`, async ({ page }) => {
      await ouvrir(page, largeur, hauteurVp);
      const mesures = await cadres(page);

      const lignes = [
        `viewport            ${largeur} x ${hauteurVp}`,
        `plafond compact     ${Math.round(plafondCompact(largeur, hauteurVp))}`,
        "surface            variante    largeur x hauteur",
        ...mesures.map(
          (m) =>
            `${m.surface.padEnd(18)} ${m.variante.padEnd(11)} ${String(m.w).padStart(4)} x ${String(m.h).padStart(4)}`,
        ),
      ].join("\n");
      await test.info().attach(`surfaces-${largeur}px`, { body: lignes, contentType: "text/plain" });
      console.log(`[MEDIA-02 SURFACES ${largeur}px]\n${lignes}`);

      // Capture non vide : sans cadre mesuré, les assertions ci-dessous seraient
      // vraies pour la mauvaise raison.
      expect(mesures.length, "aucun cadre mesuré").toBeGreaterThan(0);

      // Chaque surface expose un cadre canonique LÀ OÙ elle affiche son média.
      // La vignette d'offre est volontairement `hidden sm:block` : l'exiger à
      // 390 px reviendrait à inventer une régression. On vérifie donc son
      // absence à cette largeur, et sa présence au-dessus — un masquage qui
      // s'étendrait par accident échouerait ici.
      const surfaces = new Set(mesures.map((m) => m.surface));
      for (const attendue of ["profil-desktop", "tribu-mobile", "partenaire", "profil-mobile"]) {
        expect(surfaces.has(attendue), `${attendue} : aucun cadre canonique rendu`).toBe(true);
      }
      expect(
        surfaces.has("offre"),
        largeur < 640
          ? "la vignette d'offre doit rester masquée sous sm"
          : "la vignette d'offre doit être rendue au-dessus de sm",
      ).toBe(largeur >= 640);

      const plafond = plafondCompact(largeur, hauteurVp);
      for (const m of mesures) {
        if (m.variante === "compact") {
          // Une publication secondaire ne monopolise jamais la hauteur.
          expect(m.h, `${m.surface} : compact dépasse son plafond`).toBeLessThanOrEqual(plafond + 2);
          expect(m.h, `${m.surface} : compact sans hauteur`).toBeGreaterThan(0);
        }
        if (m.variante === "thumbnail") {
          // Une vignette reste une vignette, même avec un média portrait.
          expect(m.w, `${m.surface} : vignette non carrée`).toBe(COTE_VIGNETTE);
          expect(m.h, `${m.surface} : vignette non carrée`).toBe(COTE_VIGNETTE);
        }
      }
    });

    test(`${largeur} px — aucune surface ne déborde ni ne dépasse sa carte`, async ({ page }) => {
      await ouvrir(page, largeur, hauteurVp);

      const debordement = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debordement, "la page défile horizontalement").toBeLessThanOrEqual(1);

      const depassements = await page.evaluate(() => {
        const out: string[] = [];
        for (const section of document.querySelectorAll<HTMLElement>("[data-media02-surface]")) {
          const s = section.getBoundingClientRect();
          for (const cadre of section.querySelectorAll<HTMLElement>("[data-publication-media-frame]")) {
            const c = cadre.getBoundingClientRect();
            if (c.width === 0 && c.height === 0) continue;
            if (c.width > s.width + 1 || c.left < s.left - 1 || c.right > s.right + 1) {
              out.push(`${section.getAttribute("data-media02-surface")} : ${Math.round(c.width)}`);
            }
          }
        }
        return out;
      });
      expect(depassements, "un cadre déborde de sa carte").toEqual([]);
    });
  }
});
