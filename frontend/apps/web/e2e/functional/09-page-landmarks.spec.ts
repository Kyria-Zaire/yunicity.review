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
  shell: string;
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
    shell: "components/feed/portal/feed-app-shell.tsx",
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
    expectedUrl: /\/map(?:\?|$)/,
    ready: (page) =>
      page.getByText("Carte indisponible : configurez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.", {
        exact: true,
      }).filter({ visible: true }).first(),
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

const STRATEGIC_ROUTES = new Set([
  "/feed",
  "/videos",
  "/map",
  "/sortir",
]);
const SHELL_ROUTE_GROUPS = [
  SHELL_ROUTES.slice(0, 5),
  SHELL_ROUTES.slice(5, 10),
  SHELL_ROUTES.slice(10, 14),
  SHELL_ROUTES.slice(14),
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
): Promise<void> {
  await waitForCitizenRouteReady(page, pathToVisit, route.expectedUrl, route.ready(page));
  expectExactlyOneMain(await readLandmarkState(page), pathToVisit);
}

test.describe("Landmarks des shells applicatifs", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("la matrice couvre automatiquement chaque fichier *-app-shell.tsx", () => {
    const componentsRoot = path.resolve(process.cwd(), "components");
    const discovered = listAppShellFiles(componentsRoot).sort();
    const covered = SHELL_ROUTES.map((route) => route.shell).sort();

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
        await verifyCitizenLandmarks(citizenAPage, route, pathToVisit);
      }
    });
  }

  for (const route of SHELL_ROUTES.filter((candidate) => STRATEGIC_ROUTES.has(candidate.path))) {
    test(`${route.path} rend un unique main à 390 et 900`, async ({
      citizenAPage,
      api,
      citizenA,
    }) => {
      const pathToVisit = await resolveRoute(route, api, citizenA);
      for (const viewport of additionalViewports) {
        await citizenAPage.setViewportSize(viewport);
        await verifyCitizenLandmarks(citizenAPage, route, pathToVisit);
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
