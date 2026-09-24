import { API_URL, bearer, expect, testCitizen as test, type QaUser } from "../fixtures";
import { evaluateBrowserFailures, type FailedRequestRecord } from "../browser-failure-policy";
import { ProvenMediaRegistry, proveFeedLocalVideoMedia } from "../proven-media-registry";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import type { APIRequestContext, Locator, Page } from "@playwright/test";

/**
 * C3.0-T4 — première preuve NAVIGATEUR de la primitive d'overlay partagée sur un vrai
 * consommateur Yunicity : le signalement vidéo (`LocalVideoReportSheet`), migré de son
 * panneau ad hoc vers `Drawer` (`@yunicity/ui/primitives`).
 *
 * Données 100 % QA réelles : vidéo seedée, acteur seedé connectable, API locale 8010.
 */
const REPORT_TRIGGER_MORE = "Plus d'options";
const REPORT_TRIGGER_DIRECT = "Signaler";
const DRAWER_TITLE = "Signaler";
const CLOSE_LABEL = "Fermer";

async function seededVideoId(api: APIRequestContext, user: QaUser): Promise<string> {
  // Le feed est exposé sur `/local-videos/feed` ; `/local-videos` est la route de publication (POST).
  const res = await api.get(`${API_URL}/api/v1/local-videos/feed?city=Reims&limit=5`, {
    headers: bearer(user),
  });
  expect(res.status(), await res.text()).toBe(200);
  const json = (await res.json()) as { items?: Array<{ id: string }> };
  const id = json.items?.[0]?.id;
  expect(id, "aucune vidéo QA seedée — le parcours est inatteignable").toBeTruthy();
  return id as string;
}

/** État DOM observé côté navigateur : ce que la primitive doit garantir. */
async function overlayState(page: Page) {
  return page.evaluate(() => {
    const OVERLAY_ROOT = "data-yunicity-overlay-root";
    const dialog = document.querySelector('[role="dialog"]');
    const roots = Array.from(document.querySelectorAll(`[${OVERLAY_ROOT}]`));
    const appChildren = Array.from(document.body.children).filter(
      (child) => !child.hasAttribute(OVERLAY_ROOT),
    );
    return {
      dialogCount: document.querySelectorAll('[role="dialog"]').length,
      ariaModal: dialog?.getAttribute("aria-modal") ?? null,
      focusInsideDialog: Boolean(dialog && dialog.contains(document.activeElement)),
      bodyOverflow: document.body.style.overflow,
      appNeutralized:
        appChildren.length > 0 &&
        appChildren.every(
          (child) => child.getAttribute("aria-hidden") === "true" && child.hasAttribute("inert"),
        ),
      appAnyNeutralized: appChildren.some(
        (child) => child.getAttribute("aria-hidden") === "true" || child.hasAttribute("inert"),
      ),
      overlayRootCount: roots.length,
      overlayRootsEmpty: roots.every((root) => root.childElementCount === 0),
    };
  });
}

async function openDrawer(page: Page, trigger: Locator) {
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

/**
 * Navigation vers le détail vidéo, prête à l'emploi même à froid.
 *
 * Étapes d'état (aucun sleep, aucun warm-up préalable) :
 * 1. navigation terminée (`domcontentloaded`) ;
 * 2. l'URL est bien la route vidéo et non une redirection d'authentification — si la session
 *    n'était pas hydratée, l'app renverrait vers `/login` ;
 * 3. le déclencheur produit est rendu : « Plus d'options » (desktop/medium) ou
 *    « Signaler » (immersif mobile).
 */
async function gotoVideoDetail(page: Page, videoId: string): Promise<Locator> {
  await gotoCold(page, `/videos?video=${encodeURIComponent(videoId)}`, /\/videos\?video=/);

  const moreOptions = page.getByRole("button", { name: REPORT_TRIGGER_MORE }).first();
  const directReport = page.getByRole("button", { name: REPORT_TRIGGER_DIRECT }).first();
  await expect(
    moreOptions.or(directReport).first(),
    "déclencheur du signalement indisponible",
  ).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
  return (await moreOptions.isVisible()) ? moreOptions : directReport;
}

test.describe("Signalement vidéo — Drawer partagé", () => {
  // Le tout premier test qui atteint `/videos` après un démarrage à froid paie la compilation
  // de la route par `next dev`. On alloue le budget correspondant au test lui-même, faute de
  // quoi l'attente d'état (60 s) dépasserait le timeout global de 60 s.
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("ouverture, focus, inertie, Escape et restauration complète (390 px)", async ({
    citizenAPage: page,
    api,
    citizenA,
  }) => {
    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];
    const provenMedia = new ProvenMediaRegistry();
    provenMedia.attachHttpErrorObserver(page);
    provenMedia.attachSuccessfulMediaObserver(page);
    page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      const host = new URL(request.url()).hostname;
      if (host !== "localhost" && host !== "127.0.0.1") externalRequests.push(request.url());
    });
    // Les défaillances réseau sont enregistrées avec leur URL RÉELLE : c'est sur elles, et
    // jamais sur le texte d'un message console, que la politique tranche.
    const failedRequests: FailedRequestRecord[] = [];
    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        errorText: request.failure()?.errorText ?? "",
        resourceType: request.resourceType(),
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    const videoId = await seededVideoId(api, citizenA);

    // 1. Le vrai CTA produit est visible (attente d'état, tolérante au démarrage à froid).
    const trigger = await gotoVideoDetail(page, videoId);

    // Prouver tous les médias local-video susceptibles d'être abortés (feed + carousel).
    await proveFeedLocalVideoMedia(page, api, API_URL, bearer(citizenA), provenMedia);
    await provenMedia.proveAllPageVideoMedia(page);
    await provenMedia.proveCurrentVideoMedia(page);

    // 2-4. Ouverture : un seul dialogue, nom accessible correct, aria-modal.
    await openDrawer(page, trigger);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAccessibleName(DRAWER_TITLE);

    // 5-7. Focus initial dans le panneau, fond neutralisé, scroll verrouillé.
    await expect
      .poll(async () => (await overlayState(page)).focusInsideDialog, {
        message: "le focus initial doit entrer dans le panneau",
      })
      .toBe(true);
    const opened = await overlayState(page);
    expect(opened.dialogCount).toBe(1);
    expect(opened.ariaModal).toBe("true");
    expect(opened.appNeutralized, "tout le fond applicatif doit être inert + aria-hidden").toBe(true);
    expect(opened.bodyOverflow).toBe("hidden");

    // 8. Le focus reste piégé dans le panneau.
    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press("Tab");
      expect((await overlayState(page)).focusInsideDialog, `Tab #${index + 1}`).toBe(true);
    }
    for (let index = 0; index < 3; index += 1) {
      await page.keyboard.press("Shift+Tab");
      expect((await overlayState(page)).focusInsideDialog, `Shift+Tab #${index + 1}`).toBe(true);
    }

    // 9-12. Escape ferme, le focus revient au déclencheur, rien ne fuit.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(
      await trigger.evaluate((element) => element === document.activeElement),
      "le focus doit revenir exactement au déclencheur",
    ).toBe(true);

    const closed = await overlayState(page);
    expect(closed.bodyOverflow).toBe("");
    expect(closed.appAnyNeutralized, "aucun inert/aria-hidden résiduel").toBe(false);
    expect(closed.overlayRootsEmpty, "aucun panneau résiduel dans le portail").toBe(true);

    // 13. Réouverture.
    await openDrawer(page, trigger);
    expect((await overlayState(page)).bodyOverflow).toBe("hidden");

    // 14. Fermeture par le bouton Close.
    await page.getByRole("button", { name: CLOSE_LABEL, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect((await overlayState(page)).appAnyNeutralized).toBe(false);

    // 15. Fermeture par clic sur l'overlay — contrat existant conservé (dismissible).
    await openDrawer(page, trigger);
    await page.locator("[data-yunicity-overlay-backdrop]").click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const final = await overlayState(page);
    expect(final.bodyOverflow).toBe("");
    expect(final.appAnyNeutralized).toBe(false);
    expect(final.overlayRootsEmpty).toBe(true);

    // Politique EXACTE (cf. `e2e/browser-failure-policy.ts`) : signatures statiques QA
    // + médias dynamiques prouvés (QA-MEDIA-03, registre par exécution).
    const verdict = evaluateBrowserFailures({
      failedRequests,
      consoleErrors,
      provenMedia: provenMedia.toContext(),
    });
    expect(verdict.violations, verdict.violations.join(" | ")).toEqual([]);
    expect(externalRequests, `requêtes externes : ${externalRequests.join(" | ")}`).toEqual([]);
  });

  test("navigation pendant l'ouverture : aucun état résiduel, réouverture possible", async ({
    citizenAPage: page,
    api,
    citizenA,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const videoId = await seededVideoId(api, citizenA);
    const trigger = await gotoVideoDetail(page, videoId);
    await openDrawer(page, trigger);
    expect((await overlayState(page)).bodyOverflow).toBe("hidden");

    // Changement de route pendant l'ouverture (démontage de l'overlay).
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/feed/);
    const afterRoute = await overlayState(page);
    expect(afterRoute.dialogCount).toBe(0);
    expect(afterRoute.bodyOverflow).toBe("");
    expect(afterRoute.appAnyNeutralized, "aucune inertie ne survit au changement de route").toBe(false);

    // Réouverture après démontage.
    const reopened = await gotoVideoDetail(page, videoId);
    await openDrawer(page, reopened);
    expect((await overlayState(page)).appNeutralized).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("le signalement reste fonctionnel : mutation API réelle et confirmation", async ({
    citizenAPage: page,
    api,
    citizenA,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const videoId = await seededVideoId(api, citizenA);
    const trigger = await gotoVideoDetail(page, videoId);
    await openDrawer(page, trigger);

    const dialog = page.getByRole("dialog");
    const reason = dialog.getByRole("button", { name: "Spam", exact: true });
    await expect(reason).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes(`/local-videos/${videoId}/report`) && res.request().method() === "POST",
      ),
      reason.click(),
    ]);
    expect([201, 204, 200, 409]).toContain(response.status());

    // Confirmation produit affichée dans le panneau partagé.
    await expect(dialog.getByText("Signalement envoyé", { exact: false })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("responsive 390 / 900 / 1366 : ouverture, contenu, fermeture, aucun débordement", async ({
    citizenAPage: page,
    api,
    citizenA,
  }) => {
    const videoId = await seededVideoId(api, citizenA);

    for (const width of [390, 900, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      const trigger = await gotoVideoDetail(page, videoId);
      await expect(trigger, `déclencheur absent en ${width}px`).toBeVisible();
      await openDrawer(page, trigger);

      const dialog = page.getByRole("dialog");
      await expect(dialog, `panneau invisible en ${width}px`).toBeVisible();
      await expect(dialog.getByText("Spam", { exact: true })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `débordement horizontal en ${width}px`).toBeLessThanOrEqual(1);

      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog"), `fermeture KO en ${width}px`).toHaveCount(0);
      expect((await overlayState(page)).bodyOverflow, `scroll non restauré en ${width}px`).toBe("");
    }
  });
});
