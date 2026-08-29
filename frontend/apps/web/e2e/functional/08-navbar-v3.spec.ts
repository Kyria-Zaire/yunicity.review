import { API_URL, bearer, expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import {
  expectExactlyOneMain,
  readLandmarkState,
  waitForCitizenRouteReady,
} from "../landmark-assertions";
import type { Page } from "@playwright/test";

/**
 * C3.1-T2 — Navbar V3 : quatre destinations, Recherche hors de la barre, Créer et Menu
 * toujours visibles, aux trois paliers 390 / 900 / 1366.
 *
 * Données QA réelles, acteur seedé, aucun token fabriqué, aucune attente fixe.
 */
const DESTINATIONS = [
  { label: "Fil local", mobileLabel: "Accueil", path: "/feed" },
  { label: "Vidéos", mobileLabel: "Video", path: "/videos" },
  { label: "Carte", path: "/map" },
  { label: "Sortir", path: "/sortir" },
] as const;

function destinationLabel(
  destination: (typeof DESTINATIONS)[number],
  viewportWidth: number,
): string {
  return viewportWidth < 640 && "mobileLabel" in destination && destination.mobileLabel
    ? destination.mobileLabel
    : destination.label;
}

const SEARCH_LABEL = "Explorer Reims";
const CREATE_LABEL = "Créer";
const MENU_ACCESSIBLE_LABEL = "Menu Yunicity";

const VIEWPORTS = [
  { width: 390, height: 844, name: "mobile 390", menuLabel: "Menu" },
  { width: 900, height: 900, name: "medium 900", menuLabel: "Menu" },
  { width: 1366, height: 900, name: "desktop 1366", menuLabel: "Menu Yunicity" },
] as const;

/** Navigation principale VISIBLE — il ne doit y en avoir qu'une par palier. */
function visibleMainNav(page: Page) {
  return page.getByRole("navigation", { name: "Navigation principale" });
}

async function chromeState(page: Page) {
  return page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none"
      );
    };
    const mains = Array.from(document.querySelectorAll("main"));
    const navs = Array.from(document.querySelectorAll("nav")).filter(isVisible);
    const mainNavs = navs.filter(
      (nav) => nav.getAttribute("aria-label") === "Navigation principale",
    );
    const bottomNavs = Array.from(
      document.querySelectorAll(".web-mobile-strategic-bottom-nav"),
    ).filter(isVisible);
    return {
      mainCount: mains.length,
      nestedMain: mains.some((main) => main.parentElement?.closest("main") !== null),
      roleMainConcurrent: document.querySelectorAll('[role="main"]').length,
      visibleMainNavCount: mainNavs.length,
      visibleBottomNavCount: bottomNavs.length,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

test.describe("Navbar V3 — chrome citoyen", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} : quatre destinations, Créer et Menu visibles, Recherche hors barre`, async ({
      citizenAPage: page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForCitizenRouteReady(
        page,
        "/feed",
        /\/feed(?:\?|$)/,
        page.locator("[data-feed-desktop-composer]").filter({ visible: true }),
      );

      // 1. Exactement quatre destinations dans la navigation principale visible.
      const nav = visibleMainNav(page).filter({ has: page.getByRole("link") }).first();
      await expect(nav).toBeVisible({ timeout: COLD_START_TIMEOUT });
      const navLinks = nav.getByRole("link");
      await expect(navLinks).toHaveCount(DESTINATIONS.length);

      // Le rail medium rend des icônes seules : le nom accessible vient d'`aria-label`,
      // pas du texte. On lit donc le nom accessible, comme le ferait un lecteur d'écran.
      const labels = await navLinks.evaluateAll((links) =>
        links.map((link) => (link.getAttribute("aria-label") ?? link.textContent ?? "").trim()),
      );
      const normalized = labels.filter(Boolean);
      for (const destination of DESTINATIONS) {
        const expected = destinationLabel(destination, viewport.width);
        expect(normalized.join(" | "), `${expected} absent en ${viewport.name}`).toContain(expected);
      }

      // 2. Recherche n'est PAS une destination.
      expect(
        normalized.join(" | ").toLowerCase(),
        `Recherche présente dans la barre en ${viewport.name}`,
      ).not.toContain("recherche");
      await expect(nav.getByRole("link", { name: SEARCH_LABEL })).toHaveCount(0);

      // 3. Accès Recherche fonctionnel HORS des destinations.
      const searchAccess = page.getByRole("button", { name: SEARCH_LABEL }).first();
      await expect(searchAccess, `accès Explorer absent en ${viewport.name}`).toBeVisible();
      await expect(searchAccess).toBeEnabled({ timeout: COLD_START_TIMEOUT });

      // 4. CTA Créer et Menu Yunicity visibles.
      await expect(
        page.getByRole("button", { name: new RegExp(CREATE_LABEL, "i") }).first(),
        `CTA Créer invisible en ${viewport.name}`,
      ).toBeVisible();
      const menuButton = page.getByRole("button", { name: MENU_ACCESSIBLE_LABEL }).first();
      await expect(menuButton, `Menu invisible en ${viewport.name}`).toBeVisible();
      await expect(
        menuButton.locator("span:visible").filter({ hasText: new RegExp(`^${viewport.menuLabel}$`) }),
        `libellé Menu incorrect en ${viewport.name}`,
      ).toHaveCount(1);

      // 5. Structure : pas de double bottom-nav, pas de landmark dupliqué, pas d'overflow.
      const state = await chromeState(page);
      expect(state.visibleBottomNavCount, "double bottom-nav").toBeLessThanOrEqual(1);
      expect(state.visibleMainNavCount, "landmark « Navigation principale » dupliqué").toBe(1);
      expect(state.nestedMain, "<main> imbriqué").toBe(false);
      expect(state.mainCount, "un unique <main> attendu").toBe(1);
      expect(state.roleMainConcurrent, 'role="main" concurrent').toBe(0);
      expect(state.horizontalOverflow, "débordement horizontal").toBeLessThanOrEqual(1);
    });
  }

  test("navigation réelle vers les quatre destinations + état actif (390)", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/feed", /\/feed/);

    for (const destination of DESTINATIONS) {
      const expected = destinationLabel(destination, 390);
      const nav = visibleMainNav(page).filter({ has: page.getByRole("link") }).first();
      await nav.getByRole("link", { name: expected }).click();
      await expect(page).toHaveURL(new RegExp(destination.path), { timeout: COLD_START_TIMEOUT });

      const active = visibleMainNav(page)
        .filter({ has: page.getByRole("link") })
        .first()
        .getByRole("link", { name: expected });
      await expect(active, `aria-current manquant sur ${expected}`).toHaveAttribute(
        "aria-current",
        "page",
        { timeout: COLD_START_TIMEOUT },
      );
    }
  });

  test("landmarks : pas de <main> imbriqué ni dupliqué sur les routes représentatives", async ({
    citizenAPage: page,
    api,
    citizenA,
  }) => {
    const eventsRes = await api.get(`${API_URL}/api/v1/events?city=Reims`, {
      headers: bearer(citizenA),
    });
    const eventId = ((await eventsRes.json()) as { items: Array<{ id: string }> }).items[0]?.id;
    expect(eventId, "événement QA seedé attendu").toBeTruthy();

    const routes = [
      "/feed",
      "/videos",
      "/map",
      "/sortir",
      "/search",
      "/passport",
      `/events/${eventId}`,
    ];

    await page.setViewportSize({ width: 1366, height: 900 });
    const report: string[] = [];

    for (const route of routes) {
      const authoritativeContent =
        route === "/feed"
          ? page.locator("[data-feed-desktop-composer]").filter({ visible: true })
          : page.locator("h1:visible, h2:visible").first();
      await waitForCitizenRouteReady(
        page,
        route,
        new RegExp(`${route.split("?")[0]}(?:\\?|$)`),
        authoritativeContent,
      );
      const state = await readLandmarkState(page);
      report.push(
        `${route} → main=${state.main} nestedMain=${state.nestedMain} ` +
          `roleMainConcurrent=${state.roleMainConcurrent} ` +
          `navPrincipale=${state.visibleMainNavigation}`,
      );
      expectExactlyOneMain(state, route);
    }

    console.log(`LANDMARKS :: ${report.join(" | ")}`);
  });

  test("l'accès Explorer Reims ouvre l'overlay sans quitter la page courante (1366)", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await gotoCold(page, "/feed", /\/feed/);

    await page.getByRole("button", { name: SEARCH_LABEL }).first().click();
    await expect(page.getByRole("dialog", { name: SEARCH_LABEL })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });
    await expect(page).toHaveURL(/\/feed/);
  });
});
