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
 * MEDIA-02 — preuve responsive : cadre portrait compact vs legacy contain.
 */

const LARGEURS = [390, 900, 1440] as const;

let pageUrlCache: string | null = null;
const dossiersTemporaires: string[] = [];

test.afterAll(async () => {
  for (const dossier of dossiersTemporaires) {
    await rm(dossier, { recursive: true, force: true });
  }
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
  if (!css.includes("publication-media-frame") && !css.includes("42svh")) {
    // Les règles MEDIA-02 sont en CSS brut (pas Tailwind) — doivent survivre.
    throw new Error("CSS MEDIA-02 (publication-media-frame / 42svh) absent du bundle.");
  }

  const sortie = await build({
    entryPoints: ["e2e/harness/media02-adaptive-mount.tsx"],
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
  const dossier = await mkdtemp(join(tmpdir(), "media02-"));
  dossiersTemporaires.push(dossier);
  const fichier = join(dossier, "harnais.html");
  await writeFile(
    fichier,
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style></head>
<body><div id="media02-root"></div><script>${script}</script></body></html>`,
    "utf8",
  );
  pageUrlCache = pathToFileURL(fichier).href;
  return pageUrlCache;
}

async function ouvrir(page: Page, largeur: number, hauteur = 844): Promise<void> {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(await pageHarnais());
  await expect(page.locator('[data-media02-card="portrait"]')).toBeVisible({ timeout: 15_000 });
}

test.describe("MEDIA-02 — cartes publication adaptatives", () => {
  for (const largeur of LARGEURS) {
    test.describe(`${largeur} px`, () => {
      test("portrait nettement plus court que legacy ; actions hors nav", async ({ page }) => {
        const hauteurVp = largeur === 390 ? 844 : 900;
        await ouvrir(page, largeur, hauteurVp);

        const frame = page.locator(
          '[data-media02-frame-host="portrait"] [data-publication-media-frame="feed"]',
        );
        await expect(frame).toBeVisible();
        expect(await frame.getAttribute("data-publication-media-orientation")).toBe("portrait");

        const frameBox = await frame.boundingBox();
        expect(frameBox).not.toBeNull();
        const legacy = page.locator("[data-media02-legacy-img]");
        const legacyBox = await legacy.boundingBox();
        expect(legacyBox).not.toBeNull();

        // Cadre portrait borné : plus court que l'ancien contain pleine largeur.
        expect(frameBox!.height).toBeLessThan(legacyBox!.height * 0.85);
        // Plafond ~42/56/64 svh
        const maxAllowed =
          largeur < 640 ? hauteurVp * 0.45 : largeur < 1024 ? hauteurVp * 0.6 : Math.min(hauteurVp * 0.7, 660);
        expect(frameBox!.height).toBeLessThanOrEqual(maxAllowed + 2);

        const landscape = page.locator(
          '[data-media02-frame-host="landscape"] [data-publication-media-frame="feed"]',
        );
        const landscapeBox = await landscape.boundingBox();
        expect(landscapeBox).not.toBeNull();
        // Paysage plus bas que portrait à largeur égale (16:9 vs 4:5).
        expect(landscapeBox!.height).toBeLessThan(frameBox!.height);

        const actions = page.locator("[data-media02-actions]");
        const nav = page.locator("[data-media02-bottom-nav]");
        const actionsBox = await actions.boundingBox();
        const navBox = await nav.boundingBox();
        expect(actionsBox).not.toBeNull();
        expect(navBox).not.toBeNull();
        // Pas de chevauchement actions / nav (actions entièrement au-dessus).
        expect(actionsBox!.y + actionsBox!.height).toBeLessThanOrEqual(navBox!.y + 1);

        // Pas de scroll interne du cadre.
        const overflowY = await frame.evaluate((el) => getComputedStyle(el).overflowY);
        expect(["hidden", "clip"]).toContain(overflowY);

        // Contrat de ratio : 4:5 est la forme la PLUS HAUTE autorisee. Le plafond
        // responsive peut raccourcir le cadre, ce qui fait MONTER largeur/hauteur.
        // Exiger strictement 0.8 reviendrait a interdire le plafond qu'on vient
        // d'imposer — c'est l'un ou l'autre, pas les deux.
        const ratio = frameBox!.width / frameBox!.height;
        expect(ratio, "cadre plus haut que 4:5").toBeGreaterThanOrEqual(0.8 - 0.02);

        const carte = page.locator('[data-media02-card="portrait"]');
        const carteBox = (await carte.boundingBox())!;
        const chevauchement = actionsBox!.y + actionsBox!.height > navBox!.y;
        const mesures = [
          `viewport            ${largeur} x ${hauteurVp}`,
          `cadre               ${Math.round(frameBox!.width)} x ${Math.round(frameBox!.height)}`,
          `ratio applique      ${ratio.toFixed(3)} (4:5 = 0.800)`,
          `plafond autorise    ${Math.round(maxAllowed)}`,
          `hauteur carte       ${Math.round(carteBox.height)}`,
          `action row y        ${Math.round(actionsBox!.y)} -> ${Math.round(actionsBox!.y + actionsBox!.height)}`,
          `nav y               ${Math.round(navBox!.y)}`,
          `chevauchement       ${chevauchement ? "OUI" : "NON"}`,
          `legacy (hauteur)    ${Math.round(legacyBox!.height)}`,
          `gain vs legacy      ${Math.round((1 - frameBox!.height / legacyBox!.height) * 100)} %`,
        ].join("\n");
        await test.info().attach(`mesures-${largeur}px`, {
          body: mesures,
          contentType: "text/plain",
        });
        // Mesures exigées par le gate MEDIA-02 : elles doivent apparaître dans la sortie.
        console.log(`[MEDIA-02 ${largeur}px]\n${mesures}`);
      });
    });
  }
});
