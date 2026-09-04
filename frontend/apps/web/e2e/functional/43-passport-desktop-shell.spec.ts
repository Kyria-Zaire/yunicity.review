/**
 * DESKTOP-PASSPORT-01 — refonte /passport (mobile + medium + desktop 3 colonnes).
 */
import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const DESKTOP_HERO = "[data-passport-desktop-hero]";
const DESKTOP_EDITORIAL = ".passport-desktop-editorial-only [data-passport-desktop-editorial]";
const MEDIUM_HERO_HEADER = "[data-passport-medium-hero-header]";
const MEDIUM_TAB_NAV = "[data-passport-medium-tab-nav]";
const MEDIUM_CATEGORY_BAR = "[data-passport-medium-category-bar]";
const MEDIUM_RIGHT_RAIL = "[data-passport-medium-right-rail]";
const MEDIUM_DUAL_PANEL = "[data-passport-medium-dual-panel]";
const LEFT_RAIL = "[data-passport-desktop-left-rail]";
const RIGHT_RAIL = "[data-passport-desktop-right-rail]";
const OFFERS = "#passport-desktop-offers";

async function gotoPassport(page: Page, width: number, height = 1024): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/passport");
  await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Chargement de votre passeport/)).toHaveCount(0, { timeout: 45_000 });
}

async function isCssVisible(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) return false;
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    let node: Element | null = el;
    while (node) {
      const computed = window.getComputedStyle(node);
      if (computed.display === "none" || computed.visibility === "hidden") return false;
      node = node.parentElement;
    }
    return true;
  });
}

test.describe("DESKTOP-PASSPORT-01 — shell responsive", () => {
  test("639px — shell mobile maquette (header, navbar, hero, pas de rails)", async ({
    citizenAPage,
  }) => {
    await gotoPassport(citizenAPage, 639);
    await expect(citizenAPage.locator("[data-passport-mobile-header]")).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Votre ville vous réserve plus" })).toBeVisible();
    await expect(citizenAPage.locator(DESKTOP_HERO)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_HERO_HEADER)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_TAB_NAV)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_CATEGORY_BAR)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_RIGHT_RAIL)).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Mon QR Passport" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Prochaine étape" })).toBeVisible();
    await expect(citizenAPage.getByText("Scanner un QR code")).toBeVisible();
    expect(await isCssVisible(citizenAPage, LEFT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, RIGHT_RAIL)).toBe(false);
  });

  test("639px — onglet Offres maquette (navbar, hero, liste, accordéons)", async ({
    citizenAPage,
  }) => {
    await gotoPassport(citizenAPage, 639);
    await citizenAPage.locator(MEDIUM_TAB_NAV).getByRole("button", { name: /^Offres$/ }).click();
    await expect(citizenAPage.locator("[data-passport-mobile-header]")).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Vos avantages locaux" })).toBeVisible();
    await expect(citizenAPage.getByText("Découvrez les offres des partenaires Yunicity.")).toBeVisible();
    await expect(citizenAPage.getByPlaceholder("Rechercher une offre ou un partenaire...")).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: /^Disponibles$/ })).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: /^Enregistrées$/ })).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-offers-status-hero]")).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: "Ouvrir mon Passport" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "À ne pas manquer" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Tous les avantages" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Offres enregistrées" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Comment utiliser une offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Des conditions transparentes" })).toBeVisible();
    expect(await isCssVisible(citizenAPage, LEFT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, "[data-passport-desktop-offers-sidebar]")).toBe(false);
  });

  test("768px — shell medium maquette (tabs, QR/progression, pas de rail Passport)", async ({
    citizenAPage,
  }) => {
    await gotoPassport(citizenAPage, 768);
    await expect(citizenAPage.locator(DESKTOP_HERO)).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Votre ville vous réserve plus" })).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_HERO_HEADER)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_TAB_NAV)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_CATEGORY_BAR)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_RIGHT_RAIL)).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Mon QR Passport" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Prochaine étape" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Vos prochaines étapes" })).toBeVisible();
    expect(await isCssVisible(citizenAPage, LEFT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, RIGHT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, DESKTOP_EDITORIAL)).toBe(false);
    expect(await isCssVisible(citizenAPage, MEDIUM_TAB_NAV)).toBe(true);
  });

  test("768px — panneaux saved/activité medium après les offres", async ({ citizenAPage }) => {
    await gotoPassport(citizenAPage, 768);
    await expect(citizenAPage.locator(OFFERS)).toBeVisible();
    await expect(citizenAPage.locator(MEDIUM_DUAL_PANEL)).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Offres enregistrées" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Activité récente" })).toBeVisible();
  });

  test("1280px — layout 3 colonnes maquette", async ({ citizenAPage }) => {
    await gotoPassport(citizenAPage, 1280);
    await expect(citizenAPage.locator(DESKTOP_EDITORIAL)).toBeVisible();
    await expect(citizenAPage.locator(DESKTOP_HERO)).toBeVisible();
    await expect(citizenAPage.locator(LEFT_RAIL)).toBeVisible();
    await expect(citizenAPage.locator(RIGHT_RAIL)).toBeVisible();
    await expect(citizenAPage.locator(OFFERS)).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Avantages à découvrir" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Partenaires à découvrir" })).toBeVisible();
    await expect(citizenAPage.getByText("Scanner un QR code")).toBeVisible();
    expect(await isCssVisible(citizenAPage, MEDIUM_TAB_NAV)).toBe(false);
    expect(await isCssVisible(citizenAPage, MEDIUM_RIGHT_RAIL)).toBe(false);
  });

  test("1280px — onglet Offres maquette", async ({ citizenAPage }) => {
    await gotoPassport(citizenAPage, 1280);
    await citizenAPage.locator(LEFT_RAIL).getByRole("button", { name: /^Offres$/ }).click();
    await expect(
      citizenAPage.getByRole("heading", {
        name: "Des avantages locaux pour vivre Reims autrement",
      }),
    ).toBeVisible();
    await expect(citizenAPage.getByPlaceholder("Rechercher une offre ou un partenaire...")).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-desktop-offers-tab]")).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-desktop-offers-sidebar]")).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "À ne pas manquer" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Toutes les offres" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Comment utiliser une offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: "Ouvrir mon Passport" })).toBeVisible();
    await expect(citizenAPage.locator(DESKTOP_HERO)).toHaveCount(0);
  });

  test("768px — onglet Offres maquette (hero, panneaux, pas de rail Passport)", async ({ citizenAPage }) => {
    await gotoPassport(citizenAPage, 768);
    await citizenAPage.locator(MEDIUM_TAB_NAV).getByRole("button", { name: /^Offres$/ }).click();
    await expect(
      citizenAPage.getByRole("heading", {
        name: "Des avantages locaux pour vivre Reims autrement",
      }),
    ).toBeVisible();
    await expect(citizenAPage.getByPlaceholder("Rechercher une offre ou un partenaire...")).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-offers-status-hero]")).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: "Ouvrir mon Passport" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "À ne pas manquer" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Toutes les offres" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Comment utiliser une offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Des conditions transparentes" })).toBeVisible();
    expect(await isCssVisible(citizenAPage, LEFT_RAIL)).toBe(false);
    expect(await isCssVisible(citizenAPage, "[data-passport-desktop-offers-sidebar]")).toBe(false);
  });

  test("390px — fiche offre mobile maquette (header, hero, status, rail)", async ({ citizenAPage }) => {
    await citizenAPage.setViewportSize({ width: 390, height: 844 });
    await citizenAPage.goto("/passport/offre/bb08a7b6-61dd-5011-b4f0-c8e152240505");
    await expect(citizenAPage.locator("main").first()).toBeVisible({ timeout: 30_000 });
    await expect(citizenAPage.getByText(/Chargement de votre passeport/)).toHaveCount(0, {
      timeout: 45_000,
    });
    await expect(citizenAPage.locator("[data-passport-offer-mobile-view]")).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-offer-mobile-header]")).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Offre Passport" })).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-offer-mobile-hero]")).toBeVisible();
    await expect(citizenAPage.getByText("OFFRE PASSPORT")).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-offer-status]")).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "À propos de l'offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Comment utiliser cette offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: "Afficher mon QR Passport" })).toBeVisible();
    expect(await isCssVisible(citizenAPage, "[data-passport-offer-desktop-view]")).toBe(false);
  });

  test("768px — fiche offre medium maquette (status rail, colonnes, related rail)", async ({
    citizenAPage,
  }) => {
    await gotoPassport(citizenAPage, 768);
    await citizenAPage.locator(MEDIUM_TAB_NAV).getByRole("button", { name: /^Offres$/ }).click();
    await citizenAPage.getByRole("link", { name: "Voir l'offre" }).first().click();
    await expect(citizenAPage).toHaveURL(/\/passport\/offre\//);
    await expect(citizenAPage.locator("[data-passport-offer-desktop-hero]")).toBeVisible();
    await expect(citizenAPage.locator("[data-passport-offer-status]")).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "À propos de l'offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Comment utiliser cette offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Conditions de l'offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Informations pratiques" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Le partenaire" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Une validation transparente" })).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: "Afficher mon QR Passport" })).toBeVisible();
    await expect(citizenAPage.getByText("Uniquement devant le partenaire")).toBeVisible();
    const related = citizenAPage.locator("[data-passport-offer-related-rail]");
    if ((await related.count()) > 0) {
      await expect(related).toBeVisible();
      await expect(related.getByRole("link", { name: "Voir l'offre" }).first()).toBeVisible();
    }
  });

  test("1280px — fiche offre desktop maquette (hero, QR, infos)", async ({ citizenAPage }) => {
    await gotoPassport(citizenAPage, 1280);
    await citizenAPage.locator(LEFT_RAIL).getByRole("button", { name: /^Offres$/ }).click();
    await citizenAPage.locator("[data-passport-desktop-offers-tab]").getByRole("link", { name: "Voir l'offre" }).first().click();
    await expect(citizenAPage).toHaveURL(/\/passport\/offre\//);
    await expect(citizenAPage.locator("[data-passport-offer-desktop-hero]")).toBeVisible();
    await expect(citizenAPage.getByRole("navigation", { name: "Fil d'Ariane" })).toBeVisible();
    await expect(citizenAPage.getByText("OFFRE PASSPORT")).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: "Enregistrer" })).toBeVisible();
    await expect(citizenAPage.getByRole("link", { name: "Voir sur la carte" }).first()).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "À propos de l'offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Comment utiliser cette offre" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Votre Passport" })).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: "Afficher mon QR Passport" })).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Informations pratiques" })).toBeVisible();
  });
});
