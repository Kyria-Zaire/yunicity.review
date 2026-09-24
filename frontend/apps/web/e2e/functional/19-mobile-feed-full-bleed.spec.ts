import type { Locator, Page } from "@playwright/test";

import { expect, testCitizen as test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT } from "../cold-start";
import { publishCitizenPostWithMedia } from "../feed-media-fixture";
import { makeSolidPngDataUri } from "../png-fixture";
import { scrollToStableBottom } from "../scroll";

/**
 * C3.1-R1D — Mobile Feed Full-Bleed Closure.
 *
 * Contrat visuel < 640 px (fil unifié medium/mobile) :
 *   A. séparateur sous le header mobile pleine largeur viewport
 *   B. onglets lisibles (>= 44 px, bordure inactive opaque et contrastée)
 *   C. aucun bouton Filtrer mobile (ni DOM chrome mobile, ni arbre d'accessibilité)
 *   D. publications en carte éditoriale (gouttière latérale, coins arrondis, bordures)
 *   E. médias contenus dans la carte, object-contain, pas de recadrage (R1C)
 *   F. actions atteignables au scroll maximal malgré la bottom-nav flottante
 *
 * Frontière : >= 640 px le comportement medium/desktop est inchangé (filtre conservé,
 * cartes en carte).
 *
 * TOLÉRANCE BORD : 1 px. Justification — les boîtes retournées par `boundingBox()`
 * sont en pixels CSS fractionnaires ; un `devicePixelRatio` non entier (Pixel 7 = 2.625)
 * produit des arrondis sub-pixel sur les bords. 1 px est la borne de bruit de mesure,
 * pas une marge de tolérance produit : un retrait réel vaut 16 px ou plus.
 */

const EDGE_TOLERANCE_PX = 1;
const MIN_TOUCH_TARGET_PX = 44;
/** WCAG 2.1 - 1.4.11 Non-text Contrast : bord d'un composant d'interface >= 3:1. */
const MIN_UI_CONTRAST = 3;
/** Padding horizontal interne attendu pour le contenu textuel d'une publication. */
const MIN_CONTENT_PADDING_PX = 12;

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844, name: "390x844" },
  { width: 393, height: 852, name: "393x852" },
  { width: 639, height: 900, name: "639x900" },
] as const;


/** Portrait 9:16 — le format que R1C interdit de recadrer. */
const PORTRAIT_PNG = { width: 360, height: 640 } as const;
const PORTRAIT_DATA_URI = makeSolidPngDataUri(
  PORTRAIT_PNG.width,
  PORTRAIT_PNG.height,
  0xef,
  0x44,
  0x44,
);

type Rect = { x: number; y: number; width: number; height: number };

type Rgba = { r: number; g: number; b: number; a: number };

// ── Fixtures des consommateurs partagés ──────────────────────────────────────
// Le seed QA ne contient AUCUNE publication d'organisation ni d'événement
// (0 organization_members, 0 post de type `event`) et cette mission interdit de
// toucher au backend ou au seed. Les deux consommateurs de `FeedMobileMedia`
// sont donc injectés à la frontière réseau, sur `GET /api/v1/feed`, afin que le
// vrai arbre React les rende et que la géométrie mesurée soit réelle.
// La publication citoyenne, elle, est aussi vérifiée sur le fil RÉEL (non stubbé).

type FeedAuthorFixture = {
  type: "citizen" | "organization";
  id: string;
  display_name: string;
  username: string | null;
  logo_url: string | null;
};

type FeedPostFixture = {
  id: string;
  type: "post" | "event";
  author: FeedAuthorFixture;
  city: string | null;
  title: string | null;
  body: string | null;
  media_url: string | null;
  location: null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  offer: null;
  event: {
    local_event_id: string;
    starts_at: string;
    ends_at: string | null;
    location_name: string;
    district: string | null;
    event_type: string | null;
    interested_by_me: boolean;
  } | null;
  creator_content: null;
  neighborhood_summary: { slug: string; display_name: string } | null;
  created_at: string;
  updated_at: string;
};

const FIXTURE_NOW = "2026-08-19T09:00:00Z";

const CONSUMER_MARKERS = {
  citizen: "R1D consommateur citoyen",
  organization: "R1D consommateur organisation",
  event: "R1D consommateur evenement",
} as const;

function baseFixture(id: string, marker: string, author: FeedAuthorFixture): FeedPostFixture {
  return {
    id,
    type: "post",
    author,
    city: "Reims",
    title: null,
    body: marker,
    media_url: PORTRAIT_DATA_URI,
    location: null,
    like_count: 3,
    comment_count: 1,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: null,
    created_at: FIXTURE_NOW,
    updated_at: FIXTURE_NOW,
  };
}

const CONSUMER_FIXTURES: FeedPostFixture[] = [
  baseFixture("11111111-1111-4111-8111-111111111111", CONSUMER_MARKERS.citizen, {
    type: "citizen",
    id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    display_name: "Camille Citoyenne",
    username: "camille",
    logo_url: null,
  }),
  baseFixture("22222222-2222-4222-8222-222222222222", CONSUMER_MARKERS.organization, {
    type: "organization",
    id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
    display_name: "Musée Saint-Remi",
    username: "musee_saint_remi",
    logo_url: null,
  }),
  {
    ...baseFixture("33333333-3333-4333-8333-333333333333", CONSUMER_MARKERS.event, {
      type: "organization",
      id: "cccccccc-3333-4333-8333-cccccccccccc",
      display_name: "Opéra de Reims",
      username: "opera_reims",
      logo_url: null,
    }),
    type: "event",
    title: "Concert au parc",
    event: {
      local_event_id: "dddddddd-4444-4444-8444-dddddddddddd",
      starts_at: "2026-09-01T18:00:00Z",
      ends_at: "2026-09-01T21:00:00Z",
      location_name: "Parc de Champagne",
      district: null,
      event_type: "concert",
      interested_by_me: false,
    },
  },
];

async function stubFeedWithConsumers(page: Page): Promise<void> {
  await page.route("**/api/v1/feed?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: CONSUMER_FIXTURES, next_cursor: null }),
    });
  });
}

// ── Outillage de mesure ──────────────────────────────────────────────────────

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

async function gotoFeedReady(page: Page): Promise<void> {
  await page.goto("/feed", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/feed/, { timeout: COLD_START_TIMEOUT });
  await waitSessionReady(page);
}

async function boxOrFail(locator: Locator, label: string): Promise<Rect> {
  const box = await locator.boundingBox();
  expect(box, `${label} : élément sans boîte de rendu`).not.toBeNull();
  return box as Rect;
}

async function computed(
  locator: Locator,
  properties: readonly string[],
): Promise<Record<string, string>> {
  return locator.evaluate((node, keys: string[]) => {
    const style = getComputedStyle(node as Element);
    const out: Record<string, string> = {};
    for (const key of keys) {
      out[key] = style.getPropertyValue(key);
    }
    return out;
  }, properties as string[]);
}

function px(value: string | undefined): number {
  return Number.parseFloat(value ?? "0") || 0;
}

function parseRgba(value: string | undefined): Rgba {
  const match = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/.exec(
    value ?? "",
  );
  if (!match) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const RADIUS_PROPERTIES = [
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
] as const;

async function expectSpansViewport(
  locator: Locator,
  viewportWidth: number,
  label: string,
): Promise<void> {
  const box = await boxOrFail(locator, label);
  expect(box.x, `${label} : bord gauche à ${box.x.toFixed(1)} px du viewport`).toBeLessThanOrEqual(
    EDGE_TOLERANCE_PX,
  );
  expect(
    box.x + box.width,
    `${label} : bord droit à ${(box.x + box.width).toFixed(1)} px (viewport ${viewportWidth})`,
  ).toBeGreaterThanOrEqual(viewportWidth - EDGE_TOLERANCE_PX);
}

async function expectSquareCorners(locator: Locator, label: string): Promise<void> {
  const style = await computed(locator, RADIUS_PROPERTIES);
  for (const property of RADIUS_PROPERTIES) {
    expect(px(style[property]), `${label} : ${property} = ${style[property]}`).toBe(0);
  }
}

async function expectNoVerticalBorders(locator: Locator, label: string): Promise<void> {
  const style = await computed(locator, ["border-left-width", "border-right-width"]);
  expect(px(style["border-left-width"]), `${label} : bordure gauche`).toBe(0);
  expect(px(style["border-right-width"]), `${label} : bordure droite`).toBe(0);
}

async function expectNoDocumentOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    metrics.scrollWidth,
    `${label} : overflow horizontal (scrollWidth ${metrics.scrollWidth} > innerWidth ${metrics.innerWidth})`,
  ).toBeLessThanOrEqual(metrics.innerWidth + EDGE_TOLERANCE_PX);
}

function mobileColumn(page: Page): Locator {
  return page.locator(".feed-main-column").first();
}

function mobileHeader(page: Page): Locator {
  return page.locator("header.web-mobile-feed-only");
}

function mobileTablist(page: Page): Locator {
  // `aria-label="Vue du fil"` est aussi porté par `FeedViewTabs` (desktop) :
  // on vise explicitement le tablist du chrome mobile.
  return page.locator('.web-mobile-feed-only [role="tablist"][aria-label="Vue du fil"]');
}

/**
 * Média d'une publication mobile.
 *
 * L'avatar d'auteur porte `width`/`height` explicites (40x40) ; le média de la
 * publication n'en porte pas. Ce critère est stable avant ET après correction,
 * donc utilisable pour la preuve RED comme pour la preuve GREEN.
 */
function postMedia(card: Locator): Locator {
  return card.locator("img:not([width])").first();
}

function mediaFrame(media: Locator): Locator {
  return media.locator("xpath=..");
}

function visibleCards(page: Page): Locator {
  return page.locator("article").filter({ visible: true });
}

// ── Assertions du contrat ────────────────────────────────────────────────────

async function assertSeparatorFullBleed(
  page: Page,
  viewportWidth: number,
  label: string,
): Promise<void> {
  const header = mobileHeader(page);
  await expect(header, `${label} : header mobile absent`).toBeVisible();
  await expectSpansViewport(header, viewportWidth, `${label} séparateur`);

  const style = await computed(header, ["border-bottom-width", "border-bottom-color"]);
  expect(px(style["border-bottom-width"]), `${label} : séparateur sans épaisseur`).toBeGreaterThan(
    0,
  );
  expect(
    parseRgba(style["border-bottom-color"]).a,
    `${label} : séparateur transparent`,
  ).toBeGreaterThan(0);

  // Le contenu du header garde son padding interne.
  const logo = header.locator('[data-yunicity-mobile-header-control="logo"]');
  const logoBox = await boxOrFail(logo, `${label} logo header`);
  expect(logoBox.x, `${label} : contenu du header collé au bord`).toBeGreaterThanOrEqual(
    MIN_CONTENT_PADDING_PX,
  );
}

async function assertTabsContract(page: Page, label: string): Promise<void> {
  // C3.1-R1L (addendum maquette) : la rangee de pills mobiles
  // « Pour vous / Abonnements / Pres de moi » etait un heritage de l'ecran
  // actuel, absente de la maquette mobile canonique. Deux de ses trois pastilles
  // etaient de surcroit des LIENS vers /subscriptions et /map, sans contrat de
  // fil derriere. La rangee est retiree du mobile : le contrat verifie ici
  // devient son ABSENCE, et l'absence de tout substitut medium/desktop importe
  // dans le chrome mobile.
  await expect(mobileTablist(page), `${label} : rangee de pills encore rendue`).toHaveCount(0);

  const mobileChrome = page.locator(".web-mobile-feed-only");
  await expect(
    mobileChrome.locator('a[href="/subscriptions"], a[href="/map"]'),
    `${label} : lien sortant deguise encore present dans le chrome mobile`,
  ).toHaveCount(0);
}

async function assertNoMobileFilter(page: Page, label: string): Promise<void> {
  // Arbre d'accessibilité : le moteur de rôles Playwright ignore les éléments masqués.
  await expect(
    page.getByRole("button", { name: "Filtrer" }),
    `${label} : bouton Filtrer présent dans l'arbre d'accessibilité`,
  ).toHaveCount(0);

  // DOM du chrome mobile : aucune trace, donc aucune zone vide réservée.
  await expect(
    page.locator('.web-mobile-feed-only [aria-label="Filtrer"]'),
    `${label} : bouton Filtrer présent dans le chrome mobile`,
  ).toHaveCount(0);

  // C3.1-R1L (addendum maquette) : la garde « pas de créneau vide à droite des
  // onglets » n'a plus d'objet — la rangée de pills est retirée du mobile. Son
  // absence est vérifiée par `assertTabsContract`.
}

async function assertCardEditorialFormat(
  card: Locator,
  viewportWidth: number,
  label: string,
): Promise<void> {
  await expect(card, `${label} : carte absente`).toBeVisible();
  const box = await boxOrFail(card, `${label} carte`);
  expect(box.x, `${label} : carte collée au bord gauche`).toBeGreaterThan(EDGE_TOLERANCE_PX);
  expect(
    box.x + box.width,
    `${label} : carte déborde à droite`,
  ).toBeLessThanOrEqual(viewportWidth - EDGE_TOLERANCE_PX);

  const radius = await computed(card, ["border-top-left-radius"]);
  expect(px(radius["border-top-left-radius"]), `${label} : carte sans rayon`).toBeGreaterThan(0);

  const author = card.locator("header p").first();
  const authorBox = await boxOrFail(author, `${label} auteur`);
  expect(authorBox.x, `${label} : texte auteur collé au bord gauche`).toBeGreaterThanOrEqual(
    box.x + MIN_CONTENT_PADDING_PX - EDGE_TOLERANCE_PX,
  );
  expect(
    authorBox.x + authorBox.width,
    `${label} : texte auteur collé au bord droit`,
  ).toBeLessThanOrEqual(box.x + box.width - MIN_CONTENT_PADDING_PX + EDGE_TOLERANCE_PX);
}

async function assertMediaEditorialFormat(card: Locator, label: string): Promise<void> {
  const media = postMedia(card);
  await expect(media, `${label} : média absent`).toBeVisible();

  const cardBox = await boxOrFail(card, `${label} carte`);
  const mediaBox = await boxOrFail(media, `${label} image média`);
  expect(mediaBox.x, `${label} : média déborde à gauche`).toBeGreaterThanOrEqual(
    cardBox.x - EDGE_TOLERANCE_PX,
  );
  expect(mediaBox.x + mediaBox.width, `${label} : média déborde à droite`).toBeLessThanOrEqual(
    cardBox.x + cardBox.width + EDGE_TOLERANCE_PX,
  );

  const mediaRadius = await computed(media, ["border-top-left-radius"]);
  expect(px(mediaRadius["border-top-left-radius"]), `${label} : média sans rayon`).toBeGreaterThan(
    0,
  );

  const style = await computed(media, ["object-fit"]);
  expect(style["object-fit"], `${label} : object-fit`).toBe("contain");

  const natural = await media.evaluate((node) => {
    const image = node as HTMLImageElement;
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(natural.width, `${label} : image non chargée`).toBeGreaterThan(0);
  expect(natural.height, `${label} : image non chargée`).toBeGreaterThan(0);

  const naturalRatio = natural.width / natural.height;
  expect(
    mediaBox.height,
    `${label} : hauteur rendue ${mediaBox.height.toFixed(0)} au-delà du ratio naturel — recadrage suspecté`,
  ).toBeLessThanOrEqual(mediaBox.width / naturalRatio + 4);
}

async function assertActionsReachable(card: Locator, label: string): Promise<void> {
  const toolbar = card.locator('[role="toolbar"][aria-label="Actions sur la publication"]');
  await expect(toolbar, `${label} : barre d'actions absente`).toBeVisible();
  const actions = toolbar.locator("button");
  const count = await actions.count();
  expect(count, `${label} : aucune action`).toBeGreaterThanOrEqual(3);

  for (let index = 0; index < count; index++) {
    const action = actions.nth(index);
    await expect(action, `${label} : action ${index} masquée`).toBeVisible();
    const box = await boxOrFail(action, `${label} action ${index}`);
    const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const hit = await action.evaluate((node, point: { x: number; y: number }) => {
      const top = document.elementFromPoint(point.x, point.y);
      if (!top) return "none";
      if (node.contains(top) || top === node) return "self";
      const nav = top.closest(".web-mobile-strategic-bottom-nav");
      return nav ? "bottom-nav" : "other";
    }, target);
    expect(hit, `${label} : action ${index} non cliquable (interceptée par ${hit})`).toBe("self");
  }
}

// ── Matrice mobile < 640 px ──────────────────────────────────────────────────

test.describe("C3.1-R1D — Feed mobile éditorial unifié", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`${viewport.name} — séparateur, onglets, filtre absent, publication éditoriale (fil réel)`, async ({
      citizenAPage: page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // C3.1-R1G — autonomie : la spec crée SA propre publication avec média par les
      // contrats HTTP existants, avant tout chargement de page. Elle ne dépend plus
      // d'une publication laissée par les specs 16/17/18, ni du contenu du seed, ni
      // d'un rang dans le fil. Le format est portrait : le contrat R1C est donc aussi
      // exercé sur le chemin réel.
      const published = await publishCitizenPostWithMedia(page, {
        marker: `R1G fil reel ${viewport.name} ${Date.now()}`,
      });

      await gotoFeedReady(page);

      const label = viewport.name;
      await expect(mobileColumn(page), `${label} : colonne mobile absente`).toBeVisible();

      await assertSeparatorFullBleed(page, viewport.width, label);
      await assertTabsContract(page, label);
      await assertNoMobileFilter(page, label);

      // Cible exacte : la publication créée ci-dessus, jamais « la première du fil ».
      const card = page
        .locator("article")
        .filter({ hasText: published.marker })
        .filter({ visible: true });
      await expect(card, `${label} : publication créée absente du fil`).toBeVisible({
        timeout: COLD_START_TIMEOUT,
      });
      await assertCardEditorialFormat(card, viewport.width, `${label} citoyen`);
      await assertMediaEditorialFormat(card, `${label} citoyen`);

      await expectNoDocumentOverflow(page, label);
    });

    test(`${viewport.name} — consommateurs partagés : citoyen, organisation, événement`, async ({
      citizenAPage: page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await stubFeedWithConsumers(page);
      await gotoFeedReady(page);

      for (const [kind, marker] of Object.entries(CONSUMER_MARKERS)) {
        const label = `${viewport.name} ${kind}`;
        const card = page.locator("article").filter({ hasText: marker }).filter({ visible: true });
        await expect(card, `${label} : carte absente`).toBeVisible({ timeout: COLD_START_TIMEOUT });
        await assertCardEditorialFormat(card, viewport.width, label);
        await assertMediaEditorialFormat(card, label);
      }

      await expectNoDocumentOverflow(page, viewport.name);
    });
  }

  test("390x844 — au scroll maximal, les actions du dernier post restent atteignables", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubFeedWithConsumers(page);
    await gotoFeedReady(page);

    const cards = visibleCards(page);
    await expect(cards.first()).toBeVisible({ timeout: COLD_START_TIMEOUT });

    await scrollToStableBottom(page);

    const bottomNav = page.locator("nav.web-mobile-strategic-bottom-nav");
    await expect(bottomNav, "bottom-nav absente").toBeVisible();

    await assertActionsReachable(cards.last(), "max-scroll dernier post");
    await expectNoDocumentOverflow(page, "max-scroll");
  });

  // ── Frontière 640 px : comportement medium inchangé ────────────────────────

  test("640x900 — frontière medium : chrome mobile éteint, filtre et cartes conservés", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await stubFeedWithConsumers(page);
    await gotoFeedReady(page);

    await expect(mobileHeader(page), "640 : chrome mobile encore rendu").toBeHidden();
    await expect(mobileTablist(page), "640 : onglets mobiles encore rendus").toBeHidden();

    await expect(
      page.getByRole("button", { name: "Filtrer" }),
      "640 : filtre medium supprimé",
    ).toHaveCount(1);

    // >= 640 px les deux branches (mobile masquée, desktop rendue) coexistent dans
    // le DOM : on vise explicitement la carte réellement visible.
    const card = page
      .locator("article")
      .filter({ hasText: CONSUMER_MARKERS.citizen })
      .filter({ visible: true })
      .first();
    await expect(card).toBeVisible({ timeout: COLD_START_TIMEOUT });

    const box = await boxOrFail(card, "640 carte");
    expect(box.x, "640 : carte devenue bord à bord").toBeGreaterThan(EDGE_TOLERANCE_PX);
    const radius = await computed(card, ["border-top-left-radius"]);
    expect(
      px(radius["border-top-left-radius"]),
      "640 : carte medium aux angles droits",
    ).toBeGreaterThan(0);

    await expectNoDocumentOverflow(page, "640");
  });

  // ── Régression desktop ─────────────────────────────────────────────────────

  test("1366x900 — desktop non régressé : cartes, filtre et médias conservés", async ({
    citizenAPage: page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await stubFeedWithConsumers(page);
    await gotoFeedReady(page);

    await expect(mobileHeader(page), "1366 : chrome mobile rendu").toBeHidden();
    await expect(
      page.getByRole("button", { name: "Filtrer" }),
      "1366 : filtre desktop supprimé",
    ).toHaveCount(1);

    // >= 640 px les deux branches (mobile masquée, desktop rendue) coexistent dans
    // le DOM : on vise explicitement la carte réellement visible.
    const card = page
      .locator("article")
      .filter({ hasText: CONSUMER_MARKERS.citizen })
      .filter({ visible: true })
      .first();
    await expect(card).toBeVisible({ timeout: COLD_START_TIMEOUT });

    const box = await boxOrFail(card, "1366 carte");
    expect(box.x, "1366 : carte devenue bord à bord").toBeGreaterThan(EDGE_TOLERANCE_PX);
    expect(box.width, "1366 : carte étalée sur tout le viewport").toBeLessThan(1366 - 100);

    const radius = await computed(card, ["border-top-left-radius"]);
    expect(
      px(radius["border-top-left-radius"]),
      "1366 : carte desktop aux angles droits",
    ).toBeGreaterThan(0);

    // Le média desktop garde son propre traitement (rayon non nul) : les règles
    // bord à bord mobiles n'ont pas fui.
    const media = postMedia(card);
    await expect(media).toBeVisible();
    const mediaRadius = await computed(media, ["border-top-left-radius"]);
    expect(
      px(mediaRadius["border-top-left-radius"]),
      "1366 : média desktop aux angles droits",
    ).toBeGreaterThan(0);

    await expectNoDocumentOverflow(page, "1366");
  });
});
