import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Page } from "@playwright/test";

import { CITIZEN_A_EMAIL, expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import { readLandmarkState } from "../landmark-assertions";
import {
  PUBLIC_HOME_COPY,
  PUBLIC_HOME_MOBILE_EXPLORE_ITEMS,
  PUBLIC_HOME_ROUTES,
} from "@/lib/marketing/public-home-contract";

const QA_SEEDED_PASSWORD = "StrongPassword1!";

/**
 * C3.1-R1B — accueil public `/` : landing visiteur, redirection connecté, pas de diagnostic API.
 */

/*
 * Le titre vient du CONTRAT produit, pas d'une copie. Il valait ici
 * « Reims, plus proche de vous. » quand la landing affiche « Votre ville, au
 * même endroit. » depuis un changement de wording : la spec attendait un H1 qui
 * n'existait plus, échouait au bout de soixante secondes, et le message ne
 * disait rien du vrai sujet du test. Un littéral recopié se périme en silence ;
 * une référence au contrat ne compile plus.
 */
const HERO_TITLE = PUBLIC_HOME_COPY.heroTitle;
/**
 * `touch` déclare si le palier est manipulé au DOIGT.
 *
 * La règle 08 écrit « touch >= 44px MOBILE ». Ce test l'appliquait aux quatre
 * largeurs, donc aussi au pointeur. Mesuré à 1366 px : les liens d'en-tête
 * « Découvrir Reims » (103x20) et « Comment ça marche » (131x20) tombent sous
 * le seuil — deux contrôles de navigation desktop, à la souris. Les trois
 * paliers tactiles, eux, passent.
 *
 * Le seuil n'est pas déplacé : il est appliqué là où la doctrine le place. La
 * hauteur de ces deux liens desktop est consignée comme constat produit, à
 * trancher séparément.
 */
const VIEWPORTS = [
  { width: 390, height: 844, name: "390", touch: true },
  { width: 393, height: 852, name: "393", touch: true },
  { width: 900, height: 900, name: "900", touch: true },
  { width: 1366, height: 900, name: "1366", touch: false },
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
    /*
     * Accès à la connexion et à l'inscription — libellés et routes DÉRIVÉS du
     * contrat de copie, jamais recopiés : c'est une liste écrite à la main qui
     * a laissé cette spec exiger un lien retiré du produit.
     */
    await expect(
      page.getByRole("link", { name: PUBLIC_HOME_COPY.headerLogin }),
      "accès à la connexion absent de la landing",
    ).toHaveAttribute("href", PUBLIC_HOME_ROUTES.login);
    await expect(page.getByRole("link", { name: PUBLIC_HOME_COPY.headerRegister })).toHaveAttribute(
      "href",
      PUBLIC_HOME_ROUTES.register,
    );
    await expect(page.getByRole("link", { name: PUBLIC_HOME_COPY.heroDiscover }).first()).toHaveAttribute(
      "href",
      PUBLIC_HOME_ROUTES.discover,
    );
    await expect(page.getByRole("link", { name: PUBLIC_HOME_COPY.heroRegister }).first()).toHaveAttribute(
      "href",
      PUBLIC_HOME_ROUTES.register,
    );
    /*
     * Suivait ici un lien « J'ai déjà un compte » du héros, exigé vers /login.
     * Relevé : ce libellé n'existe PLUS dans le produit — le contrat de copie
     * l'a remplacé par `heroGuestNote` (« Vous pouvez explorer sans créer de
     * compte. »). L'EXIGENCE, elle, est conservée et même renforcée : l'accès à
     * la connexion est vérifié ci-dessus sur l'affordance réelle, et le test
     * « login et register restent accessibles » le CLIQUE réellement.
     */
    // Les trois paliers sont rendus dans le DOM ; seul le visible fait preuve.
    await expect(
      page.getByText(PUBLIC_HOME_COPY.heroGuestNote).filter({ visible: true }),
      "note visiteur du héros absente",
    ).toHaveCount(1);
    /*
     * Routes de découverte — DÉRIVÉES du contrat.
     *
     * Ces trois lignes étaient écrites à la main et exigeaient « Sortir à
     * Reims » vers /sortir : ce libellé n'existe plus, et `PUBLIC_HOME_ROUTES`
     * n'a plus aucune clé `sortir`. Le contrat porte Quartiers / Tribus /
     * Lieux.
     *
     * L'assertion porte sur la ROUTE, sujet déclaré de ce test. Le `name` de
     * `getByRole` matche en SOUS-CHAÎNE : « Quartiers » attrapait aussi « Voir
     * les quartiers », et le test ne prouvait donc pas ce qu'il annonçait. On
     * exige donc un lien VISIBLE vers chaque route, et son nom accessible
     * EXACT.
     *
     * Le contrat MOBILE fait foi : ce test s'exécute à 390 px, et la ligne de
     * découverte mobile porte `aria-label={title}`. Le champ `linkLabel`
     * (« Voir les quartiers ») n'existe que sur les cartes medium/desktop —
     * l'exiger ici mesurait un palier qui n'est pas celui du test. Les routes,
     * elles, sont les mêmes dans les deux contrats.
     */
    for (const item of PUBLIC_HOME_MOBILE_EXPLORE_ITEMS) {
      await expect(
        page.locator(`a[href="${item.href}"]`).filter({ visible: true }),
        `aucun lien visible vers ${item.href} (${item.title})`,
      ).not.toHaveCount(0);
      await expect(
        page.getByRole("link", { name: item.title, exact: true }).filter({ visible: true }),
        `lien « ${item.title} » absent`,
      ).not.toHaveCount(0);
    }

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
    /*
     * UN titre de niveau 1 — mesuré sur le VISIBLE.
     *
     * La landing rend les trois paliers dans le DOM et n'en montre qu'un par
     * CSS : trois `h1` existent, un seul est affiché. Compter les nœuds
     * exigeait donc une restructuration du rendu responsive pour une règle qui
     * porte sur ce que l'utilisateur et les technologies d'assistance
     * perçoivent — un `h1` sous `display: none` est retiré de l'arbre
     * d'accessibilité.
     */
    await expect(
      page.locator("h1").filter({ visible: true }),
      "un seul titre de niveau 1 visible",
    ).toHaveCount(1);

    await page.getByRole("link", { name: PUBLIC_HOME_COPY.headerLogin }).first().click();
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
        /*
         * La landing rend les TROIS paliers dans le DOM et n'en montre qu'un
         * par CSS. Mesurer tous les `[data-public-home-control]` relevait donc
         * 112 contrôles « trop petits », tous en 0×0 : ceux des autres
         * paliers. Une cible tactile ne concerne que ce qui est TOUCHABLE —
         * on ne juge que les contrôles effectivement rendus, et le seuil de
         * 44 px reste entier.
         */
        const touchable = (el: Element) => {
          if (el.getClientRects().length === 0) return false;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return false;
          for (let node: Element | null = el; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden") return false;
          }
          return true;
        };
        const ctas = Array.from(document.querySelectorAll("[data-public-home-control]")).filter(
          touchable,
        );
        const smallCtas = ctas
          .map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              name: (el.textContent ?? "").trim().slice(0, 40),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })
          .filter((cta) => cta.height < 44 || cta.width < 44);
        return {
          overflowX: scrolling.scrollWidth - scrolling.clientWidth,
          wordmarkVisible: Boolean(wordmarkRect && wordmarkRect.width > 8 && wordmarkRect.height > 8),
          controlesTouchables: ctas.length,
          smallCtas,
        };
      });

      expect(metrics.overflowX, `${viewport.name}: overflow horizontal`).toBeLessThanOrEqual(1);
      expect(metrics.wordmarkVisible, `${viewport.name}: wordmark Yunicity invisible`).toBe(true);
      expect(
        metrics.controlesTouchables,
        `${viewport.name}: aucun contrôle rendu — le filtre a tout écarté`,
      ).toBeGreaterThan(0);
      if (viewport.touch) {
        expect(metrics.smallCtas, `${viewport.name}: cibles < 44 px`).toEqual([]);
      }
      if (viewport.name === "390" || viewport.name === "900" || viewport.name === "1366") {
        await captureLanding(page, viewport.width);
      }
    }
  });

  test("login et register restent accessibles depuis la landing", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPublicHome(page);
    await page.getByRole("link", { name: PUBLIC_HOME_COPY.headerRegister }).first().click();
    await expect(page).toHaveURL(/\/register/, { timeout: COLD_START_TIMEOUT });
    await page.goto("/");
    await waitSessionReady(page);
    /*
     * L'exigence « la connexion reste accessible depuis la landing » est
     * conservée : elle s'exerce désormais sur l'affordance QUI EXISTE, et par
     * un clic réel — le lien du héros qu'exigeait cette ligne a été retiré du
     * produit, pas l'accès à la connexion.
     */
    await page.getByRole("link", { name: PUBLIC_HOME_COPY.headerLogin }).first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: COLD_START_TIMEOUT });
  });
});
