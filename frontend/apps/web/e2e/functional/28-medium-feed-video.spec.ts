import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

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
    test(`${viewport.label} - une seule video apres le premier post`, async ({ authedPage }) => {
      await gotoFeed(authedPage, viewport);

      const order = await authedPage.locator(`${STREAM} > li`).evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-feed-stream-item")),
      );

      expect(order.filter((kind) => kind === "local-video")).toHaveLength(1);
      expect(order.indexOf("local-video")).toBe(order.indexOf("post") + 1);
      await expect(authedPage.locator("[data-feed-desktop-video-section]")).toHaveCount(0);
    });
  }

  test("Recent et Populaire ne recoivent pas de video locale", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    let previous = authedPage.getByRole("tab", { name: "Pour vous", exact: true });
    for (const name of ["Récent", "Populaire"]) {
      const tab = authedPage.getByRole("tab", { name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(previous).toHaveAttribute("aria-selected", "false");
      await expect(authedPage.locator(VIDEO)).toHaveCount(0);
      await expect(
        authedPage.locator(`${STREAM} > [data-feed-stream-item="context-module"]`),
      ).toHaveCount(0);
      previous = tab;
    }
  });
});
