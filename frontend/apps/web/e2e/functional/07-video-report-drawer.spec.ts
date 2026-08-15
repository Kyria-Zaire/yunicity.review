import { API_URL, bearer, expect, test, type QaUser } from "../fixtures";
import type { APIRequestContext, Locator, Page } from "@playwright/test";

/**
 * C3.0-T4 — première preuve NAVIGATEUR de la primitive d'overlay partagée sur un vrai
 * consommateur Yunicity : le signalement vidéo (`LocalVideoReportSheet`), migré de son
 * panneau ad hoc vers `Drawer` (`@yunicity/ui/primitives`).
 *
 * Données 100 % QA réelles : vidéo seedée, acteur seedé connectable, API locale 8010.
 */
const REPORT_TRIGGER = "Plus d'options";
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

test.describe("Signalement vidéo — Drawer partagé", () => {
  test("ouverture, focus, inertie, Escape et restauration complète (390 px)", async ({
    citizenAPage: page,
    api,
    citizenA,
  }) => {
    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];
    page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      const host = new URL(request.url()).hostname;
      if (host !== "localhost" && host !== "127.0.0.1") externalRequests.push(request.url());
    });
    const failedRequests: string[] = [];
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.method()} ${request.url()} -> ${request.failure()?.errorText}`);
    });

    await page.setViewportSize({ width: 390, height: 844 });
    const videoId = await seededVideoId(api, citizenA);
    await page.goto(`/videos?video=${encodeURIComponent(videoId)}`);

    // 1. Le vrai CTA produit est visible.
    const trigger = page.getByRole("button", { name: REPORT_TRIGGER }).first();
    await expect(trigger).toBeVisible();

    // Ligne de base MESURÉE avant toute ouverture : la stack QA produit un bruit console
    // reproductible et indépendant de l'overlay (requête notifications annulée au bootstrap,
    // média placeholder QA bloqué par ORB). Vérifié en T4 sur la même page sans jamais ouvrir
    // le panneau. On n'exige donc pas zéro erreur absolue — on exige que l'ouverture, la
    // fermeture et la réouverture de l'overlay n'en ajoutent AUCUNE.
    const baselineErrorCount = consoleErrors.length;
    const isEnvironmentNoise = (message: string) =>
      /notifications\?limit=1|ERR_BLOCKED_BY_ORB|net::ERR_FAILED/.test(message);

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

    const overlayErrors = consoleErrors.slice(baselineErrorCount).filter((m) => !isEnvironmentNoise(m));
    expect(
      overlayErrors,
      `erreurs console imputables à l'overlay : ${overlayErrors.join(" | ")} || bruit QA mesuré : ${failedRequests.join(" | ")}`,
    ).toEqual([]);
    expect(externalRequests, `requêtes externes : ${externalRequests.join(" | ")}`).toEqual([]);
  });

  test("navigation pendant l'ouverture : aucun état résiduel, réouverture possible", async ({
    citizenAPage: page,
    api,
    citizenA,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const videoId = await seededVideoId(api, citizenA);
    await page.goto(`/videos?video=${encodeURIComponent(videoId)}`);

    const trigger = page.getByRole("button", { name: REPORT_TRIGGER }).first();
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
    await page.goto(`/videos?video=${encodeURIComponent(videoId)}`);
    const reopened = page.getByRole("button", { name: REPORT_TRIGGER }).first();
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
    await page.goto(`/videos?video=${encodeURIComponent(videoId)}`);

    const trigger = page.getByRole("button", { name: REPORT_TRIGGER }).first();
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
      await page.goto(`/videos?video=${encodeURIComponent(videoId)}`);

      const trigger = page.getByRole("button", { name: REPORT_TRIGGER }).first();
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
