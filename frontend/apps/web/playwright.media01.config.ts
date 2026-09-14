import { defineConfig, devices } from "@playwright/test";

/**
 * MEDIA-01 — preuve de rendu responsive des composers.
 *
 * Configuration séparée, sur le modèle de `playwright.webkit-r1.config.ts`.
 * La configuration principale exige la pile QA complète — serveur web, API et
 * `globalSetup` authentifié — parce que ses parcours traversent le produit.
 * Cette preuve-ci ne traverse rien : elle monte les composants réels avec le
 * CSS réel dans une page autonome, sans réseau. Emprunter la configuration QA
 * ferait dépendre une mesure de mise en page d'une pile qui ne lui apporte rien,
 * et la rendrait inexécutable en dehors d'elle.
 *
 *   pnpm exec playwright test --config=playwright.media01.config.ts
 *
 * `channel: "chrome"` utilise le Chrome installé : le harnais n'a pas besoin
 * d'un binaire dédié, et aucun navigateur n'est versionné dans le dépôt.
 */
export default defineConfig({
  testDir: "./e2e/responsive",
  testMatch: /media01(?:b-authorized-image)?-.*responsive\.spec\.ts$|media02-.*responsive\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  outputDir: "test-results/media01",
  use: {
    ...devices["Desktop Chrome"],
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "off",
    video: "off",
  },
});
