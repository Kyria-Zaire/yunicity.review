import { expect, test } from "../fixtures";

/**
 * Map integration smoke ONLY (C3-F0-T3): the /map route is reachable while
 * authenticated and the app shell/navigation renders. This deliberately does not
 * re-open the Map T1–T6 behaviours (markers, clustering, drawers).
 */
test("map route is reachable and renders the app shell", async ({ authedPage }) => {
  await authedPage.goto("/map");
  await expect(authedPage).not.toHaveURL(/\/login/);
  await expect(authedPage.locator("nav:visible").first()).toBeVisible();
});
