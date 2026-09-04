/**
 * MEDIUM-EVENT-CREATE-01 — smoke /sortir/create maquette medium.
 */
import { expect, test } from "../fixtures";

const MEDIUM = "[data-event-create-medium]";
const STEPPER = "[data-event-create-medium-stepper]";
const WIZARD = "[data-event-create-wizard][data-event-create-wizard-variant='medium']";
const PREVIEW = "[data-event-create-preview]";
const CHECKLIST = "[data-event-create-checklist]";

test.describe("Event create medium shell", () => {
  test.use({ viewport: { width: 768, height: 900 } });

  test("affiche le wizard medium étape 1", async ({ citizenAPage }) => {
    await citizenAPage.goto("/sortir/create");
    await expect(citizenAPage.locator(MEDIUM)).toBeVisible();
    await expect(citizenAPage.locator("[data-event-create-desktop]")).toHaveCount(1);
    await expect(citizenAPage.locator("[data-event-create-desktop]")).toBeHidden();
    await expect(citizenAPage.locator(STEPPER)).toBeVisible();
    await expect(citizenAPage.getByText("Essentiel")).toBeVisible();
    await expect(citizenAPage.locator(WIZARD)).toBeVisible();
    await expect(citizenAPage.locator(PREVIEW)).toBeVisible();
    await expect(citizenAPage.locator(CHECKLIST)).toBeVisible();
    await expect(
      citizenAPage.getByRole("button", { name: /Continuer vers la date et le lieu/i }),
    ).toBeVisible();
  });
});
