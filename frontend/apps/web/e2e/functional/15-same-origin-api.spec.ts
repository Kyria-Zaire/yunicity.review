import type { Page } from "@playwright/test";

import { CITIZEN_A_EMAIL, expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";

const QA_SEEDED_PASSWORD = "StrongPassword1!";
const HERO_TITLE = "Reims, plus proche de vous.";

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

function collectApiLikeUrls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => /\/api\/v1\/|:8010|:8000/i.test(url)),
  );
}

test.describe("C3.1 — same-origin API proxy", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("localhost:3002 login, feed, reload, logout — aucun appel navigateur vers :8010", async ({
    page,
  }) => {
    const seen: string[] = [];
    page.on("request", (request) => {
      seen.push(request.url());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/", /\/(?:$|\?)/);
    await waitSessionReady(page);
    await expect(page.getByRole("heading", { level: 1, name: HERO_TITLE })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });

    await gotoCold(page, "/login", /\/login(\?|$)/);
    await waitSessionReady(page);
    await page.locator('input[type="email"]:visible').fill(CITIZEN_A_EMAIL);
    await page.locator('input[type="password"]:visible').fill(QA_SEEDED_PASSWORD);
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/v1/auth/login") && response.ok(),
      ),
      page.locator('button[type="submit"]:visible').first().click(),
    ]);
    await expect(page).toHaveURL(/\/feed/, { timeout: COLD_START_TIMEOUT });
    await waitSessionReady(page);
    await expect(page.getByRole("button", { name: /Menu compte — Qa Citizen A/ })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitSessionReady(page);
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByRole("button", { name: /Menu compte — Qa Citizen A/ })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });

    await page.getByRole("button", { name: /Menu compte — Qa Citizen A/ }).click();
    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: COLD_START_TIMEOUT });

    const resourceUrls = await collectApiLikeUrls(page);
    const forbidden = [...seen, ...resourceUrls].filter((url) => /:(8010|8000)\b/.test(url));
    expect(forbidden, `appels navigateur directs vers l'API: ${forbidden.join(", ")}`).toEqual([]);

    const loginCalls = seen.filter((url) => url.includes("/api/v1/auth/login"));
    expect(loginCalls.some((url) => url.startsWith("http://localhost:3002/api/v1/"))).toBe(true);
  });
});
