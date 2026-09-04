import { test, expect } from "@playwright/test";

const COLD_START_TIMEOUT = 60_000;

function legalRoot(page: import("@playwright/test").Page, variant: "mobile" | "medium" | "desktop") {
  return page.locator(`[data-legal-${variant}-root]`);
}

test.describe("Pages légales — confidentialité", () => {
  test("desktop : sommaire, sections et CTA paramètres", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/legal/confidentialite", {
      waitUntil: "domcontentloaded",
      timeout: COLD_START_TIMEOUT,
    });

    const root = legalRoot(page, "desktop");
    await expect(root).toBeVisible();
    await expect(root.getByRole("heading", { name: "Politique de confidentialité" })).toBeVisible();
    await expect(root.getByRole("link", { name: /Données que nous collectons/ })).toBeVisible();
    await expect(root.getByRole("link", { name: "Gérer mes préférences de confidentialité" })).toBeVisible();
    await expect(root.getByRole("link", { name: "Conditions générales" })).toBeVisible();
  });

  test("mobile : sommaire repliable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/legal/confidentialite", {
      waitUntil: "domcontentloaded",
      timeout: COLD_START_TIMEOUT,
    });

    const root = legalRoot(page, "mobile");
    await expect(root).toBeVisible();
    await root.getByRole("button", { name: "Sommaire" }).click();
    await expect(root.getByRole("link", { name: /Vos droits/ })).toBeVisible();
  });
});

test.describe("Pages légales — conditions générales", () => {
  test("medium : sections et documents associés", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/legal/conditions-generales", {
      waitUntil: "domcontentloaded",
      timeout: COLD_START_TIMEOUT,
    });

    const root = legalRoot(page, "medium");
    await expect(root).toBeVisible();
    await expect(
      root.getByRole("heading", { name: "Conditions générales d'utilisation" }),
    ).toBeVisible();
    await expect(root.getByRole("link", { name: "Politique de confidentialité" })).toBeVisible();
    await expect(root.getByText("Règles de conduite")).toBeVisible();
  });
});
