/**
 * PR202 — progression et annulation d'un envoi vidéo, dans un vrai navigateur.
 *
 * ── Ce que la couverture existante ne prouvait pas ───────────────────────────
 * `lib/videos/upload-progress-cancel.test.tsx` remplace `uploadSessionBytes` par
 * un mock intégral : il prouve que l'écran RÉAGIT à des événements de
 * progression fabriqués, jamais que le transfert réel en émet, ni qu'« Annuler »
 * interrompt une requête effectivement en vol. Sur une vidéo filmée à l'iPhone,
 * c'est exactement cela qui compte — le reste est une mise en scène.
 *
 * ── Contrat verrouillé ici ───────────────────────────────────────────────────
 * - le vrai `XMLHttpRequest` alimente `aria-valuenow` : au moins une valeur, sans
 *   jamais régresser, et 100 à l'arrivée ;
 * - « Annuler l'envoi » avorte une requête réellement suspendue, rend la main au
 *   formulaire, et ne présente pas l'annulation comme une panne ;
 * - rien n'est publié après une annulation.
 *
 * ── Pourquoi aucun sleep ─────────────────────────────────────────────────────
 * La progression est captée par un observateur posé AVANT l'envoi, donc aucune
 * valeur ne peut être manquée entre deux sondages. L'annulation s'observe sur
 * une requête que le test suspend lui-même : l'état « en cours d'envoi » dure
 * aussi longtemps qu'il le faut, sans dépendre d'un débit.
 *
 * ── Ce fichier MUTE la base QA, et son rang le rend inoffensif ───────────────
 * Prouver une progression réelle exige un envoi réel, donc une vidéo publiée de
 * plus. `28-medium-feed-video` compte les vidéos du FIL (`toHaveCount(1)`) : ce
 * fichier doit donc rester APRÈS lui — son numéro, 44, le garantit tant que la
 * suite s'exécute en ordre de nom avec un seul worker, ce que les deux configs
 * imposent (`fullyParallel: false`, `workers: 1`).
 *
 * Entre deux exécutions, la remise à zéro reste `sh scripts/qa-playwright-baseline.sh` :
 * sans elle les vidéos s'accumulent et ce sont les specs de comptage qui tombent,
 * pour une raison étrangère à leur sujet. Mesuré : 19 vidéos au lieu de 2.
 */
import path from "node:path";

import { expect, test } from "../fixtures";

/** Vidéo QA réelle du dépôt : H.264, 1920x1080, 12 s — dans les bornes produit. */
const VIDEO_QA = path.resolve(
  __dirname,
  "../../../../../backend/uploads/qa/qa-sample-video.mp4",
);

/**
 * Le transfert binaire vise l'API directement — `MEDIA_PUBLIC_BASE_URL`, pas la
 * façade du serveur de preuve. Une expression régulière évite de dépendre de
 * l'origine : elle est confrontée à l'URL entière, quel que soit l'hôte.
 */
const ROUTE_BINAIRE = /\/local-videos\/uploads\/[^/]+\/binary$/;

const BARRE = '[role="progressbar"]';
const ANNULER_ENVOI = "Annuler l'envoi";
const PUBLIER = "Publier";

/** Pose l'observateur AVANT l'envoi : la barre n'existe pas encore. */
async function observerLaProgression(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const fenetre = window as unknown as { __progression?: number[] };
    fenetre.__progression = [];

    const relever = (noeud: Element): void => {
      const valeur = noeud.getAttribute("aria-valuenow");
      if (valeur !== null) fenetre.__progression!.push(Number(valeur));
    };

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          relever(mutation.target);
        }
        for (const ajoute of Array.from(mutation.addedNodes)) {
          if (!(ajoute instanceof Element)) continue;
          if (ajoute.matches('[role="progressbar"]')) relever(ajoute);
          ajoute.querySelectorAll('[role="progressbar"]').forEach(relever);
        }
      }
    }).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-valuenow"],
    });
  });
}

async function ouvrirLeFormulaire(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/videos/new");
  await expect(page.getByRole("button", { name: PUBLIER })).toBeVisible();
}

/**
 * Renseigne un formulaire VALIDE : fichier, titre, quartier.
 *
 * Le bouton s'active dès qu'un fichier est joint, mais le titre est vérifié à la
 * soumission — un formulaire incomplet rend « Le titre est obligatoire. » et
 * n'atteint jamais le transfert, donc ne prouverait rien de la progression.
 */
async function preparerUneVideoPubliable(page: import("@playwright/test").Page): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles(VIDEO_QA);
  // Attendre l'activation du bouton remplace un délai : elle signale que le
  // fichier est accepté ET que les quartiers sont chargés.
  await expect(page.getByRole("button", { name: PUBLIER })).toBeEnabled();

  await page.getByLabel("Titre").fill("Recette QA — progression et annulation");

  const quartier = page.getByLabel("Quartier");
  const valeurs = await quartier.locator("option").evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value).filter(Boolean),
  );
  expect(valeurs.length, "la baseline QA ne fournit aucun quartier").toBeGreaterThan(0);
  await quartier.selectOption(valeurs[0]!);
}

test.describe("PR202 — envoi vidéo : progression et annulation réelles", () => {
  test("le vrai transfert alimente la barre, sans régression, jusqu'à 100", async ({
    authedPage,
  }) => {
    await ouvrirLeFormulaire(authedPage);
    await observerLaProgression(authedPage);
    await preparerUneVideoPubliable(authedPage);

    await authedPage.getByRole("button", { name: PUBLIER }).click();

    // La publication acceptée redirige vers la vidéo : c'est le signal d'arrêt du
    // test, pas un délai. La navigation est cliente, donc le relevé survit.
    await expect(authedPage).toHaveURL(/\/videos\?video=/, { timeout: 45_000 });

    const releves = await authedPage.evaluate(
      () => (window as unknown as { __progression?: number[] }).__progression ?? [],
    );

    expect(releves.length, "le vrai XHR n'a émis aucune progression chiffrée").toBeGreaterThan(0);
    expect(Math.max(...releves), "la progression n'atteint jamais 100 %").toBe(100);
    for (const valeur of releves) {
      expect(valeur, `progression hors bornes : ${valeur}`).toBeGreaterThanOrEqual(0);
      expect(valeur, `progression hors bornes : ${valeur}`).toBeLessThanOrEqual(100);
    }
    for (let i = 1; i < releves.length; i += 1) {
      expect(
        releves[i]!,
        `la progression recule : ${releves[i - 1]} puis ${releves[i]}`,
      ).toBeGreaterThanOrEqual(releves[i - 1]!);
    }
  });

  test("« Annuler l'envoi » interrompt une requête réellement en vol", async ({ authedPage }) => {
    // Suspendue, jamais remplie : l'état « envoi en cours » dure le temps du test.
    const suspendues: import("@playwright/test").Route[] = [];
    await authedPage.route(ROUTE_BINAIRE, (route) => {
      suspendues.push(route);
    });

    try {
      await ouvrirLeFormulaire(authedPage);
      await preparerUneVideoPubliable(authedPage);
      await authedPage.getByRole("button", { name: PUBLIER }).click();

      // ORDRE CAUSAL, et non chronologique : `phase = "uploading"` est posé AVANT
      // que le PUT parte, donc la barre et le bouton apparaissent pendant que la
      // requête n'est pas encore en vol. Asserter le compteur de façon synchrone
      // après les attentes d'affichage laissait cette fenêtre ouverte — mesuré
      // flaky 2 fois sur 4. On attend donc d'abord la requête, puis l'interface.
      await expect
        .poll(() => suspendues.length, { message: "le transfert binaire n'a pas été atteint" })
        .toBeGreaterThan(0);

      const annuler = authedPage.getByRole("button", { name: ANNULER_ENVOI });
      await expect(annuler, "aucun moyen d'interrompre un envoi en cours").toBeVisible();
      await expect(authedPage.locator(BARRE)).toBeVisible();

      await annuler.click();

      // L'interface redevient utilisable…
      await expect(authedPage.getByRole("button", { name: PUBLIER })).toBeVisible();
      // …l'annulation n'est PAS présentée comme une panne. On vise le message
      // d'erreur DU FORMULAIRE : la page porte d'autres régions `alert`, et les
      // compter toutes ferait échouer ce test pour une raison étrangère au sujet.
      await expect(authedPage.locator('form p[role="alert"]')).toHaveCount(0);
      // …et rien n'a été publié : la redirection de succès n'a pas eu lieu.
      await expect(authedPage).toHaveURL(/\/videos\/new(\?|$)/);
    } finally {
      // Une requête laissée suspendue retiendrait la fermeture du contexte, et
      // une assertion qui échoue ne doit pas transformer un rouge lisible en
      // blocage de fin de suite.
      for (const route of suspendues) {
        await route.abort("aborted").catch(() => undefined);
      }
      await authedPage.unroute(ROUTE_BINAIRE);
    }
  });
});
