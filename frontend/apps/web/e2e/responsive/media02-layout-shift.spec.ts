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
 * MEDIA-02 — stabilité du cadre entre `loading` et `ready`.
 *
 * Le cadre part en portrait 4:5 tant que les dimensions sont inconnues, puis
 * adopte le rapport mesuré. Pour un paysage, cela peut le RACCOURCIR : c'est
 * précisément ce que cette mesure quantifie, sur six rapports, dans un vrai
 * moteur de rendu. Une affirmation « même cadre » ne vaut que si le delta est
 * nul ; sinon le contrat doit être énoncé pour ce qu'il est.
 */

const LARGEURS = [390, 900, 1440] as const;

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
  if (!css.includes("publication-media-frame")) {
    throw new Error("CSS MEDIA-02 absent : la mesure ne voudrait rien dire.");
  }

  const sortie = await build({
    entryPoints: ["e2e/harness/media02-shift-mount.tsx"],
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

  const dossier = await mkdtemp(join(tmpdir(), "media02-shift-"));
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

async function mesurer(page: Page, attribut: string) {
  return page.evaluate((attr) => {
    const out: Record<string, { h: number; w: number; o: string | null }> = {};
    for (const hote of document.querySelectorAll<HTMLElement>(`[${attr}]`)) {
      const cle = hote.getAttribute(attr)!;
      const cadre = hote.querySelector<HTMLElement>("[data-publication-media-frame]")!;
      const boite = cadre.getBoundingClientRect();
      out[cle] = {
        h: Math.round(boite.height),
        w: Math.round(boite.width),
        o: cadre.getAttribute("data-publication-media-orientation"),
      };
    }
    return out;
  }, attribut);
}

test.describe("MEDIA-02 — stabilité du cadre loading → ready", () => {
  for (const largeur of LARGEURS) {
    const hauteurVp = largeur === 390 ? 844 : 900;

    test(`${largeur} px — six rapports mesurés`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: hauteurVp });
      await page.goto(await pageHarnais());
      await page.waitForFunction(() => window.media02Pret === true, undefined, { timeout: 20_000 });
      await expect(page.locator("[data-media02-shift-loading]")).toHaveCount(6);

      const avant = await mesurer(page, "data-media02-shift-loading");
      const apres = await mesurer(page, "data-media02-shift-ready");

      const svhCalcule = await page.evaluate(() => {
        const sonde = document.createElement("div");
        sonde.style.cssText = "height:100svh;position:absolute;visibility:hidden";
        document.body.appendChild(sonde);
        const h = sonde.getBoundingClientRect().height;
        sonde.remove();
        return Math.round(h);
      });

      const maxHeightCalcule = await page.evaluate(() => {
        const cadre = document.querySelector("[data-publication-media-frame='feed']");
        return cadre ? getComputedStyle(cadre).maxHeight : "?";
      });

      const mesures = Object.keys(avant).map((cle) => ({
        cle,
        loading: avant[cle]!.h,
        ready: apres[cle]!.h,
        delta: apres[cle]!.h - avant[cle]!.h,
        oAvant: avant[cle]!.o,
        oApres: apres[cle]!.o,
        ratio: apres[cle]!.w / apres[cle]!.h,
      }));

      const lignes = [
        `viewport            ${largeur} x ${hauteurVp}`,
        `100svh calcule      ${svhCalcule}`,
        `42svh theorique     ${Math.round(svhCalcule * 0.42)}`,
        `max-height calcule  ${maxHeightCalcule}`,
        "cas                 loading  ready   delta  avant    -> apres     ratio",
        ...mesures.map(
          (m) =>
            `${m.cle.padEnd(19)} ${String(m.loading).padStart(6)}  ${String(m.ready).padStart(6)}` +
            ` ${String(m.delta).padStart(6)}  ${String(m.oAvant).padEnd(8)} -> ${String(m.oApres).padEnd(9)}` +
            ` ${m.ratio.toFixed(3)}`,
        ),
      ].join("\n");
      await test.info().attach(`saut-${largeur}px`, { body: lignes, contentType: "text/plain" });
      console.log(`[MEDIA-02 SHIFT ${largeur}px]\n${lignes}`);

      // Contrat réel, mesuré — et non « même cadre », qui serait faux :
      //
      // 1. le cadre ne GRANDIT jamais après mesure : rien n'est repoussé vers le
      //    bas sous les yeux du lecteur. C'est la propriété non négociable.
      // 2. un portrait ne bouge pas du tout.
      // 3. un média plus large que 4:5 se contracte une fois, d'une valeur
      //    bornée par l'écart entre le plafond et sa propre hauteur 16:9.
      for (const m of mesures) {
        expect(m.delta, `${m.cle} : le cadre grandit apres mesure`).toBeLessThanOrEqual(1);
      }
      for (const m of mesures.filter((x) => x.oApres === "portrait")) {
        expect(Math.abs(m.delta), `${m.cle} : un portrait ne doit pas bouger`).toBeLessThanOrEqual(1);
      }
      // Une contraction reste bornee : jamais plus que le plafond lui-meme.
      const plafond = Math.max(...mesures.map((m) => m.loading));
      for (const m of mesures) {
        expect(Math.abs(m.delta), `${m.cle} : contraction hors plafond`).toBeLessThanOrEqual(plafond);
      }
    });
  }
});
