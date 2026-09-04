import { test, expect } from "@playwright/test";

const COLD_START_TIMEOUT = 60_000;

function helpRoot(page: import("@playwright/test").Page, variant: "mobile" | "medium" | "desktop") {
  return page.locator(`[data-help-center-${variant}-root]`);
}

test.describe("Centre d'aide desktop", () => {
  test("affiche hero, catégories, FAQ et contact", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/aide", { waitUntil: "domcontentloaded", timeout: COLD_START_TIMEOUT });

    const root = helpRoot(page, "desktop");
    await expect(root).toBeVisible();
    await expect(root.getByRole("heading", { name: "Comment pouvons-nous vous aider ?" })).toBeVisible();
    await expect(root.getByPlaceholder("Rechercher dans l'aide")).toBeVisible();
    await expect(root.getByRole("heading", { name: "Parcourir l'aide" })).toBeVisible();
    await expect(root.getByRole("link", { name: /Premiers pas/ })).toBeVisible();
    await expect(root.getByRole("heading", { name: "Questions fréquentes" })).toBeVisible();
    await expect(
      root.getByRole("button", { name: "Puis-je explorer Yunicity sans compte ?" }),
    ).toBeVisible();
    await expect(root.getByRole("link", { name: "Nous contacter" })).toHaveAttribute(
      "href",
      "mailto:contact@yunicity.city",
    );
  });

  test("filtre la FAQ via la recherche", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/aide", { waitUntil: "domcontentloaded", timeout: COLD_START_TIMEOUT });

    const root = helpRoot(page, "desktop");
    await root.getByPlaceholder("Rechercher dans l'aide").fill("Passport");
    await expect(root.getByRole("button", { name: "Comment fonctionne le Passport ?" })).toBeVisible();
    await expect(
      root.getByRole("button", { name: "Puis-je explorer Yunicity sans compte ?" }),
    ).toHaveCount(0);
  });

  test("ouvre une FAQ au clic", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/aide", { waitUntil: "domcontentloaded", timeout: COLD_START_TIMEOUT });

    const root = helpRoot(page, "desktop");
    const question = root.getByRole("button", { name: "Comment modifier ma ville ?" });
    await question.click();
    await expect(root.getByText("Connectez-vous, ouvrez Paramètres")).toBeVisible();
  });
});

test.describe("Centre d'aide medium", () => {
  test("affiche la variante medium entre sm et lg", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/aide", { waitUntil: "domcontentloaded", timeout: COLD_START_TIMEOUT });

    const root = helpRoot(page, "medium");
    await expect(root).toBeVisible();
    await expect(helpRoot(page, "mobile")).toBeHidden();
    await expect(helpRoot(page, "desktop")).toBeHidden();
    await expect(root.getByRole("link", { name: /Premiers pas/ })).toBeVisible();
    await expect(root.getByRole("link", { name: "Nous contacter" })).toBeVisible();
  });
});

test.describe("Centre d'aide mobile", () => {
  test("affiche la variante mobile sous sm", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/aide", { waitUntil: "domcontentloaded", timeout: COLD_START_TIMEOUT });

    const root = helpRoot(page, "mobile");
    await expect(root).toBeVisible();
    await expect(helpRoot(page, "medium")).toBeHidden();
    await expect(helpRoot(page, "desktop")).toBeHidden();
    await expect(root.getByRole("heading", { name: "Comment pouvons-nous vous aider ?" })).toBeVisible();
    await expect(root.getByRole("link", { name: /Premiers pas/ })).toBeVisible();
  });

  test("filtre la FAQ via la recherche", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/aide", { waitUntil: "domcontentloaded", timeout: COLD_START_TIMEOUT });

    const root = helpRoot(page, "mobile");
    await root.getByPlaceholder("Rechercher dans l'aide").fill("tribu");
    await expect(
      root.getByRole("button", { name: "Comment rejoindre ou quitter une tribu ?" }),
    ).toBeVisible();
    await expect(
      root.getByRole("button", { name: "Comment fonctionne le Passport ?" }),
    ).toHaveCount(0);
  });
});
