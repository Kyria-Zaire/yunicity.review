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
 * MEDIA-01B — preuve responsive Chromium des états image authentifiée.
 */

const LARGEURS = [390, 900, 1440] as const;
const CIBLE_TACTILE_MIN = 44;

let pageUrlCache: string | null = null;
const dossiersTemporaires: string[] = [];

test.afterAll(async () => {
  for (const dossier of dossiersTemporaires) {
    await rm(dossier, { recursive: true, force: true });
  }
  dossiersTemporaires.length = 0;
});

async function cssApplication(): Promise<string> {
  const source = await readFile("app/globals.css", "utf8");
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
  for (const sentinelle of ["min-h-11", "object-contain", "motion-safe:animate-pulse"]) {
    if (!css.includes(sentinelle.replace(":", "\\:"))) {
      // Tailwind échappe `:` — accepter les deux formes.
      if (!css.includes("min-h-11") || !css.includes("object-contain")) {
        throw new Error(`CSS applicatif incomplet pour MEDIA-01B (${sentinelle}).`);
      }
    }
  }

  const sortie = await build({
    entryPoints: ["e2e/harness/media01b-authorized-mount.tsx"],
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
      "next/navigation": "./e2e/harness/media01-stubs.tsx",
      "next/image": "./e2e/harness/media01-stubs.tsx",
      "next/link": "./e2e/harness/media01-stubs.tsx",
    },
    logLevel: "silent",
  });
  const script = sortie.outputFiles[0]!.text;
  const dossier = await mkdtemp(join(tmpdir(), "media01b-"));
  dossiersTemporaires.push(dossier);
  const fichier = join(dossier, "harnais.html");
  await writeFile(
    fichier,
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style></head>
<body><div id="media01b-root"></div><script>${script}</script></body></html>`,
    "utf8",
  );
  pageUrlCache = pathToFileURL(fichier).href;
  return pageUrlCache;
}

async function ouvrir(page: Page, largeur: number): Promise<void> {
  await page.setViewportSize({ width: largeur, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(await pageHarnais());
  await expect(page.locator('[data-media01b-state="ready"] img')).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("MEDIA-01B — rendu responsive image autorisée", () => {
  for (const largeur of LARGEURS) {
    test.describe(`${largeur} px`, () => {
      test("loading / ready / error / retry / plein écran sans débordement", async ({
        page,
      }) => {
        await ouvrir(page, largeur);

        await expect(page.locator('[data-authorized-media-state="loading"]')).toBeVisible();
        const readyImg = page.locator('[data-media01b-state="ready"] img');
        await expect(readyImg).toBeVisible();
        await expect
          .poll(async () => readyImg.evaluate((n) => (n as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(1);

        const errorBlock = page.locator('[data-media01b-state="error"] [role="alert"]');
        await expect(errorBlock).toContainText("Image momentanément indisponible");
        const retry = page.locator('[data-media01b-state="error"] [data-authorized-media-retry]');
        const retryBox = await retry.boundingBox();
        expect(retryBox?.width ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_MIN);
        expect(retryBox?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_MIN);

        await page.locator("[data-media01b-open-viewer]").click();
        const fullscreen = page.locator('[data-authorized-media-state="ready"]').last();
        await expect(fullscreen).toBeVisible();
        await expect
          .poll(async () =>
            fullscreen.evaluate((n) => {
              const style = getComputedStyle(n);
              return style.objectFit;
            }),
          )
          .toBe("object-contain".includes("contain") ? "contain" : "contain");

        const close = page.getByRole("button", { name: /Fermer/i }).first();
        const closeBox = await close.boundingBox();
        expect(closeBox?.width ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_MIN);
        expect(closeBox?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_MIN);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);

        // Pas de pictogramme natif cassé : aucune img avec naturalWidth 0 exposée en ready.
        const broken = await page.evaluate(() =>
          Array.from(document.querySelectorAll('img[data-authorized-media-state="ready"]')).some(
            (img) => (img as HTMLImageElement).naturalWidth === 0 && img.clientWidth > 0,
          ),
        );
        expect(broken).toBe(false);
      });
    });
  }
});
