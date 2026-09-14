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
 * MEDIA-01 — GATE 9 : preuve de rendu responsive dans un navigateur réel.
 *
 * Composants réels + CSS réel de l'application, compilé PAR LE TEST depuis
 * `app/globals.css` et la configuration Tailwind du dépôt, servis en page
 * autonome. Aucune API, aucune session : seuls réseau et navigation sont
 * bouchonnés, ce qui isole exactement ce que la revue doit mesurer.
 *
 * Une analyse statique ou un `next build` ne mesurent pas un débordement ni une
 * cible tactile : il faut un moteur de rendu.
 */

const LARGEURS = [390, 900, 1440] as const;

const COMPOSERS = [
  { cle: "feed", nom: "feed générique", apercuInline: true },
  { cle: "mobile", nom: "mobile", apercuInline: true },
  { cle: "desktop", nom: "desktop", apercuInline: true },
  { cle: "territorial", nom: "territorial mobile", apercuInline: true },
  // `/feed/new` place ses aperçus derrière sa propre navigation par étapes et
  // gère plusieurs médias : le confinement de son aperçu relève de ses tests
  // comportementaux dédiés, pas d'une mesure de composer en ligne. La page reste
  // mesurée ici pour le débordement, les cibles tactiles et l'accessibilité.
  { cle: "new-post", nom: "nouveau post (/feed/new)", apercuInline: false },
] as const;

/** Cible tactile minimale recommandée (rule 08-ui-ux-pro-max). */
const CIBLE_TACTILE_MIN = 44;

let pageUrlCache: string | null = null;
const dossiersTemporaires: string[] = [];

// Le harnais ne laisse rien derrière lui : ni CSS généré, ni page temporaire.
test.afterAll(async () => {
  for (const dossier of dossiersTemporaires) {
    await rm(dossier, { recursive: true, force: true });
  }
  dossiersTemporaires.length = 0;
});

/**
 * Construit le CSS RÉEL de l'application, dans le test.
 *
 * Une variable d'environnement à exporter à la main est un gate oubliable : la
 * suite passerait au vert avec une page sans style, et ne mesurerait plus rien.
 * On compile donc `app/globals.css` avec la configuration Tailwind du dépôt,
 * exactement comme le build.
 */
async function cssApplication(): Promise<string> {
  const source = await readFile("app/globals.css", "utf8");
  // `globals.css` importe les jetons de marque. On les inline plutôt que
  // d'ajouter `postcss-import` (non typé) au seul profit de ce test : la feuille
  // compilée reste celle de l'application, sans dépendance supplémentaire.
  const brand = await readFile("../../packages/ui/src/brand.css", "utf8");
  const aplati = source.replace(/@import\s+["']@yunicity\/ui\/brand\.css["'];?/g, brand);
  const resultat = await postcss([tailwindcss(tailwindConfig)]).process(aplati, {
    from: "app/globals.css",
  });
  return resultat.css;
}

async function pageHarnais(): Promise<string> {
  if (pageUrlCache) return pageUrlCache;

  const css = await cssApplication();
  // Garde-fou : si la compilation ne produit pas les utilitaires réellement
  // employés, la mesure qui suit ne voudrait rien dire.
  for (const sentinelle of ["min-h-11", "object-contain"]) {
    if (!css.includes(sentinelle)) {
      throw new Error(`CSS applicatif incomplet : \`${sentinelle}\` absent.`);
    }
  }

  const sortie = await build({
    entryPoints: ["e2e/harness/media01-composers-mount.tsx"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    tsconfig: "tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"' },
    banner: { js: 'var process = { env: { NODE_ENV: "production" } };' },
    alias: {
      "@/hooks/use-yunicity-api": "./e2e/harness/media01-stubs.tsx",
      "@/lib/auth/auth-provider": "./e2e/harness/media01-stubs.tsx",
      "@/components/avatar-image": "./e2e/harness/media01-stubs.tsx",
      "next/navigation": "./e2e/harness/media01-stubs.tsx",
      "@/components/layout/citizen-top-nav": "./e2e/harness/media01-stubs.tsx",
      "@/components/layout/web-sidebar": "./e2e/harness/media01-stubs.tsx",
      "@/components/brand": "./e2e/harness/media01-stubs.tsx",
      "next/image": "./e2e/harness/media01-stubs.tsx",
      "next/link": "./e2e/harness/media01-stubs.tsx",
    },
    logLevel: "silent",
  });
  const script = sortie.outputFiles[0]!.text;

  const dossier = await mkdtemp(join(tmpdir(), "media01-"));
  dossiersTemporaires.push(dossier);
  const fichier = join(dossier, "harnais.html");
  await writeFile(
    fichier,
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style></head>
<body><div id="media01-root"></div><script>${script}</script></body></html>`,
    "utf8",
  );
  pageUrlCache = pathToFileURL(fichier).href;
  return pageUrlCache;
}

async function ouvrir(page: Page, largeur: number): Promise<void> {
  await page.setViewportSize({ width: largeur, height: 900 });
  await page.goto(await pageHarnais());
  await expect(page.locator("[data-media01-composer]")).toHaveCount(COMPOSERS.length);
}

/** Déplie les composers qui démarrent repliés, pour rendre tout le contenu. */
async function deplierTout(page: Page): Promise<void> {
  for (const motif of [/Quoi de neuf à Reims/i, /Partage un bon plan/i]) {
    const boutons = page.getByRole("button", { name: motif });
    const total = await boutons.count();
    for (let i = 0; i < total; i += 1) {
      const bouton = boutons.nth(i);
      if (await bouton.isVisible()) await bouton.click();
    }
  }
}

/**
 * Un composer peut être délibérément absent d'une largeur : `feed-mobile`
 * porte `web-mobile-feed-only`, mis à `display:none` au-delà de 640 px. Mesurer
 * un composant que le produit n'affiche pas à cette largeur ne prouverait rien.
 */
async function estRendu(page: Page, cle: string): Promise<boolean> {
  const racine = page.locator(`[data-media01-composer="${cle}"] > *`).first();
  return racine.isVisible();
}

/** Injecte un fichier dans l'input du composer désigné et attend l'aperçu. */
async function joindreImage(page: Page, cle: string): Promise<void> {
  const section = page.locator(`[data-media01-composer="${cle}"]`);
  await section.locator('input[type="file"]').setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(section.locator("img").first()).toBeVisible({ timeout: 10_000 });
}

test.describe("GATE 9 — rendu responsive des composers actifs", () => {
  for (const largeur of LARGEURS) {
    test.describe(`${largeur} px`, () => {
      test("au moins un composer est réellement rendu à cette largeur", async ({ page }) => {
        // Un shell masqué ne vaut pas validation de sa largeur : on vérifie que
        // celui qui le remplace est bien là et mesurable.
        await ouvrir(page, largeur);
        const rendus: string[] = [];
        for (const { cle, nom } of COMPOSERS) {
          if (await estRendu(page, cle)) rendus.push(nom);
        }
        expect(rendus, `aucun composer rendu à ${largeur} px`).not.toEqual([]);
      });

      test("aucun débordement horizontal de la page", async ({ page }) => {
        await ouvrir(page, largeur);
        await deplierTout(page);
        for (const { cle, apercuInline } of COMPOSERS) {
          if (apercuInline && (await estRendu(page, cle))) await joindreImage(page, cle);
        }

        const debordement = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(debordement, "la page défile horizontalement").toBeLessThanOrEqual(1);
      });

      for (const { cle, nom, apercuInline } of COMPOSERS) {
        test(`${nom} — aperçu contenu, centré, et contrôles utilisables`, async ({ page }) => {
          test.skip(!apercuInline, `${nom} n'expose pas d'aperçu en ligne`);
          await ouvrir(page, largeur);
          await deplierTout(page);
          test.skip(!(await estRendu(page, cle)), `${nom} n'est pas affiché à ${largeur} px`);
          await joindreImage(page, cle);

          const section = page.locator(`[data-media01-composer="${cle}"]`);
          const boiteSection = (await section.boundingBox())!;
          const image = section.locator("img").first();
          const boiteImage = (await image.boundingBox())!;

          // Aperçu entièrement contenu dans son composer.
          expect(boiteImage.width, "aperçu plus large que le composer").toBeLessThanOrEqual(
            boiteSection.width + 1,
          );
          expect(boiteImage.x).toBeGreaterThanOrEqual(boiteSection.x - 1);
          expect(boiteImage.x + boiteImage.width).toBeLessThanOrEqual(
            boiteSection.x + boiteSection.width + 1,
          );

          // Centrage horizontal dans son conteneur direct.
          const conteneur = image.locator("xpath=..");
          const boiteConteneur = (await conteneur.boundingBox())!;
          const margeGauche = boiteImage.x - boiteConteneur.x;
          const margeDroite = boiteConteneur.x + boiteConteneur.width - (boiteImage.x + boiteImage.width);
          expect(Math.abs(margeGauche - margeDroite), "aperçu non centré").toBeLessThanOrEqual(2);

          // L'image conserve ses proportions : `object-contain`, jamais déformée.
          const ajustement = await image.evaluate((el) => getComputedStyle(el).objectFit);
          expect(ajustement).toBe("contain");

          // Bouton retirer visible et actionnable.
          const retirer = section.getByRole("button", { name: /Retirer (l’|la )?(image|photo)/i }).first();
          await expect(retirer).toBeVisible();
          const boiteRetirer = (await retirer.boundingBox())!;
          expect(boiteRetirer.width).toBeGreaterThan(0);
          expect(boiteRetirer.height).toBeGreaterThan(0);

          // Zone de texte conservée après l'ajout du média.
          await expect(section.locator("textarea")).toBeVisible();
        });

        test(`${nom} — état « envoi en cours » visible et sans débordement`, async ({ page }) => {
          test.skip(!apercuInline, `${nom} n'expose pas d'aperçu en ligne`);
          await ouvrir(page, largeur);
          await page.evaluate(() => {
            (window as unknown as { media01Mode?: string }).media01Mode = "pending";
          });
          await deplierTout(page);
          test.skip(!(await estRendu(page, cle)), `${nom} n'est pas affiché à ${largeur} px`);

          const section = page.locator(`[data-media01-composer="${cle}"]`);
          await section.locator('input[type="file"]').setInputFiles({
            name: "photo.png",
            mimeType: "image/png",
            buffer: Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
              "base64",
            ),
          });

          await expect(section.getByText(/Envoi de l’image/i)).toBeVisible({ timeout: 10_000 });
          const debordement = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(debordement).toBeLessThanOrEqual(1);
        });

        test(`${nom} — message d'erreur lisible et annoncé`, async ({ page }) => {
          await ouvrir(page, largeur);
          await deplierTout(page);
          test.skip(!(await estRendu(page, cle)), `${nom} n'est pas affiché à ${largeur} px`);

          const section = page.locator(`[data-media01-composer="${cle}"]`);
          await section.locator('input[type="file"]').setInputFiles({
            name: "document.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("%PDF-1.4", "utf8"),
          });

          const alerte = section.locator('[role="alert"]').first();
          await expect(alerte).toBeVisible({ timeout: 10_000 });
          const boiteAlerte = (await alerte.boundingBox())!;
          const boiteSection = (await section.boundingBox())!;
          expect(boiteAlerte.x + boiteAlerte.width).toBeLessThanOrEqual(
            boiteSection.x + boiteSection.width + 1,
          );
          // Lisibilité : au moins la taille de corps de texte minimale du design.
          const taille = await alerte.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
          expect(taille).toBeGreaterThanOrEqual(12);
        });
      }

      test("tous les contrôles du parcours de création atteignent 44×44 px", async ({ page }) => {
        await ouvrir(page, largeur);
        await deplierTout(page);
        // On provoque aussi l'état « média refusé » : ses actions d'arbitrage
        // n'existent que là, et doivent être mesurées comme les autres.
        for (const { cle, apercuInline } of COMPOSERS) {
          if (!apercuInline) continue;
          if (!(await estRendu(page, cle))) continue;
          await page
            .locator(`[data-media01-composer="${cle}"] input[type="file"]`)
            .setInputFiles({
              name: "document.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("%PDF-1.4", "utf8"),
            });
        }

        /**
         * Inventaire EXHAUSTIF, et non une liste choisie : tout contrôle
         * interactif visible et actif appartenant à un parcours de création est
         * mesuré. Sélectionner quelques boutons par leur nom laisserait passer
         * exactement ce que la revue cherche.
         */
        const defauts = await page.evaluate((minimum) => {
          const SELECTEUR = 'button, [role="button"], a[href], summary, input[type="checkbox"], input[type="radio"]';
          const resultats: Array<{
            parcours: string;
            nom: string;
            largeur: number;
            hauteur: number;
            classes: string;
          }> = [];

          for (const section of document.querySelectorAll("[data-media01-composer]")) {
            const parcours = section.getAttribute("data-media01-composer") ?? "?";
            for (const el of section.querySelectorAll<HTMLElement>(SELECTEUR)) {
              // Un contrôle d'un autre parcours imbriqué appartient à celui-ci.
              if (el.closest("[data-media01-composer]") !== section) continue;
              if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") continue;
              if (el.getAttribute("aria-hidden") === "true") continue;
              const style = getComputedStyle(el);
              if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
                continue;
              }
              // Pour une case à cocher ou un bouton radio, la cible réellement
              // tapable est le libellé qui l'enveloppe : un navigateur active le
              // contrôle sur toute sa surface. Mesurer la boîte de 16 px du
              // contrôle natif décrirait une contrainte que l'utilisateur ne
              // rencontre pas — et la « corriger » déformerait le formulaire.
              const estCase =
                el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio");
              const zone = estCase ? (el.closest("label") ?? el) : el;
              const boite = zone.getBoundingClientRect();
              // Invisible faute de surface : ce n'est pas une cible applicable.
              if (boite.width === 0 || boite.height === 0) continue;

              if (boite.width < minimum || boite.height < minimum) {
                resultats.push({
                  parcours,
                  nom:
                    el.getAttribute("aria-label") ||
                    el.textContent?.trim().slice(0, 40) ||
                    el.getAttribute("title") ||
                    "(sans nom accessible)",
                  largeur: Math.round(boite.width),
                  hauteur: Math.round(boite.height),
                  classes: el.className?.toString().slice(0, 90) ?? "",
                });
              }
            }
          }
          return resultats;
        }, CIBLE_TACTILE_MIN);

        const lisible = defauts.map(
          (d) => `[${d.parcours}] @${largeur}px « ${d.nom} » ${d.largeur}×${d.hauteur} — ${d.classes}`,
        );
        expect(lisible, `cibles sous ${CIBLE_TACTILE_MIN}×${CIBLE_TACTILE_MIN} px`).toEqual([]);
      });

      test("le bouton Fermer de /feed/new reste actionnable et assez grand", async ({ page }) => {
        await ouvrir(page, largeur);
        const fermer = page
          .locator('[data-media01-composer="new-post"]')
          .getByRole("button", { name: /Fermer/i });

        const total = await fermer.count();
        let mesures = 0;
        for (let i = 0; i < total; i += 1) {
          const bouton = fermer.nth(i);
          if (!(await bouton.isVisible())) continue;
          const boite = (await bouton.boundingBox())!;
          expect(boite.width, `Fermer trop étroit à ${largeur} px`).toBeGreaterThanOrEqual(
            CIBLE_TACTILE_MIN,
          );
          expect(boite.height, `Fermer trop bas à ${largeur} px`).toBeGreaterThanOrEqual(
            CIBLE_TACTILE_MIN,
          );
          // Le focus doit rester perceptible au clavier.
          await bouton.focus();
          await expect(bouton).toBeFocused();
          // Et le clic doit toujours aboutir : la navigation est bouchonnée, on
          // vérifie qu'aucune erreur n'est levée et que la page tient.
          await bouton.click();
          mesures += 1;
        }
        expect(mesures, `aucun bouton Fermer visible à ${largeur} px`).toBeGreaterThan(0);
        await expect(page.locator('[data-media01-composer="new-post"]')).toHaveCount(1);
      });

      test("accessibilité du composer média (GATE 10)", async ({ page }) => {
        await ouvrir(page, largeur);
        await deplierTout(page);

        for (const { cle, nom, apercuInline } of COMPOSERS) {
          // La progression d'envoi d'un parcours multi-étapes est couverte par
          // ses tests comportementaux : rien à annoncer ici à ce stade.
          if (!apercuInline) continue;
          if (!(await estRendu(page, cle))) continue;
          const section = page.locator(`[data-media01-composer="${cle}"]`);

          // Aucune alerte tant qu'il n'y a rien à signaler : `role="alert"`
          // interrompt le lecteur d'écran, il ne doit pas être permanent.
          await expect(section.locator('[role="alert"]'), `${nom} : alerte permanente`).toHaveCount(0);

          // L'entrée fichier est masquée visuellement mais pilotée par un
          // contrôle nommé : le champ brut ne doit jamais être le seul accès.
          const entree = section.locator('input[type="file"]');
          await expect(entree).toHaveCount(1);
          const declencheurs = section.getByRole("button", {
            name: /Photo|Ajouter une image/i,
          });
          expect(await declencheurs.count(), `${nom} : aucun déclencheur nommé`).toBeGreaterThan(0);

          // Progression annoncée en `polite` : informer sans interrompre.
          await page.evaluate(() => {
            (window as unknown as { media01Mode?: string }).media01Mode = "pending";
          });
          await entree.setInputFiles({
            name: "photo.png",
            mimeType: "image/png",
            buffer: Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
              "base64",
            ),
          });
          const progression = section.locator('[aria-live="polite"]').filter({
            hasText: /Envoi de l’image/i,
          });
          await expect(progression, `${nom} : progression non annoncée`).toHaveCount(1);
          await expect(section.locator('[role="alert"]'), `${nom} : envoi annoncé comme alerte`).toHaveCount(0);

          await page.reload();
          await deplierTout(page);
        }
      });

      test("une erreur média est annoncée une seule fois, et le focus reste utilisable", async ({ page }) => {
        await ouvrir(page, largeur);
        await deplierTout(page);

        const cle = (await estRendu(page, "feed")) ? "feed" : "desktop";
        const section = page.locator(`[data-media01-composer="${cle}"]`);
        await section.locator('input[type="file"]').setInputFiles({
          name: "document.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4", "utf8"),
        });

        // Une seule région d'alerte : pas de double annonce.
        await expect(section.locator('[role="alert"]')).toHaveCount(1);

        // Le focus n'est pas piégé : la zone de texte reste atteignable.
        const zone = section.locator("textarea").first();
        await zone.focus();
        await expect(zone).toBeFocused();
      });

      test("l'animation d'envoi respecte prefers-reduced-motion", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await ouvrir(page, largeur);
        await deplierTout(page);
        await page.evaluate(() => {
          (window as unknown as { media01Mode?: string }).media01Mode = "pending";
        });

        const section = page.locator('[data-media01-composer="desktop"]');
        await section.locator('input[type="file"]').setInputFiles({
          name: "photo.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            "base64",
          ),
        });

        const anime = section.locator(".animate-spin").first();
        if ((await anime.count()) > 0) {
          const nom = await anime.evaluate((el) => getComputedStyle(el).animationName);
          expect(nom, "animation maintenue malgré reduced-motion").toBe("none");
        }
      });

      test("un texte long ne superpose pas les contrôles", async ({ page }) => {
        await ouvrir(page, largeur);
        await deplierTout(page);

        const long = "Reims ".repeat(400);
        for (const zone of await page.locator("textarea").all()) {
          if (await zone.isVisible()) await zone.fill(long);
        }

        const debordement = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(debordement).toBeLessThanOrEqual(1);

        // Les boutons publier restent visibles et cliquables.
        const publier = page.getByRole("button", { name: /^Publier$/i });
        const total = await publier.count();
        for (let i = 0; i < total; i += 1) {
          const bouton = publier.nth(i);
          if (await bouton.isVisible()) await expect(bouton).toBeEnabled();
        }
      });
    });
  }
});
