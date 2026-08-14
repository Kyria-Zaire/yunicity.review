import { API_URL, expect, test } from "../fixtures";

test.describe("Auth & session", () => {
  test("registered user session persists across reload", async ({ authedPage }) => {
    await authedPage.goto("/feed");
    await expect(authedPage).not.toHaveURL(/\/login/);
    await expect(authedPage.locator('input[type="password"]:visible')).toHaveCount(0);

    await authedPage.reload();
    await expect(authedPage).not.toHaveURL(/\/login/);
    await expect(authedPage.locator('input[type="password"]:visible')).toHaveCount(0);
  });

  test("login via UI performs a real /auth/login and leaves the login screen", async ({
    page,
    sharedUser,
  }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"]:visible');
    const passwordInput = page.locator('input[type="password"]:visible');
    await emailInput.click();
    await emailInput.pressSequentially(sharedUser.email);
    await passwordInput.click();
    await passwordInput.pressSequentially(sharedUser.password);

    const [loginResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/v1/auth/login")),
      page.locator('button[type="submit"]:visible').first().click(),
    ]);
    const sentBody = loginResponse.request().postData() ?? "";
    expect(
      loginResponse.status(),
      `real login must succeed; sent email matches: ${sentBody.includes(sharedUser.email)}`,
    ).toBe(200);

    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.locator('input[type="password"]:visible')).toHaveCount(0);
  });

  test("auth gate holds for a visitor (protected API 401, no authed chrome)", async ({
    page,
    api,
  }) => {
    // Backend gate is deterministic: a protected resource rejects an unauthenticated call.
    const me = await api.get(`${API_URL}/api/v1/profile/me`);
    expect(me.status(), "protected endpoint must reject a visitor").toBe(401);

    // Browser: a visitor is not treated as authenticated (no logout affordance).
    await page.goto("/profile");
    await expect(page.getByText(/se déconnecter|déconnexion/i)).toHaveCount(0);
  });
});
