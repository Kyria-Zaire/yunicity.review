/**
 * C3.1-R1L — fermeture fonctionnelle du Feed mobile.
 *
 * Cinq rouges relevés en revue manuelle à 390x844, chacun vérifié ici sur un
 * fait observable, jamais sur une apparence :
 *
 *   1. « Abonnements » et « Près de moi » étaient des LIENS vers /subscriptions
 *      (page tarifaire) et /map, déguisés en onglets du fil ;
 *   2. l'icône marque-page était un <span> décoratif inerte sur toute
 *      publication non-événement ;
 *   3. le menu kebab proposait Spam / Contenu inapproprié / Autre sur SA PROPRE
 *      publication ;
 *   4. cliquer une image publiée ne produisait aucune action ;
 *   5. photo sans texte : « Publier » restait désactivé sans explication.
 *
 * Contrats backend cartographiés AVANT d'écrire ces tests : `GET /api/v1/feed`
 * n'accepte que `cursor` et `limit` (aucun filtre abonnements ni proximité ;
 * aucune relation de suivi en base), aucun modèle de sauvegarde de publication
 * n'existe, et `PostCreateRequest.body` est `min_length=1` — le texte est donc
 * réellement obligatoire.
 *
 * Économie de quotas : la création de publication est limitée à 20/heure/compte
 * et 40/heure/IP. Les publications de support sont donc créées UNE fois pour
 * les trois viewports, jamais par test.
 */
import { request as playwrightRequest, type Page } from "@playwright/test";
import { homeComposerPlaceholder } from "@yunicity/utils";

import { API_URL, bearer, expect, test } from "../fixtures";
import { publishCitizenPostWithMedia } from "../feed-media-fixture";
import {
  BOTTOM_NAV_SELECTOR,
  armBottomNavClickSentinel,
  readBottomNavClicks,
} from "../overlay-contract";

const MOBILE_VIEWPORTS = [
  { label: "390x844", width: 390, height: 844 },
  { label: "393x852", width: 393, height: 852 },
  { label: "639x900", width: 639, height: 900 },
] as const;

/** Les onglets du fil ne doivent jamais quitter la famille /feed. */
const FEED_FAMILY = /\/feed(\?|$)/;

const OWN_MARKER = `R1L-own-${Date.now()}`;
let mediaMarker = "";

function mobileTablist(page: Page) {
  return page.locator('.web-mobile-feed-only [role="tablist"][aria-label="Vue du fil"]');
}

function cardWithMarker(page: Page, marker: string) {
  return page.locator("article").filter({ hasText: marker }).first();
}

async function gotoFeed(page: Page): Promise<void> {
  await page.goto("/feed");
  await expect(page.locator("article").first()).toBeVisible();
}

/** Publication média créée une seule fois, avant toute navigation de la page. */
async function ensureMediaPost(page: Page): Promise<string> {
  if (!mediaMarker) {
    const marker = `R1L-media-${Date.now()}`;
    await publishCitizenPostWithMedia(page, { marker, width: 900, height: 600 });
    mediaMarker = marker;
  }
  return mediaMarker;
}

test.beforeAll(async ({ sharedUser }) => {
  const context = await playwrightRequest.newContext();
  try {
    const created = await context.post(`${API_URL}/api/v1/posts`, {
      headers: bearer(sharedUser),
      data: { body: OWN_MARKER },
    });
    expect(created.status(), await created.text()).toBe(201);
  } finally {
    await context.dispose();
  }
});

test.describe("C3.1-R1L — Feed mobile fonctionnel", () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test.describe(viewport.label, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      // ── Rouge 1 : contrôles trompeurs du chrome mobile ────────────────────
      test(`${viewport.label} — aucun contrôle du fil ne quitte /feed`, async ({
        authedPage,
      }) => {
        await gotoFeed(authedPage);

        // Addendum maquette : la rangée de pills est un héritage, absente de la
        // maquette mobile canonique — et « Abonnements » / « Près de moi » n'ont
        // aucun contrat de fil derrière. Elle est retirée, non remplacée.
        await expect(
          mobileTablist(authedPage),
          "rangée de pills encore rendue sur mobile",
        ).toHaveCount(0);

        // Aucun contrôle du chrome mobile ne doit emmener hors du Feed.
        const chrome = authedPage.locator(".web-mobile-feed-only");
        const outbound = await chrome
          .locator("a[href]")
          .evaluateAll((nodes) =>
            nodes
              .map((node) => node.getAttribute("href") ?? "")
              .filter((href) => href === "/subscriptions" || href === "/map"),
          );
        expect(outbound, "lien sortant déguisé dans le chrome mobile").toEqual([]);

        // Et le fil reste bien le fil.
        await expect(authedPage).toHaveURL(FEED_FAMILY);
      });

      // ── Rouge 2 : marque-page mort ─────────────────────────────────────────
      test(`${viewport.label} — aucun marque-page inerte`, async ({ authedPage }) => {
        await gotoFeed(authedPage);

        const card = cardWithMarker(authedPage, OWN_MARKER);
        await expect(card, "publication de support absente du fil").toBeVisible();

        const inert = await card.evaluate((node) =>
          Array.from(node.querySelectorAll("svg")).filter((svg) => {
            if (svg.closest("button, a, [role='button']")) return false;
            const path = svg.querySelector("path")?.getAttribute("d") ?? "";
            return path.includes("v14l-6-3.5-6 3.5");
          }).length,
        );
        expect(inert, "icône marque-page rendue sans action possible").toBe(0);
      });

      // ── Rouge 3 : propriétaire vs tiers ────────────────────────────────────
      test(`${viewport.label} — impossible de signaler sa propre publication`, async ({
        authedPage,
      }) => {
        await gotoFeed(authedPage);

        /*
         * C3-FEED-R2A-SPEC21-OVERFLOW-MIGRATION.
         *
         * On cherchait un bouton nomme « Signaler ». R2A l'a renomme
         * « Plus d'actions » : l'assertion passait donc a zero parce que le NOM
         * avait change, pas parce que le signalement etait interdit — vraie par
         * construction. On vise desormais le DECLENCHEUR, dans l'article de la
         * publication concernee, jamais par recherche globale.
         */
        const own = cardWithMarker(authedPage, OWN_MARKER);
        await expect(own).toBeVisible();
        await expect(
          own.locator("[data-feed-publication-overflow]"),
          "menu de signalement offert sur sa propre publication",
        ).toHaveCount(0);
        await expect(own.locator('[role="menu"]')).toHaveCount(0);
      });

      test(`${viewport.label} — signalement toujours offert sur la publication d'un tiers`, async ({
        authedPage,
        api,
        sharedUser,
      }) => {
        // Autorité : c'est l'API qui dit qui possède quoi, on ne devine pas.
        const feed = await api.get(`${API_URL}/api/v1/feed?limit=20`, {
          headers: bearer(sharedUser),
        });
        expect(feed.status()).toBe(200);
        const items = (
          (await feed.json()) as {
            items: { body: string | null; author: { id: string } }[];
          }
        ).items;
        const foreign = items.find(
          (item) => item.author.id !== sharedUser.userId && (item.body ?? "").trim().length > 8,
        );
        expect(foreign, "aucune publication d'un tiers dans le fil").toBeTruthy();

        await gotoFeed(authedPage);
        const card = cardWithMarker(authedPage, (foreign?.body ?? "").trim().slice(0, 24));
        await expect(card).toBeVisible();

        /*
         * Le chemin de signalement passe par le menu de debordement de l'EN-TETE
         * de CET article. On l'ouvre reellement et on verifie que les trois
         * motifs historiques y sont — sans en cliquer aucun, donc sans emettre
         * la moindre requete de signalement.
         */
        const declencheur = card.locator(
          "[data-feed-publication-header] [data-feed-publication-overflow]",
        );
        await expect(
          declencheur,
          "le signalement doit rester possible sur la publication d'un tiers",
        ).toHaveCount(1);
        await expect(declencheur).toHaveAttribute("aria-label", "Plus d'actions");
        await expect(declencheur).toHaveAttribute("aria-expanded", "false");

        await declencheur.click();
        await expect(declencheur).toHaveAttribute("aria-expanded", "true");
        const menu = card.locator('[role="menu"]');
        await expect(menu, "menu de signalement absent ou duplique").toHaveCount(1);
        await expect(
          menu.locator('[role="menuitem"]'),
          "les trois motifs historiques doivent rester offerts",
        ).toHaveCount(3);
      });

      // ── Rouge 4 : visionneuse média ────────────────────────────────────────
      test(`${viewport.label} — visionneuse média : ouverture, image entière, fermeture`, async ({
        authedPage,
      }) => {
        const marker = await ensureMediaPost(authedPage);
        await gotoFeed(authedPage);

        const card = cardWithMarker(authedPage, marker);
        await expect(card).toBeVisible();

        const trigger = card.getByRole("button", { name: /agrandir l.image/i });
        await expect(trigger, "aucune action d'agrandissement sur l'image").toHaveCount(1);
        await trigger.click();

        const overlay = authedPage.locator(
          '[data-yunicity-overlay][data-yunicity-overlay-state="entered"]',
        );
        await expect(overlay, "visionneuse non ouverte").toBeVisible();

        const image = overlay.locator("img").first();
        await expect(image).toBeVisible();
        expect(
          await image.evaluate((node) => getComputedStyle(node).objectFit),
          "l'image doit être entière, jamais déformée",
        ).toBe("contain");

        // C3.1-R1L.1 — la visionneuse doit EXPLOITER le viewport, pas afficher
        // l'image dans une carte. Tolérances larges : aucune égalité au pixel.
        const geom = await overlay.evaluate((node) => {
          const panel = node.querySelector('[role="dialog"]') ?? node;
          const rect = panel.getBoundingClientRect();
          const style = getComputedStyle(panel as HTMLElement);
          return {
            width: rect.width,
            height: rect.height,
            radius: parseFloat(style.borderTopLeftRadius) || 0,
            background: style.backgroundColor,
            // Viewport de mise en page REEL, pas la valeur declaree : c'est lui
            // que la visionneuse doit remplir.
            vw: document.documentElement.clientWidth,
            vh: document.documentElement.clientHeight,
          };
        });
        const vw = geom.vw;
        const vh = geom.vh;

        expect(
          geom.width / vw,
          `surface : largeur ${geom.width.toFixed(0)} px pour un viewport de ${vw}`,
        ).toBeGreaterThanOrEqual(0.98);
        expect(
          geom.height / vh,
          `surface : hauteur ${geom.height.toFixed(0)} px pour un viewport de ${vh}`,
        ).toBeGreaterThanOrEqual(0.95);
        expect(geom.radius, "carte arrondie : ce n'est pas une visionneuse").toBeLessThanOrEqual(2);

        // Fond sombre uniforme : la luminance perçue doit rester basse.
        const rgb = geom.background.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [255, 255, 255];
        const luminance = (0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!) / 255;
        expect(luminance, `fond non sombre (${geom.background})`).toBeLessThanOrEqual(0.25);

        // L'image doit exploiter toute la largeur disponible et n'être jamais
        // plus petite que dans le fil. Une image PAYSAGE sur un viewport
        // portrait est limitée par la largeur dans les deux cas : le contrat
        // utile est donc « au moins aussi grande », plus l'occupation pleine
        // largeur — pas une inégalité stricte qui serait fausse par géométrie.
        const shown = await image.boundingBox();
        expect(shown, "image de la visionneuse non mesurable").toBeTruthy();
        const inFeed = await card.locator("img").first().boundingBox();
        expect(inFeed, "image du fil non mesurable").toBeTruthy();
        expect(
          shown!.width * shown!.height,
          "l'image agrandie est plus petite que dans le fil",
        ).toBeGreaterThanOrEqual(inFeed!.width * inFeed!.height);
        expect(
          shown!.width / vw,
          `image : largeur ${shown!.width.toFixed(0)} px pour ${vw} disponibles`,
        ).toBeGreaterThanOrEqual(0.98);

        // Le fond ne défile pas tant que la visionneuse est ouverte.
        expect(
          await authedPage.evaluate(() => document.body.style.overflow),
          "scroll d'arrière-plan non verrouillé",
        ).toBe("hidden");

        await overlay
          .getByRole("button", { name: /fermer/i })
          .first()
          .click();
        await expect(overlay).toHaveCount(0);
        await expect(trigger, "focus non restitué au déclencheur").toBeFocused();
        expect(
          await authedPage.evaluate(() => document.body.style.overflow),
          "scroll d'arrière-plan non restitué",
        ).not.toBe("hidden");
      });

      test(`${viewport.label} — visionneuse média : la bottom-nav ne reçoit aucun clic`, async ({
        authedPage,
      }) => {
        const marker = await ensureMediaPost(authedPage);
        await gotoFeed(authedPage);

        await cardWithMarker(authedPage, marker)
          .getByRole("button", { name: /agrandir l.image/i })
          .click();
        await expect(
          authedPage.locator('[data-yunicity-overlay][data-yunicity-overlay-state="entered"]'),
        ).toBeVisible();

        const nav = authedPage.locator(BOTTOM_NAV_SELECTOR).first();
        const box = (await nav.count()) > 0 ? await nav.boundingBox() : null;
        expect(box, "bottom-nav introuvable pour le hit-test").toBeTruthy();

        await armBottomNavClickSentinel(authedPage);
        // Hit-test réel : au centre de la bottom-nav, c'est la surface au-dessus
        // qui reçoit l'événement. Aucun `force`, aucun double clic.
        await authedPage.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
        expect(
          await readBottomNavClicks(authedPage),
          "la bottom-nav a reçu un clic sous la visionneuse",
        ).toBe(0);
      });

      test(`${viewport.label} — visionneuse média : fermeture au clavier`, async ({
        authedPage,
      }) => {
        const marker = await ensureMediaPost(authedPage);
        await gotoFeed(authedPage);

        await cardWithMarker(authedPage, marker)
          .getByRole("button", { name: /agrandir l.image/i })
          .click();
        const overlay = authedPage.locator(
          '[data-yunicity-overlay][data-yunicity-overlay-state="entered"]',
        );
        await expect(overlay).toBeVisible();

        await authedPage.keyboard.press("Escape");
        await expect(overlay, "Escape ne ferme pas la visionneuse").toHaveCount(0);
      });

      // ── Rouge 5 : photo seule ──────────────────────────────────────────────
      test(`${viewport.label} — photo sans texte : règle expliquée, pas seulement bloquée`, async ({
        authedPage,
      }) => {
        await gotoFeed(authedPage);

        const composer = authedPage
          .locator("section")
          .filter({ has: authedPage.getByRole("button", { name: /^photo$/i }) })
          .first();
        await expect(composer, "compositeur mobile absent").toBeVisible();

        await composer.getByRole("button", { name: homeComposerPlaceholder("Reims") }).click();
        await expect(composer.locator("textarea")).toBeVisible();

        await composer.locator('input[type="file"]').first().setInputFiles({
          name: "r1l.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            "base64",
          ),
        });
        await expect(
          composer.getByRole("button", { name: /retirer la photo|retirer/i }).first(),
          "aperçu média non monté",
        ).toBeVisible();

        const submit = composer.getByRole("button", { name: /^publier$/i }).last();
        await expect(submit, "le texte est obligatoire côté API (body min_length=1)").toBeDisabled();
        await expect(
          composer.getByText(/ajoutez un texte/i).first(),
          "blocage sans explication visible",
        ).toBeVisible();

        // L'explication doit aussi être rattachée au bouton pour un lecteur d'écran.
        const describedBy = await submit.getAttribute("aria-describedby");
        expect(describedBy, "explication non reliée au bouton désactivé").toBeTruthy();

        // Le retrait de la photo doit être propre.
        await composer
          .getByRole("button", { name: /retirer la photo|retirer/i })
          .first()
          .click();
        await expect(composer.locator("img")).toHaveCount(0);
      });
    });
  }
});
