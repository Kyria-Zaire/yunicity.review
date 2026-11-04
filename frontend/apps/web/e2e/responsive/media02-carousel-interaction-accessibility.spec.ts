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
 * MEDIA-MULTI-PHOTO-01 — navigation du CARROUSEL, en navigateur réel.
 *
 * ## Pourquoi ce fichier existe
 *
 * Les tests jsdom du carrousel ne prouvent QUE le rendu initial et la borne de
 * préchargement. ⛔ Ils ne peuvent rien dire des flèches, des points ni du
 * clavier : **jsdom n'implémente ni `scrollTo` ni l'événement `scroll`**, donc
 * le rang n'y bouge jamais. Une fonction pure de calcul du rang ne comble pas
 * ce trou — elle vérifie l'arithmétique, pas le câblage.
 *
 * Ce fichier mesure donc le câblage dans un moteur qui défile vraiment.
 */

const VIEWPORTS = [
  { largeur: 390, hauteur: 844 },
  { largeur: 1440, hauteur: 900 },
] as const;

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
  const css = (
    await postcss([tailwindcss(tailwindConfig)]).process(aplati, { from: "app/globals.css" })
  ).css;
  // Sans le CSS du carrousel, la piste ne défile pas et la mesure ne voudrait
  // rien dire : on refuse de mesurer plutôt que de mesurer faux.
  if (!css.includes("publication-carousel__track")) {
    throw new Error("CSS du carrousel absent : la mesure ne voudrait rien dire.");
  }

  const sortie = await build({
    entryPoints: ["e2e/harness/media02-interaction-mount.tsx"],
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

  const dossier = await mkdtemp(join(tmpdir(), "media-carrousel-"));
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

/**
 * Le carrousel de DIX PHOTOS : celui où le rang a de la place pour bouger.
 *
 * ⚠️ Famille `carousel-host`, et non `grid-host` : le harnais monte les deux,
 * parce que `FeedPublicationMedia` choisit son rendu d'après le CONTENU du lot
 * — photos seules → carrousel, lot mixte → mosaïque.
 */
const HOTE = "[data-media02-carousel-host='10']";

async function ouvrir(page: Page, largeur: number, hauteur: number): Promise<void> {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.goto(await pageHarnais());
  await page.waitForFunction(() => window.media02InteractionPret === true, undefined, {
    timeout: 20_000,
  });
  // Le compteur n'existe qu'une fois le carrousel monté.
  await page.locator(`${HOTE} [data-publication-carousel-counter]`).waitFor({ timeout: 20_000 });
}

const compteur = (page: Page) =>
  page.locator(`${HOTE} [data-publication-carousel-counter]`);

for (const { largeur, hauteur } of VIEWPORTS) {
  test.describe(`carrousel ${largeur}x${hauteur}`, () => {
    test("les POINTS déplacent le rang, et le compteur suit", async ({ page }) => {
      await ouvrir(page, largeur, hauteur);
      await expect(compteur(page)).toHaveText("1 / 10");

      await page.locator(`${HOTE} [data-publication-carousel-dot]`).nth(4).click();

      await expect(compteur(page)).toHaveText("5 / 10");
      // Le point courant est annoncé comme tel, pas seulement coloré.
      await expect(
        page.locator(`${HOTE} [data-publication-carousel-dot]`).nth(4),
      ).toHaveAttribute("aria-current", "true");
    });

    test("les FLÈCHES avancent et reculent, et se bornent", async ({ page }) => {
      await ouvrir(page, largeur, hauteur);

      const suivant = page.locator(`${HOTE} [data-publication-carousel-next]`);
      const precedent = page.locator(`${HOTE} [data-publication-carousel-previous]`);

      // Borne basse : « précédent » est annoncé inactif et ne recule pas.
      await expect(precedent).toHaveAttribute("aria-disabled", "true");
      await precedent.click({ force: true });
      await expect(compteur(page)).toHaveText("1 / 10");

      await suivant.click({ force: true });
      await expect(compteur(page)).toHaveText("2 / 10");
      await precedent.click({ force: true });
      await expect(compteur(page)).toHaveText("1 / 10");
    });

    test("le CLAVIER navigue DEPUIS les commandes, pas seulement depuis la piste", async ({
      page,
    }) => {
      /**
       * Le défaut corrigé : l'écouteur vivait sur la piste. Une flèche pressée
       * alors que le focus était sur un point ou sur une commande ne faisait
       * RIEN. Il est désormais porté par le composant — et borné à lui.
       */
      await ouvrir(page, largeur, hauteur);

      await page.locator(`${HOTE} [data-publication-carousel-dot]`).first().focus();
      await page.keyboard.press("ArrowRight");
      await expect(compteur(page)).toHaveText("2 / 10");

      await page.keyboard.press("ArrowRight");
      await expect(compteur(page)).toHaveText("3 / 10");

      await page.keyboard.press("ArrowLeft");
      await expect(compteur(page)).toHaveText("2 / 10");
    });

    test("le FOCUS suit la diapositive courante quand elle change", async ({ page }) => {
      /**
       * ⚠️ `tabIndex={-1}` retire un bouton de l'ordre de tabulation mais NE
       * DÉPLACE PAS un focus déjà posé dessus. Sans le déplacement explicite,
       * le lecteur resterait accroché au bouton d'une photo sortie de l'écran.
       */
      await ouvrir(page, largeur, hauteur);

      const premierBouton = page.locator(`${HOTE} [aria-label='Agrandir l’image 1']`);
      await premierBouton.waitFor({ timeout: 20_000 });
      await premierBouton.focus();
      await expect(premierBouton).toBeFocused();

      await page.locator(`${HOTE} [data-publication-carousel-next]`).click({ force: true });
      await expect(compteur(page)).toHaveText("2 / 10");

      // Le focus a quitté la diapositive 1 : il n'est plus sur un bouton caché.
      const rangFocalise = await page.evaluate(() => {
        const actif = document.activeElement;
        if (!(actif instanceof HTMLElement)) return null;
        const slide = actif.closest("[data-publication-carousel-slide]");
        return slide?.getAttribute("data-publication-carousel-slide") ?? "hors-diapositive";
      });
      expect(rangFocalise).not.toBe("0");
    });

    test("AUCUN badge de débordement ni voile ne subsiste sur le carrousel", async ({
      page,
    }) => {
      await ouvrir(page, largeur, hauteur);

      await expect(
        page.locator(`${HOTE} [data-publication-media-overflow-badge]`),
      ).toHaveCount(0);
      await expect(page.locator(`${HOTE} .publication-media-grid__overflow`)).toHaveCount(0);
    });
  });
}
