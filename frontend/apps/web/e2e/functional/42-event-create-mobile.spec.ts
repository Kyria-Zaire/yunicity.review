/**
 * MOBILE-EVENT-CREATE-01 — smoke /sortir/create maquette mobile.
 */
import { expect, test } from "../fixtures";

const MOBILE = "[data-event-create-mobile]";
const STEPPER = "[data-event-create-mobile-stepper]";
const WIZARD = "[data-event-create-wizard][data-event-create-wizard-variant='mobile']";
const PREVIEW = "[data-event-create-mobile-preview]";
const ACTION_BAR = "[data-event-create-mobile-action-bar]";

test.describe("Event create mobile shell", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("affiche le wizard mobile étape 1", async ({ citizenAPage }) => {
    await citizenAPage.goto("/sortir/create");
    await expect(citizenAPage.locator(MOBILE)).toBeVisible();
    await expect(citizenAPage.locator("[data-event-create-medium]")).toBeHidden();
    await expect(citizenAPage.locator("[data-event-create-desktop]")).toBeHidden();
    await expect(citizenAPage.locator(STEPPER)).toBeVisible();
    await expect(citizenAPage.getByText("Informations essentielles")).toBeVisible();
    await expect(citizenAPage.getByText("20 %")).toBeVisible();
    await expect(citizenAPage.locator(WIZARD)).toBeVisible();
    await expect(citizenAPage.locator(PREVIEW)).toBeVisible();
    await expect(citizenAPage.locator(ACTION_BAR)).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: /^Brouillon$/ })).toBeVisible();
    await expect(citizenAPage.getByRole("button", { name: /^Continuer$/ })).toBeVisible();
  });
});
