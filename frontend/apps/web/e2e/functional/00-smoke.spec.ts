import { API_URL, expect, test } from "../fixtures";

/**
 * Pipeline smoke (C3-F0-T3): the QA web server boots, the login screen renders with
 * real form controls, and the page only talks to local hosts (no external target).
 */
test("login screen renders and talks only to local hosts", async ({ page }) => {
  const foreignRequests: string[] = [];
  page.on("request", (req) => {
    const host = new URL(req.url()).hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      foreignRequests.push(req.url());
    }
  });

  await page.goto("/login");
  // The login screen renders both the mobile and desktop component trees (CSS-toggled),
  // so scope every assertion to the currently visible one.
  await expect(page.locator('input[type="email"]:visible')).toHaveCount(1);
  await expect(page.locator('input[type="password"]:visible')).toHaveCount(1);
  await expect(page.locator("h1:visible").first()).toBeVisible();

  expect(foreignRequests, `unexpected non-local requests:\n${foreignRequests.join("\n")}`).toEqual(
    [],
  );
});

test("QA API is the configured backend", async ({ api }) => {
  const res = await api.get(`${API_URL}/api/v1/health`);
  expect(res.ok()).toBeTruthy();
  expect(new URL(API_URL).hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
});
