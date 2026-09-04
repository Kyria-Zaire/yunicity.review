/**
 * DESKTOP-EVENT-CREATE-01 — smoke /sortir/create maquette Sortir.
 */
import { expect, test } from "../fixtures";

const SHELL = "[data-event-create-header]";
const WIZARD = "[data-event-create-wizard]:not([data-event-create-wizard-variant='medium'])";
const PREVIEW = "[data-event-create-preview]";
const STEPPER = "[data-event-create-stepper]";

test.describe("Event create desktop shell", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("affiche le wizard desktop étape 1", async ({ citizenAPage }) => {
    await citizenAPage.goto("/sortir/create");
    await expect(citizenAPage.locator("[data-event-create-medium]")).toBeHidden();
    await expect(citizenAPage.locator(SHELL)).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Créer un événement" })).toBeVisible();
    await expect(citizenAPage.locator(WIZARD)).toBeVisible();
    await expect(citizenAPage.locator(PREVIEW)).toBeVisible();
    await expect(citizenAPage.locator(STEPPER)).toBeVisible();
    await expect(citizenAPage.getByRole("heading", { name: "Informations essentielles" })).toBeVisible();
    await expect(
      citizenAPage.getByRole("button", { name: /Continuer vers la date et le lieu/i }),
    ).toBeVisible();
  });
});
