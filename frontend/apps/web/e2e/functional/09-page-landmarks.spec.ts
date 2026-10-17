import { readdirSync } from "node:fs";
import path from "node:path";

import type { APIRequestContext, Locator, Page } from "@playwright/test";

import {
  expectExactlyOneMain,
  readLandmarkState,
  waitForCitizenRouteReady,
} from "../landmark-assertions";
import { API_URL, bearer, expect, testCitizen as test, type QaUser } from "../fixtures";
import { COLD_START_TEST_TIMEOUT } from "../cold-start";

type ShellRoute = {
  /*
   * Absent quand la route n'est rendue par AUCUN fichier `*-app-shell.tsx` :
   * `/feed` est dans ce cas depuis la suppression de `feed-app-shell.tsx`. La
   * matrice garde alors la route pour la couverture LANDMARK, sans prétendre
   * désigner un fichier qui n'existe pas — ce que le test de couverture
   * signalait à juste titre.
   */
  shell?: string;
  path: string;
  expectedUrl: RegExp;
  ready: (page: Page) => Locator;
  dynamicEvent?: boolean;
};

const desktop = { width: 1366, height: 900 } as const;
const additionalViewports = [
  { width: 390, height: 844, name: "390" },
  { width: 900, height: 900, name: "900" },
] as const;

const visibleHeading = (page: Page) => page.locator("h1:visible, h2:visible").first();
const feedContent = (page: Page) =>
  page.getByRole("region", { name: "Publier sur le fil local" }).filter({ visible: true });

const SHELL_ROUTES: readonly ShellRoute[] = [
  {
    path: "/feed",
    expectedUrl: /\/feed(?:\?|$)/,
    ready: feedContent,
  },
  {
    shell: "components/videos/videos-app-shell.tsx",
    path: "/videos",
    expectedUrl: /\/videos(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/map/map-app-shell.tsx",
    path: "/map",
    expectedUrl: /\/map(?:$|\?)/,
    /*
     * Le marqueur valait le repli de configuration, « Carte indisponible :
     * configurez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. ». Il ne paraît que SANS clé.
     * `.env.local` en porte une depuis le 05/09/2026 : la carte se charge, le
     * repli n'existe pas, et le test attendait soixante secondes un texte qui ne
     * viendrait jamais. Un marqueur de disponibilité ne doit pas dépendre d'une
     * variable d'environnement.
     *
     * Le titre visible, lui, est présent dans les deux cas — relevé « Explorer
     * Reims » à 1366, « Autour de vous » à 900, « Carte » à 390.
     */
    ready: visibleHeading,
  },
  {
    shell: "components/events/sortir/sortir-app-shell.tsx",
    path: "/sortir",
    expectedUrl: /\/sortir(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/events/event-detail-app-shell.tsx",
    path: "/events/{id}",
    expectedUrl: /\/events\/[^/?]+(?:\?|$)/,
    ready: visibleHeading,
    dynamicEvent: true,
  },
  {
    shell: "components/search/search-app-shell.tsx",
    path: "/search",
    expectedUrl: /\/search(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/passport/passport-app-shell.tsx",
    path: "/passport",
    expectedUrl: /\/passport(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/tribes/tribes-app-shell.tsx",
    path: "/tribes",
    expectedUrl: /\/tribes(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/subscriptions/subscription-app-shell.tsx",
    path: "/subscriptions",
    expectedUrl: /\/subscriptions(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/stories/stories-app-shell.tsx",
    path: "/stories",
    expectedUrl: /\/stories(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/settings/settings-app-shell.tsx",
    path: "/settings",
    expectedUrl: /\/settings(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/profile/profile-app-shell.tsx",
    path: "/profile/me/edit",
    expectedUrl: /\/profile\/me\/edit(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/places/places-app-shell.tsx",
    path: "/places",
    expectedUrl: /\/places(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/organizations/organization-request-app-shell.tsx",
    path: "/organizations/request",
    expectedUrl: /\/organizations\/request(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/notifications/notifications-app-shell.tsx",
    path: "/notifications",
    expectedUrl: /\/notifications(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/neighborhoods/neighborhoods-app-shell.tsx",
    path: "/neighborhoods",
    expectedUrl: /\/neighborhoods(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/discussions/discussions-app-shell.tsx",
    path: "/discussions",
    expectedUrl: /\/discussions(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/layout/web-app-shell.tsx",
    path: "/creators",
    expectedUrl: /\/creators(?:\?|$)/,
    ready: visibleHeading,
  },
] as const;

/*
 * Tunnels de création, découverts par le test de couverture et absents de la
 * matrice. Leurs marqueurs sont RELEVÉS, pas supposés — titre visible à chacune
 * des trois largeurs :
 *
 *   /discussions/new                      « Nouvelle discussion » · « 1.Choisissez un sujet »
 *   /sortir/create                        « Créer un événement » · « Informations essentielles »
 *   /tribes/create                        « Créer une tribu » · « Identité »
 *   /organizations/me/partner/offers/new  « Espace partenaire »
 *
 * Les quatre rendent un `<main>` unique, sans imbrication ni `role="main"`
 * concurrent, aux trois largeurs. La dernière est bien atteignable par un
 * citoyen seedé : elle ne redirige pas.
 */
const CREATION_FLOW_ROUTES: readonly ShellRoute[] = [
  {
    shell: "components/discussions/new/new-discussion-app-shell.tsx",
    path: "/discussions/new",
    expectedUrl: /\/discussions\/new(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/events/create/event-create-app-shell.tsx",
    path: "/sortir/create",
    expectedUrl: /\/sortir\/create(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/tribes/create/tribe-create-app-shell.tsx",
    path: "/tribes/create",
    expectedUrl: /\/tribes\/create(?:\?|$)/,
    ready: visibleHeading,
  },
  {
    shell: "components/partner-portal/offer-create/passport-offer-create-app-shell.tsx",
    path: "/organizations/me/partner/offers/new",
    expectedUrl: /\/organizations\/me\/partner\/offers\/new(?:\?|$)/,
    ready: visibleHeading,
  },
] as const;

const STRATEGIC_ROUTES = new Set([
  "/feed",
  "/videos",
  "/map",
  "/sortir",
]);
const ALL_ROUTES: readonly ShellRoute[] = [...SHELL_ROUTES, ...CREATION_FLOW_ROUTES];

const SHELL_ROUTE_GROUPS = [
  ALL_ROUTES.slice(0, 5),
  ALL_ROUTES.slice(5, 10),
  ALL_ROUTES.slice(10, 14),
  ALL_ROUTES.slice(14, 18),
  ALL_ROUTES.slice(18),
] as const;

function listAppShellFiles(directory: string, root = directory): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listAppShellFiles(absolutePath, root);
    }
    if (!entry.name.endsWith("-app-shell.tsx")) {
      return [];
    }
    return [`components/${path.relative(root, absolutePath).replaceAll("\\", "/")}`];
  });
}

async function resolveRoute(
  route: ShellRoute,
  api: APIRequestContext,
  citizenA: QaUser,
): Promise<string> {
  if (!route.dynamicEvent) {
    return route.path;
  }

  const response = await api.get(`${API_URL}/api/v1/events?city=Reims`, {
    headers: bearer(citizenA),
  });
  expect(response.ok(), "liste des événements QA indisponible").toBe(true);
  const eventId = ((await response.json()) as { items: Array<{ id: string }> }).items[0]?.id;
  expect(eventId, "événement QA seedé attendu").toBeTruthy();
  return `/events/${eventId}`;
}

async function verifyCitizenLandmarks(
  page: Page,
  route: ShellRoute,
  pathToVisit: string,
  viewportWidth: number,
): Promise<void> {
  /*
   * Le sujet de cette spec est le landmark `<main>` : un seul, jamais imbriqué,
   * jamais doublé d'un `role="main"`. La PRÉSENCE d'une navigation globale n'en
   * fait pas partie, et le relevé explique pourquoi — elle vaut 0 ou 1 selon la
   * surface ET la largeur, sans règle simple : `/organizations/request` à 0
   * partout, `/sortir/create` à 1 en 1366 seulement, les tunnels à 0 en 390.
   * L'exiger imposait un tableau route × largeur de dix-huit cases, qui aurait
   * gelé chaque choix de maquette.
   *
   * Ce qui reste garanti ici, par `expectExactlyOneMain` et sans condition :
   * jamais DEUX navigations principales visibles. La présence, elle, est le
   * sujet propre de la spec 08, sur ses routes représentatives.
   *
   * `viewportWidth` est conservé : il documente la largeur réellement mesurée et
   * sert aux assertions qui en dépendent encore.
   */
  await waitForCitizenRouteReady(page, pathToVisit, route.expectedUrl, route.ready(page), {
    viewportWidth,
    requirePrimaryNav: false,
  });
  expectExactlyOneMain(await readLandmarkState(page), pathToVisit, {
    viewportWidth,
    requirePrimaryNav: false,
  });
}

test.describe("Landmarks des shells applicatifs", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("la matrice couvre automatiquement chaque fichier *-app-shell.tsx", () => {
    const componentsRoot = path.resolve(process.cwd(), "components");
    const discovered = listAppShellFiles(componentsRoot).sort();
    const covered = ALL_ROUTES.map((route) => route.shell)
      .filter((shell): shell is string => Boolean(shell))
      .sort();

    expect(discovered).toEqual(covered);
  });

  for (const [groupIndex, routes] of SHELL_ROUTE_GROUPS.entries()) {
    test(`groupe ${groupIndex + 1} : chaque shell rend un unique main à 1366`, async ({
      citizenAPage,
      api,
      citizenA,
    }) => {
      await citizenAPage.setViewportSize(desktop);
      for (const route of routes) {
        const pathToVisit = await resolveRoute(route, api, citizenA);
        await verifyCitizenLandmarks(citizenAPage, route, pathToVisit, desktop.width);
      }
    });
  }

  for (const route of ALL_ROUTES.filter((candidate) => STRATEGIC_ROUTES.has(candidate.path))) {
    test(`${route.path} rend un unique main à 390 et 900`, async ({
      citizenAPage,
      api,
      citizenA,
    }) => {
      const pathToVisit = await resolveRoute(route, api, citizenA);
      for (const viewport of additionalViewports) {
        await citizenAPage.setViewportSize(viewport);
        await verifyCitizenLandmarks(citizenAPage, route, pathToVisit, viewport.width);
      }
    });
  }
});

test.describe("Routes sémantiques hors app-shell", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  for (const route of ["/login", "/register"] as const) {
    test(`${route} rend un unique main`, async ({ page }) => {
      await page.setViewportSize(desktop);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`${route}(?:\\?|$)`));
      await expect(page.getByText(/^Chargement…$/)).toHaveCount(0, {
        timeout: COLD_START_TEST_TIMEOUT / 2,
      });
      await expect(page.locator("h1:visible").first()).toBeVisible({
        timeout: COLD_START_TEST_TIMEOUT / 2,
      });

      const state = await readLandmarkState(page);
      expect(state.main, `${route} doit rendre exactement un <main>`).toBe(1);
      expect(state.nestedMain, `<main> imbriqué sur ${route}`).toBe(0);
      expect(state.roleMainConcurrent, `role="main" concurrent sur ${route}`).toBe(0);
    });
  }

  test("/feed/new rend un unique main", async ({ citizenAPage }) => {
    await citizenAPage.setViewportSize(desktop);
    await waitForCitizenRouteReady(
      citizenAPage,
      "/feed/new",
      /\/feed\/new(?:\?|$)/,
      citizenAPage.locator("h1:visible").first(),
    );
    expectExactlyOneMain(await readLandmarkState(citizenAPage), "/feed/new");
  });
});
