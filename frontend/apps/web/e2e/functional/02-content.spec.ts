import { API_URL, expect, test } from "../fixtures";

test.describe("Feed & Search (browser)", () => {
  test("feed loads authenticated, renders shell + real content, survives reload", async ({
    authedPage,
  }) => {
    const [feedResponse] = await Promise.all([
      authedPage.waitForResponse((r) => /\/api\/v1\/feed(\?|$)/.test(r.url())),
      authedPage.goto("/feed"),
    ]);
    expect(feedResponse.status()).toBe(200);
    await expect(authedPage).not.toHaveURL(/\/login/);
    await expect(authedPage.locator("nav:visible").first()).toBeVisible();
    await expect(authedPage.getByText(/Quoi de neuf à Reims/i).first()).toBeVisible();

    await authedPage.reload();
    await expect(authedPage).not.toHaveURL(/\/login/);
    await expect(authedPage.locator("nav:visible").first()).toBeVisible();
  });

  test("search via the mobile UI returns results for a present term (T2 fix, real request)", async ({
    authedPage,
  }) => {
    await authedPage.goto("/search");
    const box = authedPage.locator("#search-mobile-q");
    await box.fill("reims");
    const [searchResponse] = await Promise.all([
      authedPage.waitForResponse((r) => r.url().includes("/api/v1/search")),
      box.press("Enter"),
    ]);
    expect(searchResponse.status(), "multi-type search must be 200, not 500").toBe(200);
    await expect(authedPage.getByText(/Marché de Reims/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("search via the mobile UI shows an empty state for an absent term", async ({
    authedPage,
  }) => {
    await authedPage.goto("/search");
    const box = authedPage.locator("#search-mobile-q");
    await box.fill("zzqxnotarealterm");
    const [searchResponse] = await Promise.all([
      authedPage.waitForResponse((r) => r.url().includes("/api/v1/search")),
      box.press("Enter"),
    ]);
    expect(searchResponse.status()).toBe(200);
    await expect(
      authedPage.getByText(/aucun résultat|rien trouvé|pas de résultat/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("QA search API contract: multi-type 200 + grouped shape (T2 regression)", async ({ api }) => {
    const filled = await api.get(`${API_URL}/api/v1/search?q=reims&city=Reims`);
    expect(filled.status()).toBe(200);
    const body = (await filled.json()) as { type_filter: string; groups: Record<string, unknown> };
    expect(body.type_filter).toBe("all");
    for (const key of ["events", "organizations", "posts", "offers", "tribes", "users", "neighborhoods"]) {
      expect(body.groups).toHaveProperty(key);
    }
  });
});
