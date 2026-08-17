import { expect, type Page } from "@playwright/test";

/**
 * Attentes tolérantes au DÉMARRAGE À FROID (C3.0-T4-R2) — INTERNE au harnais E2E.
 * Jamais importé par l'application.
 *
 * Contexte mesuré : avec `.next` vide, la PREMIÈRE compilation d'une route par `next dev`
 * prend ~28 s sur cette machine (mesure directe : première requête HTTP sur la page de
 * connexion = 28,2 s), alors que le budget par défaut d'une assertion Playwright est de 10 s.
 * La première spec qui atteint une route donnée paie donc cette compilation, et n'importe
 * quelle assertion de visibilité placée juste après `goto` peut expirer.
 *
 * Ce module ne fait qu'élargir EXPLICITEMENT ce budget, route par route, là où la fragilité
 * est démontrée. Il n'introduit aucune attente fixe, aucun retry, et ne modifie pas la
 * configuration globale : chaque attente reste fondée sur l'état réel du DOM.
 */

/** Budget haut de la première compilation d'une route (borne, pas une attente). */
export const COLD_START_TIMEOUT = 60_000;

/**
 * Budget fini du test lui-même. Le timeout global du projet est de 60 s : une seule attente
 * d'état de 60 s le dépasserait. À poser via `test.setTimeout(...)` dans les specs réellement
 * exposées à la première compilation, sans dépasser le plafond R1 de 120 s.
 */
export const COLD_START_TEST_TIMEOUT = 120_000;

/**
 * Navigue puis vérifie que l'on est bien arrivé sur la route demandée — sans attendre
 * `networkidle` (l'app garde des requêtes ouvertes) ni dormir.
 */
export async function gotoCold(page: Page, path: string, expectedUrl: RegExp): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page, `navigation vers ${path} non aboutie`).toHaveURL(expectedUrl, {
    timeout: COLD_START_TIMEOUT,
  });
}
