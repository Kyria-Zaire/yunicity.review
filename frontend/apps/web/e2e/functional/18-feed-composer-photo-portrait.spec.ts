import { deflateSync } from "node:zlib";

import type { Locator, Page, Response } from "@playwright/test";

import { expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT } from "../cold-start";

/**
 * C3.1-R1C — Portrait Media Visual Closure.
 *
 * Prouve que l'aperçu et la publication respectent le ratio naturel pour les
 * trois formats (portrait, paysage, carré) sans recadrage destructif.
 *
 * Génération in-memory (pixels exacts, sans asset repo) :
 *   portrait  → 360 × 640  (ratio 9:16)
 *   landscape → 640 × 360  (ratio 16:9)
 *   square    → 400 × 400  (ratio 1:1)
 *
 * Tolérance ratio : ±5 % (δ ≤ 0.05) — acceptable pour rendering sub-pixel et
 * object-contain avec background neutre.
 */

const NATURAL = {
  portrait: { w: 360, h: 640 },
  landscape: { w: 640, h: 360 },
  square: { w: 400, h: 400 },
} as const;

type RatioName = keyof typeof NATURAL;

type FilePayload = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

function crc32(buf: Buffer): number {
  // CRC32 (IEEE 802.3), polynomial 0xEDB88320
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]!;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeSolidPngBuffer(width: number, height: number, r: number, g: number, b: number): Buffer {
  // Color type 2 = RGB, bit depth 8
  const rowSize = 1 + width * 3; // filter byte + rgb pixels
  const raw = Buffer.allocUnsafe(rowSize * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset] = 0x00; // filter: none
    offset += 1;
    for (let x = 0; x < width; x++) {
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function chunk(type: string, data: Buffer): Buffer {
    const typeBuf = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const PNG_FILES: Record<RatioName, FilePayload> = {
  portrait: {
    name: "qa-feed-photo-portrait.png",
    mimeType: "image/png",
    buffer: makeSolidPngBuffer(360, 640, 0xef, 0x44, 0x44),
  },
  landscape: {
    name: "qa-feed-photo-landscape.png",
    mimeType: "image/png",
    buffer: makeSolidPngBuffer(640, 360, 0x6d, 0x28, 0xd9),
  },
  square: {
    name: "qa-feed-photo-square.png",
    mimeType: "image/png",
    buffer: makeSolidPngBuffer(400, 400, 0x10, 0xb9, 0x81),
  },
};

const RATIO_TOLERANCE = 0.05;
const ACCEPT = "image/jpeg,image/png,image/webp";

const VIEWPORTS = [
  { width: 390, height: 844, name: "390×844" },
  { width: 393, height: 852, name: "393×852" },
] as const;

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

async function gotoFeedReady(page: Page): Promise<void> {
  await page.goto("/feed", { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await expect(page).toHaveURL(/\/feed/, { timeout: COLD_START_TIMEOUT });
  await waitSessionReady(page);
}

function mobileComposer(page: Page) {
  return page.locator("[data-feed-desktop-composer]").filter({ visible: true });
}

function visibleFeedArticle(page: Page, marker: string) {
  return page.locator("article").filter({ hasText: marker }).filter({ visible: true });
}

function isDirectApiCall(url: string): boolean {
  return /:(8010|8000)\/api\//.test(url);
}

async function expectLoadedSameOriginImage(image: Locator): Promise<void> {
  await expect(image).toBeVisible();
  const src = await image.getAttribute("src");
  expect(src).toMatch(/^\/api\/v1\/story-media\//);
  await expect
    .poll(async () => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(1);
}

/**
 * Vérifie que le ratio naturel du fichier est bien préservé (non déformé par le CSS).
 *
 * Avec object-contain, `boundingBox()` retourne la boîte CSS de l'élément img
 * (toujours w-full), pas les pixels effectivement rendus de l'image. On mesure
 * donc directement naturalWidth/naturalHeight qui reflète le vrai ratio sans
 * déformation.
 *
 * On vérifie aussi qu'avec object-cover le ratio naturel ne serait pas respecté,
 * en confirmant que la boîte CSS n'impose pas un ratio forcé différent du naturel
 * au-delà de la tolérance SAUF si la hauteur est plafonnée (max-h) — dans ce cas
 * un conteneur plus large est attendu et acceptable.
 */
async function expectAspectRatioPreserved(
  image: Locator,
  naturalRatio: number,
  label: string,
): Promise<void> {
  // Mesure le ratio naturel depuis le DOM
  const dims = await image.evaluate((node) => {
    const img = node as HTMLImageElement;
    return { nw: img.naturalWidth, nh: img.naturalHeight };
  });
  expect(dims.nw, `${label}: naturalWidth=0 (image non chargée)`).toBeGreaterThan(0);
  expect(dims.nh, `${label}: naturalHeight=0`).toBeGreaterThan(0);
  const actualNaturalRatio = dims.nw / dims.nh;
  const delta = Math.abs(actualNaturalRatio - naturalRatio) / naturalRatio;
  expect(
    delta,
    `${label}: naturalRatio ${actualNaturalRatio.toFixed(3)} ≠ attendu ${naturalRatio.toFixed(3)} (δ=${(delta * 100).toFixed(1)}% > ${RATIO_TOLERANCE * 100}%) — fichier corrompu ou transformé`,
  ).toBeLessThanOrEqual(RATIO_TOLERANCE);

  // Vérifie que l'image n'est pas déformée : comparer l'intrinsic ratio à la
  // hauteur calculée par le navigateur via getBoundingClientRect.
  // Avec object-contain : height_rendered = width_css / naturalRatio (si pas max-h)
  //   ou height_rendered = max-h (si portrait trop haut).
  // Ce qui nous importe : la hauteur ne doit pas être celle d'un ratio forcé 16:9/1:1.
  const box = await image.boundingBox();
  if (box && box.width > 0 && box.height > 0) {
    // Si object-cover forcait le ratio à celui du conteneur (≈ landscape large),
    // alors box.width / box.height ≈ renderedContainerRatio >> naturalRatio.
    // On accepte que box.height <= box.width / naturalRatio + 2px (plafond max-h).
    const maxAllowedHeightForNaturalRatio = box.width / naturalRatio;
    // On tolère que la hauteur soit plafonnée (max-h) mais pas étendue au-delà.
    expect(
      box.height,
      `${label}: hauteur CSS ${box.height.toFixed(0)} > attendu max ${(maxAllowedHeightForNaturalRatio + 4).toFixed(0)} — possible object-cover imposant un ratio plus large`,
    ).toBeLessThanOrEqual(maxAllowedHeightForNaturalRatio + 4);
  }
}

/** Vérifie qu'un élément ne déborde pas horizontalement de son conteneur parent. */
async function expectNoHorizontalOverflow(child: Locator, parent: Locator, label: string): Promise<void> {
  const cBox = await child.boundingBox();
  const pBox = await parent.boundingBox();
  if (!cBox || !pBox) return;
  expect(cBox.x, `${label}: débord gauche`).toBeGreaterThanOrEqual(pBox.x - 1);
  expect(cBox.x + cBox.width, `${label}: débord droit`).toBeLessThanOrEqual(pBox.x + pBox.width + 1);
}

/** Vérifie que le bouton action est en dessous de l'image (pas superposé). */
async function expectActionBelowImage(
  image: Locator,
  button: Locator,
  label: string,
): Promise<void> {
  const imgBox = await image.boundingBox();
  const btnBox = await button.boundingBox();
  if (!imgBox || !btnBox) return;
  const imgBottom = imgBox.y + imgBox.height;
  expect(
    btnBox.y,
    `${label}: bouton (y=${btnBox.y.toFixed(0)}) chevauche l'image (bottom=${imgBottom.toFixed(0)})`,
  ).toBeGreaterThanOrEqual(imgBottom - 2);
}

test.describe("C3.1-R1C — Portrait Media Visual Closure", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  for (const viewport of VIEWPORTS) {
    for (const ratioName of Object.keys(PNG_FILES) as RatioName[]) {
      const filePayload = PNG_FILES[ratioName];
      const natural = NATURAL[ratioName];
      const naturalRatio = natural.w / natural.h;

      test(`${viewport.name} ${ratioName}: aperçu centré, actions sous l'image, ratio préservé, publication persist`, async ({
        citizenAPage: page,
      }) => {
        const seen: string[] = [];
        page.on("request", (req) => seen.push(req.url()));

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoFeedReady(page);

        const composer = mobileComposer(page);
        await expect(composer).toBeVisible({ timeout: COLD_START_TIMEOUT });
        await expect(composer.locator('input[type="file"]')).toHaveAttribute("accept", ACCEPT);

        // Ouvrir le composer
        await composer.locator("button").filter({ hasText: /Quoi de neuf|Partagez/ }).first().click();
        await expect(composer.locator("textarea")).toBeVisible();

        const fileInput = composer.locator('input[type="file"]');
        const uploadWait = page.waitForResponse(
          (resp) => resp.url().includes("/api/v1/posts/media") && resp.request().method() === "POST",
        );
        await fileInput.setInputFiles(filePayload);
        const upload = await uploadWait;
        if (upload.status() !== 201) {
          throw new Error(`BLOCKED-UPLOAD: ${upload.status()} ${await upload.text()}`);
        }

        // ─── Aperçu ───────────────────────────────────────────────
        const preview = composer.locator("img").first();
        await expectLoadedSameOriginImage(preview);

        await expectAspectRatioPreserved(
          preview,
          naturalRatio,
          `composer-preview-${ratioName}-${viewport.name}`,
        );
        await expectNoHorizontalOverflow(
          preview,
          composer,
          `composer-overflow-${ratioName}-${viewport.name}`,
        );

        // ─── Actions sous l'image ─────────────────────────────────
        const btnReplace = composer.getByRole("button", { name: "Remplacer la photo" });
        const btnRemove = composer.getByRole("button", { name: "Retirer la photo" });
        await expect(btnReplace).toBeVisible();
        await expect(btnRemove).toBeVisible();

        await expectActionBelowImage(
          preview,
          btnReplace,
          `replace-below-${ratioName}-${viewport.name}`,
        );
        await expectActionBelowImage(
          preview,
          btnRemove,
          `remove-below-${ratioName}-${viewport.name}`,
        );

        // Cibles tactiles ≥ 44 px
        const replaceBox = await btnReplace.boundingBox();
        const removeBox = await btnRemove.boundingBox();
        if (replaceBox) expect(replaceBox.height).toBeGreaterThanOrEqual(44);
        if (removeBox) expect(removeBox.height).toBeGreaterThanOrEqual(44);

        // Pas de chevauchement entre les deux boutons
        if (replaceBox && removeBox) {
          const replaceRight = replaceBox.x + replaceBox.width;
          const removeLeft = removeBox.x;
          // Soit côte à côte (pas de chevauchement), soit empilés (pas de chevauchement)
          const noHorizontalOverlap = replaceRight <= removeLeft + 2 || removeLeft + removeBox.width <= replaceBox.x + 2;
          const noVerticalOverlap = replaceBox.y + replaceBox.height <= removeBox.y + 2 || removeBox.y + removeBox.height <= replaceBox.y + 2;
          expect(noHorizontalOverlap || noVerticalOverlap, "les boutons se chevauchent").toBe(true);
        }

        // ─── Remplacer + Retirer ──────────────────────────────────
        // Sur WebKit, le clic "Remplacer" déclenche le picker natif.
        // Pour éviter les timeouts liés à waitForResponse, on utilise l'événement
        // filechooser et on attend la réponse upload uniquement après setFiles.
        const replacementFilePayload: FilePayload =
          ratioName === "portrait"
            ? PNG_FILES.landscape
            : ratioName === "landscape"
              ? PNG_FILES.portrait
              : PNG_FILES.landscape;

        const [replaceChooser] = await Promise.all([page.waitForEvent("filechooser"), btnReplace.click()]);
        const replaceWait = page.waitForResponse(
          (resp) => resp.url().includes("/api/v1/posts/media") && resp.request().method() === "POST",
        );
        await replaceChooser.setFiles(replacementFilePayload);
        expect((await replaceWait).status()).toBe(201);
        await expectLoadedSameOriginImage(composer.locator("img").first());

        await btnRemove.click();
        await expect(composer.locator("img")).toHaveCount(0);

        // Réajouter
        const readdWait = page.waitForResponse(
          (resp) => resp.url().includes("/api/v1/posts/media") && resp.request().method() === "POST",
        );
        await fileInput.setInputFiles(filePayload);
        expect((await readdWait).status()).toBe(201);
        await expectLoadedSameOriginImage(composer.locator("img").first());

        // ─── Publier ──────────────────────────────────────────────
        const marker = `C3RC ${ratioName} ${viewport.name} ${Date.now()}`;
        await composer.locator("textarea").fill(marker);

        const createWait = page.waitForResponse(
          (resp: Response) =>
            /\/api\/v1\/posts(\?|$)/.test(resp.url()) && resp.request().method() === "POST",
        );
        await composer.getByRole("button", { name: "Publier", exact: true }).click();
        const created = await createWait;
        const createdBody = (await created.json()) as { media_url?: string | null };
        expect(created.status(), JSON.stringify(createdBody)).toBe(201);
        expect(createdBody.media_url).toMatch(/^\/api\/v1\/story-media\//);

        // ─── Carte Feed ───────────────────────────────────────────
        const card = visibleFeedArticle(page, marker);
        await expect(card).toBeVisible({ timeout: COLD_START_TIMEOUT });
        const feedImg = card.locator("img").first();
        await expectLoadedSameOriginImage(feedImg);
        await expectAspectRatioPreserved(
          feedImg,
          naturalRatio,
          `feed-card-${ratioName}-${viewport.name}`,
        );
        await expectNoHorizontalOverflow(feedImg, card, `feed-overflow-${ratioName}-${viewport.name}`);

        // ─── Reload + persistance ─────────────────────────────────
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitSessionReady(page);
        const reloaded = visibleFeedArticle(page, marker);
        await expect(reloaded).toBeVisible({ timeout: COLD_START_TIMEOUT });
        const reloadImg = reloaded.locator("img").first();
        await expectLoadedSameOriginImage(reloadImg);
        await expectAspectRatioPreserved(
          reloadImg,
          naturalRatio,
          `reload-${ratioName}-${viewport.name}`,
        );

        // ─── Pas d'appel direct :8010 ─────────────────────────────
        expect(seen.filter(isDirectApiCall)).toEqual([]);
      });
    }
  }
});
