import { resolve } from "node:path";

import type { Locator, Page, Response } from "@playwright/test";

import { expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT } from "../cold-start";

/**
 * C3.1-R1C — preuve desktop du contrat Photo avant toute parité mobile.
 *
 * Si POST /posts/media n'est pas 201 sur yunicity_qa, STOP :
 * ne pas copier un flux cassé vers le composer mobile.
 */

const QA_PHOTO = resolve(process.cwd(), "e2e/fixtures/qa-feed-photo.png");
const ACCEPT = "image/jpeg,image/png,image/webp";

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

function desktopComposer(page: Page) {
  return page.locator('section[aria-label="Publier sur le fil local"]:not(.web-mobile-feed-only)');
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

test.describe("C3.1-R1C — Feed composer photo desktop", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("desktop 1366 : Photo = input fichier, upload /posts/media, aperçu, persist après reload", async ({
    citizenAPage: page,
  }) => {
    const seen: string[] = [];
    page.on("request", (request) => {
      seen.push(request.url());
    });

    await page.setViewportSize({ width: 1366, height: 900 });
    await gotoFeedReady(page);

    const composer = desktopComposer(page);
    await expect(composer).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(composer.locator('input[type="url"]')).toHaveCount(0);
    await expect(composer.getByPlaceholder(/URL de l’image/)).toHaveCount(0);

    const fileInput = composer.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute("accept", ACCEPT);

    const uploadWait = page.waitForResponse(
      (response) => response.url().includes("/api/v1/posts/media") && response.request().method() === "POST",
    );
    await fileInput.setInputFiles(QA_PHOTO);
    const upload = await uploadWait;
    const uploadBody = await upload.text();
    // eslint-disable-next-line no-console
    console.log(`DESKTOP-UPLOAD status=${upload.status()} url=${upload.url()} body=${uploadBody}`);

    const forbidden = seen.filter(isDirectApiCall);
    expect(forbidden, `appels navigateur directs vers l'API: ${forbidden.join(", ")}`).toEqual([]);
    expect(upload.url().startsWith("http://localhost:3002/api/v1/posts/media")).toBe(true);

    if (upload.status() !== 201) {
      throw new Error(
        `BLOCKED-UPLOAD-CONTRACT: POST /posts/media status=${upload.status()} body=${uploadBody}`,
      );
    }

    const preview = composer.locator("img").first();
    await expect(preview).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expectLoadedSameOriginImage(preview);

    const marker = `QA photo desktop ${Date.now()}`;
    await composer.locator("textarea").fill(marker);

    const createWait = page.waitForResponse(
      (response: Response) =>
        /\/api\/v1\/posts(\?|$)/.test(response.url()) && response.request().method() === "POST",
    );
    await composer.getByRole("button", { name: "Publier", exact: true }).click();
    const created = await createWait;
    const createdBody = (await created.json()) as { media_url?: string | null; detail?: unknown };
    expect(created.status(), JSON.stringify(createdBody)).toBe(201);
    expect(createdBody.media_url).toMatch(/^\/api\/v1\/story-media\//);
    expect(createdBody.media_url).not.toMatch(/localhost|127\.0\.0\.1/i);

    const card = visibleFeedArticle(page, marker);
    await expect(card).toBeVisible({ timeout: COLD_START_TIMEOUT });
    const feedImg = card.locator("img").first();
    await expect(feedImg).toBeVisible();
    await expectLoadedSameOriginImage(feedImg);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitSessionReady(page);
    const reloaded = visibleFeedArticle(page, marker);
    await expect(reloaded).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expectLoadedSameOriginImage(reloaded.locator("img").first());

    const mediaGets = seen.filter((url) => url.includes("/api/v1/story-media/"));
    expect(mediaGets.length).toBeGreaterThan(0);
    expect(
      mediaGets.filter(isDirectApiCall),
      `médias via :8010/:8000: ${mediaGets.filter(isDirectApiCall).join(", ")}`,
    ).toEqual([]);
    expect(mediaGets.every((url) => url.startsWith("http://localhost:3002/api/v1/story-media/"))).toBe(
      true,
    );
  });
});
