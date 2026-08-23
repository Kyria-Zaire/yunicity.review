import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Page } from "@playwright/test";

import { CITIZEN_A_EMAIL, expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import { readLandmarkState } from "../landmark-assertions";

const QA_SEEDED_PASSWORD = "StrongPassword1!";

/**
 * C3.1-R1B — accueil public `/` : landing visiteur, redirection connecté, pas de diagnostic API.
 */

const HERO_TITLE = "Reims, plus proche de vous.";
const VIEWPORTS = [
  { width: 390, height: 844, name: "390" },
  { width: 393, height: 852, name: "393" },
  { width: 900, height: 900, name: "900" },
  { width: 1366, height: 900, name: "1366" },
] as const;

const FORBIDDEN = ["Statut API", "Erreur API", "Erreur API (404)", "Bienvenue"] as const;

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

async function captureLanding(page: Page, width: number): Promise<void> {
  const dir = process.env.C3_1_R1_CAPTURE_DIR ?? join(tmpdir(), "yunicity-c3-1-r1-captures");
  mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: join(dir, `landing-visitor-${width}.png`),
    fullPage: false,
  });
}

async function gotoPublicHome(page: Page): Promise<void> {
  await gotoCold(page, "/", /\/(?:$|\?)/);
  await waitSessionReady(page);
  await expect(page.getByRole("heading", { level: 1, name: HERO_TITLE })).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
}

test.describe("C3.1-R1B — Public home", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("visiteur : landing publique, CTA et routes exactes, sans bottom-nav", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPublicHome(page);

    await expect(page.getByRole("link", { name: "Yunicity — accueil" })).toBeVisible();
    await expect(page.getByText("Yunicity", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/login");
    await expect(page.getByRole("link", { name: "Créer un compte" })).toHaveAttribute(
      "href",
      "/register",
    );
    await expect(page.getByRole("link", { name: "Découvrir Reims" })).toHaveAttribute(
      "href",
      "/neighborhoods",
    );
    await expect(page.getByRole("link", { name: "Créer mon compte" })).toHaveAttribute(
      "href",
      "/register",
    );
    await expect(page.getByRole("link", { name: "J’ai déjà un compte" })).toHaveAttribute(
      "href",
      "/login",
    );
    await expect(page.getByRole("link", { name: "Quartiers" })).toHaveAttribute(
      "href",
      "/neighborhoods",
    );
    await expect(page.getByRole("link", { name: "Sortir à Reims" })).toHaveAttribute(
      "href",
      "/sortir",
    );
    await expect(page.getByRole("link", { name: "Lieux" })).toHaveAttribute("href", "/places");

    await expect(page.locator(".web-mobile-strategic-bottom-nav")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toHaveCount(0);

    for (const text of FORBIDDEN) {
      await expect(page.getByText(text, { exact: true })).toHaveCount(0);
    }

    const landmarks = await readLandmarkState(page);
    expect(landmarks.main, "/ doit rendre exactement un <main>").toBe(1);
    expect(landmarks.nestedMain, "<main> imbriqué sur /").toBe(0);
    expect(landmarks.roleMainConcurrent, 'role="main" concurrent sur /').toBe(0);
    expect(landmarks.visibleMainNavigation, "pas de navigation applicative sur /").toBe(0);
    await expect(page.locator("h1")).toHaveCount(1);

    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: COLD_START_TIMEOUT });
  });

  test("connecté : `/` redirige vers `/feed` sans landing visiteur persistante", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/login", /\/login(\?|$)/);
    await waitSessionReady(page);
    await page.locator('input[type="email"]:visible').fill(CITIZEN_A_EMAIL);
    await page.locator('input[type="password"]:visible').fill(QA_SEEDED_PASSWORD);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/v1/auth/login") && r.ok()),
      page.locator('button[type="submit"]:visible').first().click(),
    ]);
    await expect(page).toHaveURL(/\/feed/, { timeout: COLD_START_TIMEOUT });
    await waitSessionReady(page);
    await expect(page.getByRole("link", { name: "Yunicity — accueil" }).first()).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });
    // Client navigation `/` while AuthProvider is still mounted. A document reload of
    // localhost:3002 cannot reuse the LAN refresh cookie (cross-site vs 192.168.1.180).
    await page.getByRole("link", { name: "Yunicity — accueil" }).first().click();
    await expect(page).toHaveURL(/\/feed/, { timeout: COLD_START_TIMEOUT });
    await waitSessionReady(page);
    await expect(page.getByRole("heading", { name: HERO_TITLE })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Publier sur le fil local" }).first()).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });
  });

  test("390/393/900/1366 : pas d’overflow, wordmark lisible, cibles ≥44 px", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoPublicHome(page);

      const metrics = await page.evaluate(() => {
        const scrolling = document.scrollingElement ?? document.documentElement;
        const wordmark = Array.from(document.querySelectorAll("span, a")).find(
          (el) => el.textContent?.trim() === "Yunicity" && el.getClientRects().length > 0,
        );
        const wordmarkRect = wordmark?.getBoundingClientRect();
        const ctas = Array.from(document.querySelectorAll("[data-public-home-control]"));
        const smallCtas = ctas
          .map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              name: (el.textContent ?? "").trim().slice(0, 40),
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((cta) => cta.height < 44 || cta.width < 44);
        return {
          overflowX: scrolling.scrollWidth - scrolling.clientWidth,
          wordmarkVisible: Boolean(wordmarkRect && wordmarkRect.width > 8 && wordmarkRect.height > 8),
          smallCtas,
        };
      });

      expect(metrics.overflowX, `${viewport.name}: overflow horizontal`).toBeLessThanOrEqual(1);
      expect(metrics.wordmarkVisible, `${viewport.name}: wordmark Yunicity invisible`).toBe(true);
      expect(metrics.smallCtas, `${viewport.name}: cibles < 44 px`).toEqual([]);
      if (viewport.name === "390" || viewport.name === "900" || viewport.name === "1366") {
        await captureLanding(page, viewport.width);
      }
    }
  });

  test("login et register restent accessibles depuis la landing", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPublicHome(page);
    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL(/\/register/, { timeout: COLD_START_TIMEOUT });
    await page.goto("/");
    await waitSessionReady(page);
    await page.getByRole("link", { name: "J’ai déjà un compte" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: COLD_START_TIMEOUT });
  });
});
