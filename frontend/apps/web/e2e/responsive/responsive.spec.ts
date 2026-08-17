import { API_URL, bearer, expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT } from "../cold-start";

/**
 * Responsive matrix (C3-F0-T3-R1). One worker iterates 3 representative widths per
 * surface (desktop ≥1280, medium 640–1279, mobile ≤639). Invariants: no horizontal
 * overflow of the page body, and a visible navigation landmark (chrome adapts per width).
 */
const VIEWPORTS = [
  { name: "desktop", width: 1366, height: 900 },
  { name: "medium", width: 900, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function overflow(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test.describe("Responsive shell & navigation", () => {
  test("login (visitor) — no overflow, heading visible on 3 widths", async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/login");
      await expect(page.locator("h1:visible").first(), vp.name).toBeVisible();
      expect(await overflow(page), `${vp.name} overflow`).toBeLessThanOrEqual(1);
    }
  });

  for (const path of ["/feed", "/search", "/passport"]) {
    test(`${path} — no overflow + visible nav on 3 widths`, async ({ authedPage }) => {
      for (const vp of VIEWPORTS) {
        await authedPage.setViewportSize({ width: vp.width, height: vp.height });
        await authedPage.goto(path);
        await expect(authedPage, `${vp.name} ${path}`).not.toHaveURL(/\/login/);
        expect(await overflow(authedPage), `${vp.name} ${path} overflow`).toBeLessThanOrEqual(1);
        await expect(authedPage.locator("nav:visible").first(), `${vp.name} ${path} nav`).toBeVisible();
      }
    });
  }
});

test.describe("Responsive detail surfaces (R5 — event / tribe / profile)", () => {
  // Event detail, public tribe and profile/settings on the 3 widths. Invariants: reached (not
  // redirected to login), no horizontal body overflow, a visible landmark, and the surface's
  // main content present (a heading) — content is never fully pushed off the viewport.
  test("event / tribe / profile detail — no overflow + content on 3 widths", async ({
    authedPage,
    sharedUser,
  }) => {
    // 3 surfaces × 3 largeurs = 9 navigations, dont plusieurs premières compilations de
    // route. Ce test mesurait déjà 57 s pour un budget de 60 s ; on lui donne un plafond
    // explicite (C3.1-T2) plutôt que de le laisser flaker. Aucune assertion n'est relâchée.
    test.setTimeout(COLD_START_TEST_TIMEOUT);

    const eventsRes = await authedPage.request.get(`${API_URL}/api/v1/events?city=Reims`, {
      headers: bearer(sharedUser),
    });
    const eventId = ((await eventsRes.json()) as { items: Array<{ id: string }> }).items[0]?.id;
    expect(eventId, "seeded event must exist").toBeTruthy();

    const surfaces: Array<{ label: string; path: string }> = [
      { label: "event-detail", path: `/events/${eventId}?city=Reims` },
      { label: "tribe-public", path: "/tribes/qa-tribu-publique?city=Reims" },
      { label: "profile-edit", path: "/profile/me/edit" },
    ];

    for (const surface of surfaces) {
      for (const vp of VIEWPORTS) {
        await authedPage.setViewportSize({ width: vp.width, height: vp.height });
        await authedPage.goto(surface.path);
        await authedPage.waitForLoadState("networkidle").catch(() => {});
        const tag = `${vp.name} ${surface.label}`;
        await expect(authedPage, tag).not.toHaveURL(/\/login/);
        expect(await overflow(authedPage), `${tag} overflow`).toBeLessThanOrEqual(1);
        // Content present and not pushed off-viewport (detail surfaces can be immersive on
        // mobile — the shell/nav is asserted by the shell tests above, not re-required here).
        await expect(
          authedPage.locator("h1:visible, h2:visible").first(),
          `${tag} heading`,
        ).toBeVisible();
      }
    }
  });
});
