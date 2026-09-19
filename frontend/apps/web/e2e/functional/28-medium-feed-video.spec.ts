import type { Page } from "@playwright/test";

import { expect, testCitizen as test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "1279x900", width: 1279, height: 900 },
] as const;

const STREAM = "[data-feed-stream-list]";
const VIDEO = '[data-feed-stream-item="local-video"]';

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator(STREAM)).toBeVisible();
  await expect(page.locator(VIDEO)).toHaveCount(1);
}

test.describe("C3-FEED-R2B - video locale dans le flux medium", () => {
  for (const viewport of MEDIUM) {
    test(`${viewport.label} - une seule video apres le premier post`, async ({ citizenAPage }) => {
      await gotoFeed(citizenAPage, viewport);

      const order = await citizenAPage.locator(`${STREAM} > li`).evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-feed-stream-item")),
      );

      expect(order.filter((kind) => kind === "local-video")).toHaveLength(1);
      expect(order.indexOf("local-video")).toBe(order.indexOf("post") + 1);
      await expect(citizenAPage.locator("[data-feed-desktop-video-section]")).toHaveCount(0);
    });
  }

  test("768 — medium sans onglets Récent/Populaire : vidéo réservée au flux éditorial", async ({
    citizenAPage,
  }) => {
    await gotoFeed(citizenAPage, { width: 768, height: 1024 });

    // Contrat medium actuel (spec 30) : les onglets Pour vous / Récent / Populaire
    // ne sont plus dans la colonne medium — la vidéo locale reste dans le flux unique.
    await expect(citizenAPage.getByRole("tab", { name: "Récent", exact: true })).toHaveCount(0);
    await expect(citizenAPage.getByRole("tab", { name: "Populaire", exact: true })).toHaveCount(0);
    await expect(citizenAPage.locator(VIDEO)).toHaveCount(1);
    await expect(
      citizenAPage.locator(`${STREAM} > [data-feed-stream-item="context-module"]`),
    ).toHaveCount(0);
  });
});
