import type { Locator, Page } from "@playwright/test";

import { expect, testCitizen as test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT } from "../cold-start";
import {
  MODAL_SURFACES,
  assertBottomNavInteractiveAgain,
  assertBottomNavUnreachable,
  assertModalLayering,
  assertNoOverlayResidue,
  assertPointerOnBottomNavIsAbsorbed,
  openModalSurfaceReady,
} from "../overlay-contract";
import { scrollToStableBottom } from "../scroll";

/**
 * C3.1-R1E — Fiabilité surfaces modales / bottom navigation.
 *
 * Sous 640 px, Explorer et Menu sont des `Drawer` (bas) et Créer un `Dialog` (centré).
 * Cette spec prouve, pour les TROIS surfaces et sur toute la matrice mobile, que la
 * bottom-nav n'est jamais interactive derrière une surface modale — et qu'elle le
 * redevient intégralement après fermeture.
 *
 * Les scénarios déjà couverts ailleurs ne sont pas dupliqués :
 *   - exclusivité/superseded ≥ 640 px, frontière 639→640, Popover desktop non modal
 *     → `10-navigation-functions.spec.ts` ;
 *   - contrats header mobile et fin de scroll → `13-mobile-safari-closure.spec.ts`.
 */

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844, name: "390x844" },
  { width: 393, height: 852, name: "393x852" },
  { width: 639, height: 900, name: "639x900" },
] as const;

const EXPLORER_LABEL = "Explorer Reims";
const MENU_LABEL = "Menu Yunicity";

async function gotoFeedReady(page: Page): Promise<void> {
  await page.goto("/feed", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/feed/, { timeout: COLD_START_TIMEOUT });
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

function surfaceTrigger(page: Page, label: string): Locator {
  return page.getByRole("button", { name: label }).locator("visible=true").first();
}

/**
 * Restitution du focus au déclencheur.
 *
 * Sur WebKit, Playwright rapporte le bouton restauré comme `inactive` malgré
 * `OverlayPanel.focus()` — limitation déjà documentée et assumée dans
 * `13-mobile-safari-closure.spec.ts`. Chromium prouve la restitution ; la revue iPhone
 * réelle confirmera Safari. Aucune autre assertion n'est relâchée.
 */
async function expectTriggerFocusRestored(trigger: Locator, label: string): Promise<void> {
  if (test.info().project.name.includes("webkit")) {
    await expect(trigger, `${label} : déclencheur disparu après fermeture`).toBeVisible();
    return;
  }
  await expect(trigger, `${label} : focus non restitué au déclencheur`).toBeFocused();
}

test.describe("C3.1-R1E — surfaces modales vs bottom navigation", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  for (const viewport of MOBILE_VIEWPORTS) {
    for (const surface of MODAL_SURFACES) {
      test(`${viewport.name} ${surface.id} — bottom-nav neutralisée sous la surface, puis rendue`, async ({
        citizenAPage: page,
      }) => {
        const label = `${viewport.name} ${surface.id}`;
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoFeedReady(page);

        // ── Ouverture avec readiness produit explicite ─────────────────────
        await openModalSurfaceReady(page, surface.label);

        // ── Contrat de couches ────────────────────────────────────────────
        const state = await assertModalLayering(page, label);

        // ── Aucune destination de bottom-nav atteignable ───────────────────
        assertBottomNavUnreachable(state, label);

        // ── Vrai geste pointeur aux coordonnées de la bottom-nav ───────────
        // (le contrat « clic backdrop ferme sans traverser » est vérifié dans le
        // helper partagé dès que le point relevé tombe sur le backdrop)
        await assertPointerOnBottomNavIsAbsorbed(page, state, label);

        // ── Escape ferme, focus restitué, aucun résidu ─────────────────────
        await gotoFeedReady(page);
        const trigger = surfaceTrigger(page, surface.label);
        await openModalSurfaceReady(page, surface.label);
        await page.keyboard.press("Escape");
        await assertNoOverlayResidue(page, `${label} après Escape`);
        await expectTriggerFocusRestored(trigger, label);

        // ── La bottom-nav redevient interactive : un seul clic navigue ─────
        await assertBottomNavInteractiveAgain(page, label);
      });
    }
  }

  test("390x844 — superseded : Menu puis Explorer ne laisse qu'Explorer, bottom-nav toujours neutralisée", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoFeedReady(page);

    await openModalSurfaceReady(page, MENU_LABEL);

    // Ctrl+K : seul chemin utilisateur vers Explorer quand une surface modale est
    // ouverte (tout le chrome est inerte). Il exerce donc réellement `superseded`.
    await page.keyboard.press("Control+K");
    await expect(
      page.getByRole("dialog", { name: EXPLORER_LABEL }),
      "superseded : Explorer non ouvert",
    ).toBeVisible({ timeout: COLD_START_TIMEOUT });
    await expect(
      page.getByRole("navigation", { name: MENU_LABEL }),
      "superseded : Menu encore présent",
    ).toHaveCount(0);
    await expect(
      page.locator('[data-yunicity-overlay][data-yunicity-overlay-state="entered"]'),
      "superseded : plusieurs surfaces montées",
    ).toHaveCount(1, { timeout: COLD_START_TIMEOUT });

    const state = await assertModalLayering(page, "390x844 superseded");
    assertBottomNavUnreachable(state, "390x844 superseded");

    await page.keyboard.press("Escape");
    await assertNoOverlayResidue(page, "390x844 superseded");
  });

  test("390x844 — au scroll maximal, chaque surface neutralise la bottom-nav puis la restitue", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const surface of MODAL_SURFACES) {
      const label = `max-scroll ${surface.id}`;
      await gotoFeedReady(page);
      await scrollToStableBottom(page);

      await openModalSurfaceReady(page, surface.label);
      const state = await assertModalLayering(page, label);
      assertBottomNavUnreachable(state, label);
      await assertPointerOnBottomNavIsAbsorbed(page, state, label);
    }

    // Après la dernière fermeture, la bottom-nav répond de nouveau au premier clic.
    await gotoFeedReady(page);
    await assertBottomNavInteractiveAgain(page, "max-scroll restitution");
  });
});
