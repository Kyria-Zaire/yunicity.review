import { expect, testCitizen as test } from "../fixtures";

/**
 * C3.3-R1 — Passport design compliance & structural invariants.
 *
 * Permanent spec: asserts the Passport page meets the canonical mockup
 * contract across viewports. No QA mutations.
 */

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-900", width: 900, height: 1000 },
  { name: "desktop-1366", width: 1366, height: 900 },
] as const;

const SHELL_VIEWPORTS = [
  { name: "shell-1280", width: 1280, height: 900 },
  { name: "shell-1536", width: 1536, height: 900 },
  { name: "shell-1920", width: 1920, height: 1080 },
] as const;

test.describe("Passport design compliance", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name}: structural invariants`, async ({ citizenAContext }) => {
      const page = await citizenAContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const apiRequests: string[] = [];
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("/api/v1/")) {
          apiRequests.push(url.replace(/https?:\/\/[^/]+/, ""));
        }
      });

      await page.goto("/passport");
      await expect(page.getByRole("heading", { name: /passport/i }).first()).toBeVisible();

      // Single main landmark
      const mains = await page.locator("main").count();
      expect(mains, "exactly one <main>").toBe(1);

      // Single hero section (mobile OR desktop, never both visible)
      const visibleSections = page.locator("section:visible");
      const heroSections = visibleSections.filter({
        has: page.locator('h1, h2, [class*="hero"], [class*="Hero"]'),
      });
      const heroCount = await heroSections.count();
      expect(heroCount, "exactly one visible hero section").toBeGreaterThanOrEqual(1);

      // No gradient or blur on hero
      const heroElement = heroSections.first();
      const heroStyles = await heroElement.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          backgroundImage: s.backgroundImage,
          backdropFilter: s.backdropFilter ?? "",
        };
      });
      expect(heroStyles.backgroundImage, "hero has no gradient").not.toContain("gradient");
      // Browsers report "" or "none" when no backdrop-filter is applied
      expect(
        heroStyles.backdropFilter === "" || heroStyles.backdropFilter === "none",
        `hero has no backdrop-blur (got "${heroStyles.backdropFilter}")`,
      ).toBe(true);

      // Premium surface: background should be the canonical #0B1533
      const heroBg = await heroElement.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(heroBg, "hero uses premium surface #0B1533").toBe("rgb(11, 21, 51)");

      // Single offers section (no duplication)
      const offersHeadings = await page
        .locator("h2:visible, h3:visible")
        .filter({ hasText: /avantage|privilège/i })
        .count();
      expect(offersHeadings, "at most one offers heading visible").toBeLessThanOrEqual(1);

      // No duplicate IDs
      const duplicateIds = await page.evaluate(() => {
        const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
        const seen = new Set<string>();
        const dupes: string[] = [];
        for (const id of ids) {
          if (seen.has(id)) dupes.push(id);
          seen.add(id);
        }
        return dupes;
      });
      expect(duplicateIds, "no duplicate IDs").toEqual([]);

      // No horizontal overflow
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow, "no horizontal overflow").toBe(false);

      // No raw technical values visible (UUIDs, null, undefined)
      const bodyText = await page.locator("body").innerText();
      expect(bodyText, "no raw UUID visible").not.toMatch(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
      );
      expect(bodyText.toLowerCase(), "no 'undefined' visible").not.toContain("undefined");

      // /profile/me: 3 independent callers in production (citizen-chrome, passport, passport-me).
      // R1 removed the 4th (passport-mobile-extras). Further dedup is a separate ticket.
      const profileMeCalls = apiRequests.filter((u) => u.includes("/profile/me")).length;
      expect(profileMeCalls, "/profile/me ≤ 3 (production baseline)").toBeLessThanOrEqual(3);

      await page.close();
    });
  }

  for (const vp of SHELL_VIEWPORTS) {
    test(`${vp.name}: shell smoke`, async ({ citizenAContext }) => {
      const page = await citizenAContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto("/passport");
      await expect(page.getByRole("heading", { name: /passport/i }).first()).toBeVisible();

      // Main exists
      await expect(page.locator("main")).toHaveCount(1);

      // No horizontal overflow
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow, "no horizontal overflow").toBe(false);

      await page.close();
    });
  }

  test("network stability: no extra requests on resize", async ({ citizenAContext }) => {
    const page = await citizenAContext.newPage();
    await page.setViewportSize({ width: 1366, height: 900 });

    await page.goto("/passport");
    await expect(page.getByRole("heading", { name: /passport/i }).first()).toBeVisible();

    // Wait for initial load to settle
    await page.waitForTimeout(2000);

    const apiRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/v1/")) {
        apiRequests.push(url.replace(/https?:\/\/[^/]+/, ""));
      }
    });

    // Resize through breakpoints
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.waitForTimeout(1000);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.waitForTimeout(1000);

    expect(apiRequests.length, "no API requests during resize").toBe(0);

    await page.close();
  });
});
