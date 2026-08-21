import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import { expectExactlyOneMain, readLandmarkState } from "../landmark-assertions";

/**
 * C3.1-T3 — Explorer, Menu Yunicity et Hub Créer : primitives partagées,
 * coordinateur exclusif, preuves connecté + visiteur aux paliers 390 / 900 / 1366.
 */
const EXPLORER_LABEL = "Explorer Reims";
const MENU_LABEL = "Menu Yunicity";
const CREATE_LABEL = "Créer";

const ACCEPTANCE_VIEWPORTS = [
  { width: 390, height: 844, name: "390", explorerOverlay: "bottom", menuOverlay: "bottom" },
  { width: 900, height: 900, name: "900", explorerOverlay: "center", menuOverlay: "right" },
  { width: 1366, height: 900, name: "1366", explorerOverlay: "center", menuOverlay: "popover" },
] as const;

const TECHNICAL_TRANSITIONS = [
  { from: 639, to: 640 },
  { from: 1279, to: 1280 },
  { from: 1280, to: 1279 },
] as const;

const PUBLIC_DISCOVERY_ROUTES = ["/neighborhoods", "/tribes", "/places"] as const;

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

async function overlayRoots(page: Page) {
  return page.evaluate(() => ({
    dialogCount: document.querySelectorAll('[role="dialog"]').length,
    overlayRoots: document.querySelectorAll("[data-yunicity-overlay-root]").length,
    popoverPanels: document.querySelectorAll("[data-yunicity-popover-panel]").length,
    backdrops: document.querySelectorAll("[data-yunicity-overlay-backdrop]").length,
    bodyOverflow: document.body.style.overflow,
  }));
}

async function openExplorer(page: Page) {
  const trigger = page.getByRole("button", { name: EXPLORER_LABEL }).locator("visible=true").first();
  await expect(trigger).toBeVisible({ timeout: COLD_START_TIMEOUT });
  await expect(trigger).toBeEnabled({ timeout: COLD_START_TIMEOUT });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
}

async function openMenu(page: Page) {
  const trigger = page.getByRole("button", { name: MENU_LABEL }).locator("visible=true").first();
  await expect(trigger).toBeVisible({ timeout: COLD_START_TIMEOUT });
  await expect(trigger).toBeEnabled({ timeout: COLD_START_TIMEOUT });
  await trigger.click();
  const menuSurface = page
    .getByRole("dialog", { name: MENU_LABEL })
    .or(page.getByRole("navigation", { name: MENU_LABEL }));
  await expect(menuSurface.first()).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
}

async function openCreate(page: Page) {
  const trigger = page.getByRole("button", { name: new RegExp(CREATE_LABEL, "i") }).locator("visible=true").first();
  await expect(trigger).toBeVisible({ timeout: COLD_START_TIMEOUT });
  await expect(trigger).toBeEnabled({ timeout: COLD_START_TIMEOUT });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: CREATE_LABEL })).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
}

/** Déclenche Créer sous backdrop modal — le hit-test est bloqué ; le click DOM natif reste valide. */
async function openCreateFromChromeWhileOverlayOpen(page: Page) {
  await page.evaluate((label) => {
    const trigger = Array.from(document.querySelectorAll("button")).find((button) => {
      if (button.getAttribute("aria-label") === label) {
        return button.closest(".web-sidebar-aside, .citizen-top-nav") !== null;
      }
      const text = button.textContent?.trim();
      return text === label && button.closest(".citizen-top-nav") !== null;
    });
    trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }, CREATE_LABEL);
  await expect(page.getByRole("dialog", { name: CREATE_LABEL })).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
}

function menuNavigation(page: Page) {
  return page.getByRole("navigation", { name: MENU_LABEL }).first();
}

test.describe("C3.1-T3 — fonctions de navigation", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  for (const viewport of ACCEPTANCE_VIEWPORTS) {
    test(`${viewport.name} — Explorer connecté ouvre la primitive attendue`, async ({
      citizenAPage: page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoCold(page, "/feed", /\/feed/);
      await waitSessionReady(page);

      await openExplorer(page);
      const explorerDialog = page.getByRole("dialog", { name: EXPLORER_LABEL });
      const marker = page.locator(`[data-yunicity-overlay="${viewport.explorerOverlay}"]`).first();
      await expect(marker).toBeVisible();

      await expect(explorerDialog.getByText("Aucune recherche récente")).toBeVisible();
      await expect(explorerDialog.getByText("Connectez-vous pour rechercher dans Reims et accéder aux résultats.")).toHaveCount(0);
      await expect(explorerDialog.getByText("Lieu populaire")).toHaveCount(0);
      await expect(explorerDialog.getByText("Événement recommandé")).toHaveCount(0);

      const input = explorerDialog.getByRole("searchbox");
      await expect(input).toBeFocused();
      await expect(explorerDialog.getByRole("button", { name: "Rechercher" })).toBeDisabled();

      await input.fill("ab");
      await expect(explorerDialog.getByText("Aucune recherche récente")).toHaveCount(0);
      await expect(explorerDialog.getByRole("button", { name: "Rechercher" })).toBeEnabled();

      await input.fill("   ");
      await expect(explorerDialog.getByText("Aucune recherche récente")).toBeVisible();
      await expect(explorerDialog.getByRole("button", { name: "Rechercher" })).toBeDisabled();

      await input.fill("marché");
      await explorerDialog.getByRole("button", { name: "Rechercher" }).click();
      await expect(page).toHaveURL(/\/search\?q=march/, { timeout: COLD_START_TIMEOUT });
      await expect(page).toHaveURL(/city=Reims/);

      const roots = await overlayRoots(page);
      expect(roots.dialogCount).toBe(0);
    });
  }

  for (const viewport of ACCEPTANCE_VIEWPORTS) {
    test(`${viewport.name} — visiteur Explorer : explication honnête sans appel Search`, async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const searchRequests: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("/api/v1/search")) {
          searchRequests.push(request.url());
        }
      });

      await gotoCold(page, "/neighborhoods", /\/neighborhoods/);
      await waitSessionReady(page);
      await openExplorer(page);

      const explorerDialog = page.getByRole("dialog", { name: EXPLORER_LABEL });
      const hint = explorerDialog.getByText(
        "Connectez-vous pour rechercher dans Reims et accéder aux résultats.",
      );
      const login = explorerDialog.getByRole("link", { name: "Se connecter" });
      const register = explorerDialog.getByRole("link", { name: "Créer un compte" });
      await expect(hint).toBeVisible();
      await expect(login).toBeVisible();
      await expect(register).toBeVisible();

      const hintBox = await hint.boundingBox();
      const loginBox = await login.boundingBox();
      expect(hintBox).toBeTruthy();
      expect(loginBox).toBeTruthy();
      expect(hintBox!.y).toBeLessThan(loginBox!.y);

      const describedBy = await explorerDialog.getByRole("searchbox").getAttribute("aria-describedby");
      expect(describedBy).toBe("explorer-visitor-hint");
      await expect(page.locator("#explorer-visitor-hint")).toHaveText(
        "Connectez-vous pour rechercher dans Reims et accéder aux résultats.",
      );

      const href = await login.getAttribute("href");
      expect(href).toContain("/login");
      expect(decodeURIComponent(new URL(href!, page.url()).searchParams.get("next")!)).toBe("/search");
      await expect(register).toHaveAttribute("href", "/register");

      await explorerDialog.getByRole("searchbox").fill("marché");
      const typedHref = await login.getAttribute("href");
      const next = decodeURIComponent(new URL(typedHref!, page.url()).searchParams.get("next")!);
      expect(next).toMatch(/^\/search\?q=/);
      expect(next.startsWith("http")).toBe(false);
      expect(searchRequests).toHaveLength(0);

      await context.close();
    });
  }

  test("raccourci Ctrl+K ouvre Explorer ; ignoré dans un champ éditable", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await gotoCold(page, "/feed", /\/feed/);
    await waitSessionReady(page);

    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toHaveCount(0);

    const explorerTrigger = page.getByRole("button", { name: EXPLORER_LABEL }).first();
    await explorerTrigger.focus();
    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(explorerTrigger).toBeFocused();

    await page.locator("textarea").first().click();
    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toHaveCount(0);
  });

  for (const viewport of ACCEPTANCE_VIEWPORTS) {
    test(`${viewport.name} — Menu connecté : entrées et routes`, async ({ citizenAPage: page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoCold(page, "/feed", /\/feed/);
      await waitSessionReady(page);

      await openMenu(page);
      const nav = menuNavigation(page);
      await expect(nav.getByRole("link", { name: "Quartiers" }).first()).toBeVisible();
      await expect(nav.getByRole("link", { name: "Discussions" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Passport" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Notifications" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Profil" })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: "Paramètres" })).toHaveCount(0);
      await expect(nav.getByRole("button", { name: "Se déconnecter" })).toHaveCount(0);
      await expect(nav.getByText("Compte")).toHaveCount(0);
      await expect(nav.getByText("Offres et partenaires")).toHaveCount(0);

      if (viewport.menuOverlay === "popover") {
        await expect(page.locator("[data-yunicity-popover-panel]").first()).toBeVisible();
        expect((await overlayRoots(page)).backdrops).toBe(0);
        await page
          .locator("[data-yunicity-popover-panel]")
          .first()
          .getByRole("link", { name: "Quartiers" })
          .click();
      } else {
        await expect(
          page.locator(`[data-yunicity-overlay="${viewport.menuOverlay}"]`).first(),
        ).toBeVisible();
        await nav.getByRole("link", { name: "Quartiers" }).first().click();
      }
      await expect(page).toHaveURL(/\/neighborhoods/, { timeout: COLD_START_TIMEOUT });
      await expect(page.getByRole("navigation", { name: MENU_LABEL })).toHaveCount(0);
    });
  }

  test("visiteur — routes Découvrir publiques via Menu", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/neighborhoods", /\/neighborhoods/);
    await waitSessionReady(page);

    for (const label of ["Quartiers", "Tribus", "Lieux"] as const) {
      await openMenu(page);
      const nav = menuNavigation(page);
      if (label === "Quartiers") {
        await expect(nav.getByRole("link", { name: "Se connecter" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Passport" })).toHaveCount(0);
      }
      await nav.getByRole("link", { name: label }).first().click();
      await expect(page).not.toHaveURL(/\/login/);
      await waitSessionReady(page);
    }

    await context.close();
  });

  for (const viewport of ACCEPTANCE_VIEWPORTS) {
    test(`${viewport.name} — Créer connecté : cinq actions sans soon`, async ({
      citizenAPage: page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoCold(page, "/feed", /\/feed/);
      await waitSessionReady(page);

      await openCreate(page);
      const dialog = page.getByRole("dialog", { name: CREATE_LABEL });
      await expect(dialog.getByText("Souvenir")).toHaveCount(0);
      await expect(dialog.getByText("Bientôt disponible")).toHaveCount(0);
      await expect(dialog.getByText("Animer un lieu")).toHaveCount(0);

      for (const label of [
        "Publier sur le Fil",
        "Créer une Story",
        "Publier une vidéo",
        "Créer une tribu",
        "Proposer un lieu",
      ]) {
        await expect(dialog.getByRole("button", { name: new RegExp(label, "i") })).toBeVisible();
      }

      await dialog.getByRole("button", { name: /Publier sur le Fil/i }).click();
      await expect(page).toHaveURL(/\/feed\/new/, { timeout: COLD_START_TIMEOUT });
      expect((await overlayRoots(page)).dialogCount).toBe(0);
    });
  }

  test("visiteur — Créer affiche login et register", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 900, height: 900 });
    await gotoCold(page, "/neighborhoods", /\/neighborhoods/);
    await waitSessionReady(page);

    await expect(page.getByRole("button", { name: new RegExp(CREATE_LABEL, "i") }).first()).toBeVisible();
    await openCreate(page);
    await expect(page.getByRole("link", { name: "Se connecter" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Créer un compte" })).toHaveAttribute("href", "/register");

    await context.close();
  });

  test("exclusivité — Menu puis Explorer ne laisse qu'Explorer", async ({ citizenAPage: page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await gotoCold(page, "/feed", /\/feed/);
    await waitSessionReady(page);

    const menuTrigger = page.getByRole("button", { name: MENU_LABEL }).first();
    await menuTrigger.click();
    await expect(page.getByRole("navigation", { name: MENU_LABEL }).first()).toBeVisible();

    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toBeVisible();
    await expect(page.getByRole("navigation", { name: MENU_LABEL })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toHaveCount(0);
  });

  test("exclusivité — Explorer puis Créer ne laisse que Créer", async ({ citizenAPage: page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await gotoCold(page, "/feed", /\/feed/);
    await waitSessionReady(page);

    await openExplorer(page);
    await openCreateFromChromeWhileOverlayOpen(page);
    await expect(page.getByRole("dialog", { name: CREATE_LABEL })).toBeVisible();
    await expect(page.getByRole("dialog", { name: EXPLORER_LABEL })).toHaveCount(0);
  });

  for (const transition of TECHNICAL_TRANSITIONS) {
    test(`transition ${transition.from}→${transition.to} ferme Menu sans résidu`, async ({
      citizenAPage: page,
    }) => {
      await page.setViewportSize({ width: transition.from, height: 900 });
      await gotoCold(page, "/feed", /\/feed/);
      await waitSessionReady(page);

      await openMenu(page);
      await page.setViewportSize({ width: transition.to, height: 900 });
      await expect(page.getByRole("navigation", { name: MENU_LABEL })).toHaveCount(0);
      const roots = await overlayRoots(page);
      expect(roots.bodyOverflow).not.toBe("hidden");
    });
  }

  test("1366 — Popover Menu ancré sous le déclencheur visible, sans backdrop", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await gotoCold(page, "/feed", /\/feed/);
    await waitSessionReady(page);
    await openMenu(page);

    const measure = async () =>
      page.evaluate(() => {
        const isVisible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none"
          );
        };
        const trigger = Array.from(
          document.querySelectorAll<HTMLElement>('button[aria-label="Menu Yunicity"]'),
        ).find((button) => isVisible(button) && button.closest(".citizen-top-nav"));
        const panel = document.querySelector<HTMLElement>("[data-yunicity-popover-panel]");
        if (!trigger || !panel) return null;
        const triggerRect = trigger.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        return {
          trigger: {
            top: triggerRect.top,
            right: triggerRect.right,
            bottom: triggerRect.bottom,
            left: triggerRect.left,
          },
          panel: {
            top: panelRect.top,
            right: panelRect.right,
            bottom: panelRect.bottom,
            left: panelRect.left,
          },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          backdrops: document.querySelectorAll("[data-yunicity-overlay-backdrop]").length,
          inertCount: document.querySelectorAll("[inert]").length,
          bodyOverflow: document.body.style.overflow,
        };
      });

    const before = await measure();
    expect(before).toBeTruthy();
    expect(before!.panel.top).toBeGreaterThanOrEqual(before!.trigger.bottom);
    expect(before!.panel.left).toBeGreaterThan(before!.viewport.width / 2);
    expect(Math.abs(before!.panel.right - before!.trigger.right)).toBeLessThanOrEqual(2);
    expect(before!.panel.left).toBeGreaterThanOrEqual(8);
    expect(before!.panel.right).toBeLessThanOrEqual(before!.viewport.width - 8);
    expect(before!.panel.bottom).toBeLessThanOrEqual(before!.viewport.height - 8);
    expect(before!.backdrops).toBe(0);
    expect(before!.inertCount).toBe(0);
    expect(before!.bodyOverflow).not.toBe("hidden");

    await page.evaluate(() => window.scrollTo(0, 120));
    const afterScroll = await measure();
    expect(afterScroll).toBeTruthy();
    expect(Math.abs(afterScroll!.panel.right - afterScroll!.trigger.right)).toBeLessThanOrEqual(2);
    expect(afterScroll!.panel.top).toBeGreaterThanOrEqual(afterScroll!.trigger.bottom);

    await page.setViewportSize({ width: 1280, height: 900 });
    const afterResize = await measure();
    expect(afterResize).toBeTruthy();
    expect(afterResize!.panel.left).toBeGreaterThanOrEqual(8);
    expect(afterResize!.panel.right).toBeLessThanOrEqual(afterResize!.viewport.width - 8);
    expect(afterResize!.panel.top).toBeGreaterThanOrEqual(afterResize!.trigger.bottom);
    expect(Math.abs(afterResize!.panel.right - afterResize!.trigger.right)).toBeLessThanOrEqual(2);
  });

  test("390 — Menu connecté : Passport et Notifications sans groupe Compte", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/feed", /\/feed/);
    await waitSessionReady(page);

    const trigger = page.getByRole("button", { name: MENU_LABEL }).locator("visible=true").first();
    await expect(trigger).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(trigger).toBeEnabled({ timeout: COLD_START_TIMEOUT });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: MENU_LABEL });
    await expect(dialog).toBeVisible({ timeout: COLD_START_TIMEOUT });
    const nav = menuNavigation(page);
    const pageScrollBefore = await page.evaluate(() => window.scrollY);

    await expect(nav.getByRole("link", { name: "Passport" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Notifications" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Discussions" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Profil" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Paramètres" })).toHaveCount(0);
    await expect(nav.getByRole("button", { name: "Se déconnecter" })).toHaveCount(0);
    await expect(nav.getByText("Compte")).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollBefore);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  });

  test("non-régression T2 — quatre destinations et un seul main", async ({ citizenAPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/feed", /\/feed/);
    await waitSessionReady(page);

    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link")).toHaveCount(4);
    expectExactlyOneMain(await readLandmarkState(page), "/feed");
  });
});
