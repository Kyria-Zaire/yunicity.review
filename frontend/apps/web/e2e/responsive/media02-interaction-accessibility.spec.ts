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
 * MEDIA-02 — interaction multi-médias et accessibilité de la visionneuse.
 *
 * Les preuves unitaires disaient que la grille découpe et compte correctement.
 * Elles ne disaient rien de ce qui compte pour l'utilisateur : la tuile cliquée
 * ouvre-t-elle SON média, Escape referme-t-il, et le focus revient-il là où il
 * était ? C'est ce que ce fichier mesure, dans un vrai moteur de rendu.
 *
 * ## Lots MIXTES depuis MEDIA-MULTI-PHOTO-01
 *
 * La mosaïque n'est plus le rendu des lots de photos — ceux-là passent au
 * carrousel. Elle reste celui des lots MIXTES photo + vidéo, et c'est donc sur
 * eux que ce fichier l'éprouve. Le harnais place la VIDÉO en DERNIÈRE
 * position : les quatre premières tuiles restent des photos, et les assertions
 * de disposition, d'ordre et de débordement gardent exactement leur sens.
 *
 * ⚠️ Une tuile VIDÉO n'a pas de bouton « Agrandir » — elle n'entre pas dans la
 * visionneuse. Les comptes de boutons ci-dessous en tiennent compte : ce n'est
 * pas un assouplissement, c'est la description exacte d'un lot mixte.
 */

const VIEWPORTS = [
  { largeur: 390, hauteur: 844 },
  { largeur: 393, hauteur: 852 },
  { largeur: 430, hauteur: 932 },
  { largeur: 900, hauteur: 900 },
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
  const css = (await postcss([tailwindcss(tailwindConfig)]).process(aplati, { from: "app/globals.css" }))
    .css;
  if (!css.includes("publication-media-grid")) {
    throw new Error("CSS MEDIA-02 absent : la mesure ne voudrait rien dire.");
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

  const dossier = await mkdtemp(join(tmpdir(), "media02-inter-"));
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

async function ouvrir(page: Page, largeur: number, hauteur = 844): Promise<void> {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.goto(await pageHarnais());
  await page.waitForFunction(() => window.media02InteractionPret === true, undefined, {
    timeout: 20_000,
  });
  // Les tuiles doivent avoir atteint l'état prêt : un bouton « Agrandir »
  // n'existe qu'une fois le média décodé. Sans cette attente, un clic ne ferait
  // rien et le test passerait pour la mauvaise raison.
  //
  // On s'ancre sur un fait vérifiable — les 4 tuiles de la grille de 10 — et non
  // sur un total estimé.
  await page.waitForFunction(
    () =>
      document.querySelectorAll(
        "[data-media02-grid-host='10'] [aria-label^='Agrandir']",
      ).length === 4,
    undefined,
    { timeout: 20_000 },
  );
}

function grille(page: Page, taille: number) {
  return page.locator(`[data-media02-grid-host="${taille}"]`);
}

test.describe("MEDIA-02 — grille multi-médias et visionneuse", () => {
  for (const { largeur, hauteur } of VIEWPORTS) {
    test.describe(`${largeur} x ${hauteur}`, () => {
      test("dispositions, badge +N et ordre, de 1 à 10 médias", async ({ page }) => {
        await ouvrir(page, largeur, hauteur);

        const attendu: Array<[number, string, string | null, number]> = [
          // taille, disposition, badge, boutons « Agrandir » attendus
          // La VIDÉO est en dernière position et ne porte pas de bouton.
          [1, "", null, 0], // une vidéo seule : cadre simple
          [2, "pair", null, 1], // photo + vidéo
          [3, "triple", null, 2], // 2 photos + vidéo
          [4, "quad", null, 3], // 3 photos + vidéo
          [5, "quad", "+1", 4], // 4 photos visibles, vidéo au débordement
          [10, "quad", "+6", 4], // 4 photos visibles, 6 au débordement
        ];

        const releve: string[] = [];
        for (const [taille, disposition, badge, tuiles] of attendu) {
          const hote = grille(page, taille);
          if (taille === 1) {
            // Un média seul n'est pas une grille : cadre simple.
            await expect(hote.locator("[data-publication-media-grid]")).toHaveCount(0);
            await expect(hote.locator("[data-publication-media-frame='feed']")).toHaveCount(1);
            releve.push(`1 media : cadre simple, pas de grille`);
            continue;
          }

          const g = hote.locator("[data-publication-media-grid]");
          await expect(g).toHaveCount(1);
          expect(await g.getAttribute("data-publication-media-grid")).toBe(disposition);

          const boutons = hote.locator("[aria-label^='Agrandir']");
          await expect(boutons, `${taille} médias : nombre de tuiles`).toHaveCount(tuiles);

          // L'ordre de publication est conservé : la tuile n porte l'index n.
          for (let i = 0; i < tuiles; i += 1) {
            expect(await boutons.nth(i).getAttribute("aria-label")).toBe(
              `Agrandir l’image ${i + 1}`,
            );
          }

          /**
           * Le débordement se lit désormais en DEUX endroits, et le test
           * vérifie les deux — c'est plus strict qu'avant, pas moins.
           *
           * 1. l'ANNONCE, au niveau de la grille, SANS surface (`sr-only`).
           *    Elle portait auparavant un fond noir à 45 % en `inset: 0` : ce
           *    voile couvrait toute la mosaïque, et doublait le « +N » de la
           *    quatrième tuile. Les deux défauts observés en recette.
           * 2. le « +N » VISIBLE, qui doit se trouver DANS une tuile — jamais
           *    en enfant direct de la grille.
           */
          const badgeLoc = hote.locator("[data-publication-media-overflow-badge]");
          const voileLoc = hote.locator(".publication-media-grid__overflow");
          if (badge) {
            await expect(badgeLoc, `${taille} médias : annonce attendue`).toHaveCount(1);
            const compte = badge.replace("+", "");
            expect((await badgeLoc.textContent())?.trim()).toBe(
              `${compte} médias supplémentaires`,
            );
            expect(await badgeLoc.evaluate((n) => n.className)).toContain("sr-only");

            // Un SEUL « +N » visible, et il est DANS une tuile.
            await expect(voileLoc, `${taille} médias : « +N » visible unique`).toHaveCount(1);
            expect((await voileLoc.textContent())?.trim()).toBe(badge);
            expect(
              await voileLoc.evaluate(
                (n) => n.closest(".publication-media-grid__tile") !== null,
              ),
              `${taille} médias : le « +N » déborde de sa tuile`,
            ).toBe(true);

            // Jamais de cinquième tuile rendue sous la grille.
            await expect(hote.locator("[aria-label^='Agrandir']")).toHaveCount(4);
          } else {
            await expect(badgeLoc, `${taille} médias : annonce inattendue`).toHaveCount(0);
            await expect(voileLoc, `${taille} médias : « +N » inattendu`).toHaveCount(0);
          }
          releve.push(`${taille} medias : ${disposition}, ${tuiles} tuiles, badge ${badge ?? "aucun"}`);
        }

        await test.info().attach(`grilles-${largeur}px`, {
          body: releve.join("\n"),
          contentType: "text/plain",
        });
      });

      test("chaque tuile ouvre SON média, Escape ferme, le focus revient", async ({ page }) => {
        await ouvrir(page, largeur, hauteur);

        const hote = grille(page, 10);
        const boutons = hote.locator("[aria-label^='Agrandir']");
        await expect(boutons).toHaveCount(4);

        for (let i = 0; i < 4; i += 1) {
          const tuile = boutons.nth(i);
          await tuile.click();

          const dialogue = page.locator('[role="dialog"]');
          await expect(dialogue, `tuile ${i + 1} : la visionneuse ne s'ouvre pas`).toHaveCount(1);
          await expect(dialogue).toHaveAttribute("aria-modal", "true");

          // Le titre porte l'index : c'est la preuve que la BONNE image s'ouvre.
          const titre = await dialogue.textContent();
          expect(titre, `tuile ${i + 1} : mauvais média ouvert`).toContain(`(${i + 1})`);

          // Le média est complet, jamais recadré dans la visionneuse.
          const cadre = dialogue.locator("[data-publication-media-frame='viewer']");
          await expect(cadre).toHaveCount(1);
          expect(await cadre.getAttribute("data-publication-media-fit")).toBe("contain");

          await page.keyboard.press("Escape");
          await expect(dialogue, `tuile ${i + 1} : Escape ne ferme pas`).toHaveCount(0);

          // Le focus revient sur la tuile d'origine, pas sur le corps du document.
          const revenu = await page.evaluate(
            () => document.activeElement?.getAttribute("aria-label") ?? null,
          );
          expect(revenu, `tuile ${i + 1} : focus non restauré`).toBe(`Agrandir l’image ${i + 1}`);
        }
      });

      test("la visionneuse s'ouvre au clavier et son bouton Fermer est atteignable", async ({
        page,
      }) => {
        await ouvrir(page, largeur, hauteur);

        const tuile = grille(page, 4).locator("[aria-label^='Agrandir']").first();
        await tuile.focus();
        await expect(tuile).toBeFocused();
        await page.keyboard.press("Enter");

        const dialogue = page.locator('[role="dialog"]');
        await expect(dialogue, "ouverture clavier impossible").toHaveCount(1);

        // Un bouton Fermer existe, il est atteignable et assez grand.
        const fermer = dialogue.getByRole("button", { name: /Fermer/i }).first();
        await expect(fermer).toBeVisible();
        const boite = (await fermer.boundingBox())!;
        expect(boite.width, "Fermer trop étroit").toBeGreaterThanOrEqual(44);
        expect(boite.height, "Fermer trop bas").toBeGreaterThanOrEqual(44);

        await fermer.click();
        await expect(dialogue).toHaveCount(0);
        const revenu = await page.evaluate(
          () => document.activeElement?.getAttribute("aria-label") ?? null,
        );
        expect(revenu, "focus non restauré après Fermer").toBe("Agrandir l’image 1");
      });

      test("aucun débordement horizontal, quelle que soit la grille", async ({ page }) => {
        await ouvrir(page, largeur, hauteur);
        const debordement = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(debordement).toBeLessThanOrEqual(1);
      });
    });
  }
});
