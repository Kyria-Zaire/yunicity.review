import { expect, type Page } from "@playwright/test";

import { COLD_START_TIMEOUT } from "./cold-start";

/**
 * Contrat partagé « surface modale mobile vs bottom-nav » (C3.1-R1E).
 *
 * Source unique consommée par `13-mobile-safari-closure` et `20-modal-overlay-bottom-nav`,
 * pour que le contrat produit soit énoncé une seule fois.
 *
 * ── Pourquoi ce module existe ────────────────────────────────────────────────
 * L'ancien helper de la spec 13 cliquait aux coordonnées du centre d'une destination
 * de bottom-nav et exigeait que la route ne change pas. Ce geste ne teste PAS ce qu'il
 * prétend : sous 640 px, Explorer et Menu sont des `Drawer` (`inset-x-0 bottom-0`,
 * `max-h-[85dvh]`) dont le PANNEAU recouvre précisément la zone de la bottom-nav.
 * Le clic atterrissait donc sur le contenu du tiroir lui-même (mesuré : le lien
 * « Discussions » du Menu à 639 px, le champ de recherche d'Explorer à 390 px), et la
 * navigation observée était un comportement légitime du tiroir — pas une fuite de clic
 * vers la bottom-nav.
 *
 * Le contrat réel est : la bottom-nav ne doit JAMAIS recevoir le geste. Il se prouve par
 *   1. `elementFromPoint()` sur chaque destination — la cible n'est jamais dans la nav ;
 *   2. un compteur de clics posé en capture SUR la bottom-nav — il reste à zéro même
 *      après un vrai clic pointeur à ses coordonnées ;
 *   3. la route n'est jamais devenue une destination de bottom-nav.
 */

export const MODAL_SURFACES = [
  { id: "explorer", label: "Explorer Reims" },
  { id: "menu", label: "Menu Yunicity" },
  { id: "create", label: "Créer" },
] as const;

export type ModalSurfaceId = (typeof MODAL_SURFACES)[number]["id"];

/** Destinations de la bottom-nav mobile — cf. `WEB_CITIZEN_DESTINATIONS`. */
export const BOTTOM_NAV_HREFS = ["/feed", "/videos", "/map", "/sortir"] as const;

export const BOTTOM_NAV_SELECTOR = ".web-mobile-strategic-bottom-nav";

const OVERLAY_READY_SELECTOR = '[data-yunicity-overlay][data-yunicity-overlay-state="entered"]';

export type NavTargetProbe = {
  target: string;
  center: { x: number; y: number };
  hitTag: string | null;
  hitIsInsideNav: boolean;
  hitIsBackdrop: boolean;
  hitIsInsidePanel: boolean;
  hitLinkHref: string | null;
};

export type ModalLayerState = {
  overlayZ: number;
  navZ: number;
  backdropCoversViewport: boolean;
  panelAboveBackdrop: boolean;
  navInsideInert: boolean;
  navAriaHidden: boolean;
  appNeutralized: boolean;
  bodyOverflow: string;
  dialogCount: number;
  overlayContainerCount: number;
  populatedPortalCount: number;
  navTargets: NavTargetProbe[];
};

/**
 * Ouvre une surface modale et attend sa READINESS PRODUIT.
 *
 * `toBeVisible()` seul ne suffit pas : il est satisfait dès la première frame, alors que
 * le panneau translate encore (mesuré : panneau Menu à `bottom: 1377` pour un viewport de
 * 852 px, soit 90 % de la course restant à parcourir). Toute mesure ou tout clic pris à cet
 * instant dépend de la frame d'animation — c'est la source de non-déterminisme observée.
 * `data-yunicity-overlay-state="entered"` est émis à la fin réelle de la transition
 * (C3.1-R1E) : ce n'est ni une pause, ni un retry.
 */
export async function openModalSurfaceReady(page: Page, label: string): Promise<void> {
  const trigger = page.getByRole("button", { name: label }).locator("visible=true").first();
  await expect(trigger, `déclencheur « ${label} » absent`).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
  await expect(trigger, `déclencheur « ${label} » désactivé`).toBeEnabled({
    timeout: COLD_START_TIMEOUT,
  });
  await trigger.click();
  await expect(page.getByRole("dialog").first(), `dialogue « ${label} » non ouvert`).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
  await expect(
    page.locator(OVERLAY_READY_SELECTOR),
    `surface « ${label} » toujours en transition d'entrée`,
  ).toHaveCount(1, { timeout: COLD_START_TIMEOUT });
}

/** Relevé complet des couches à un instant donné. Aucune assertion : uniquement des faits. */
export async function readModalLayerState(page: Page): Promise<ModalLayerState> {
  return page.evaluate((navSelector) => {
    const container = document.querySelector<HTMLElement>("[data-yunicity-overlay]");
    const backdrop = document.querySelector<HTMLElement>("[data-yunicity-overlay-backdrop]");
    const panel = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    const nav = document.querySelector<HTMLElement>(navSelector);

    const zOf = (el: HTMLElement | null): number =>
      el ? Number.parseFloat(window.getComputedStyle(el).zIndex) || 0 : 0;

    const backdropRect = backdrop?.getBoundingClientRect();
    const navTargets = Array.from(
      document.querySelectorAll<HTMLElement>(
        `${navSelector} a[href], ${navSelector} button`,
      ),
    ).map((el) => {
      const r = el.getBoundingClientRect();
      const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const hit = document.elementFromPoint(center.x, center.y);
      const hitLink = hit?.closest("a[href]") as HTMLAnchorElement | null;
      return {
        target: el.getAttribute("href") ?? el.getAttribute("aria-label") ?? el.nodeName,
        center,
        hitTag: hit?.nodeName ?? null,
        hitIsInsideNav: Boolean(nav && hit && nav.contains(hit)),
        hitIsBackdrop: hit === backdrop,
        hitIsInsidePanel: Boolean(panel && hit && panel.contains(hit)),
        hitLinkHref: hitLink?.getAttribute("href") ?? null,
      };
    });

    const appChildren = Array.from(document.body.children).filter(
      (child) => !child.hasAttribute("data-yunicity-overlay-root"),
    );

    return {
      overlayZ: zOf(container),
      navZ: zOf(nav),
      backdropCoversViewport: Boolean(
        backdropRect &&
          backdropRect.top <= 1 &&
          backdropRect.left <= 1 &&
          backdropRect.right >= window.innerWidth - 1 &&
          backdropRect.bottom >= window.innerHeight - 1,
      ),
      panelAboveBackdrop: Boolean(
        panel &&
          backdrop &&
          panel.compareDocumentPosition(backdrop) & Node.DOCUMENT_POSITION_PRECEDING,
      ),
      navInsideInert: Boolean(nav?.closest("[inert]")),
      navAriaHidden: Boolean(nav?.closest('[aria-hidden="true"]')),
      appNeutralized:
        appChildren.length > 0 &&
        appChildren.every(
          (child) => child.getAttribute("aria-hidden") === "true" && child.hasAttribute("inert"),
        ),
      bodyOverflow: document.body.style.overflow,
      dialogCount: document.querySelectorAll('[role="dialog"]').length,
      overlayContainerCount: document.querySelectorAll("[data-yunicity-overlay]").length,
      populatedPortalCount: Array.from(
        document.querySelectorAll("[data-yunicity-overlay-root]"),
      ).filter((root) => root.childElementCount > 0).length,
      navTargets,
    };
  }, BOTTOM_NAV_SELECTOR);
}

/** Contrat de couches : une seule surface, panel au-dessus du backdrop, arrière-plan neutralisé. */
export async function assertModalLayering(page: Page, label: string): Promise<ModalLayerState> {
  const state = await readModalLayerState(page);

  expect(state.dialogCount, `${label} : plusieurs dialogues visibles`).toBe(1);
  expect(state.overlayContainerCount, `${label} : plusieurs conteneurs d'overlay`).toBe(1);
  expect(state.populatedPortalCount, `${label} : plusieurs portails peuplés`).toBe(1);
  expect(state.overlayZ, `${label} : couche modale sous le chrome`).toBeGreaterThan(state.navZ);
  expect(state.backdropCoversViewport, `${label} : backdrop ne couvre pas le viewport`).toBe(true);
  expect(state.panelAboveBackdrop, `${label} : panneau sous le backdrop`).toBe(true);
  expect(state.navInsideInert, `${label} : bottom-nav hors racine inerte`).toBe(true);
  expect(state.navAriaHidden, `${label} : bottom-nav non masquée aux AT`).toBe(true);
  expect(state.appNeutralized, `${label} : arrière-plan applicatif non neutralisé`).toBe(true);
  expect(state.bodyOverflow, `${label} : scroll non verrouillé`).toBe("hidden");

  return state;
}

/** Aucune destination de bottom-nav n'est atteignable par un pointeur. */
export function assertBottomNavUnreachable(state: ModalLayerState, label: string): void {
  expect(state.navTargets.length, `${label} : aucune cible de bottom-nav mesurée`).toBeGreaterThan(
    0,
  );
  for (const target of state.navTargets) {
    expect(
      target.hitIsInsideNav,
      `${label} : la cible ${target.target} est atteignable (elementFromPoint = ${target.hitTag})`,
    ).toBe(false);
  }
}

/** Compteur de clics posé EN CAPTURE sur la bottom-nav : zéro si elle est réellement neutralisée. */
export async function armBottomNavClickSentinel(page: Page): Promise<void> {
  await page.evaluate((navSelector) => {
    const store = window as unknown as { __yunicityNavClicks?: number };
    store.__yunicityNavClicks = 0;
    const nav = document.querySelector(navSelector);
    nav?.addEventListener(
      "click",
      () => {
        store.__yunicityNavClicks = (store.__yunicityNavClicks ?? 0) + 1;
      },
      true,
    );
  }, BOTTOM_NAV_SELECTOR);
}

export async function readBottomNavClicks(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as unknown as { __yunicityNavClicks?: number }).__yunicityNavClicks ?? 0,
  );
}

function pathOf(url: string): string {
  return new URL(url).pathname;
}

/**
 * Attend que le routage soit stable (deux lectures consécutives identiques).
 *
 * Une navigation déclenchée par un clic côté client n'est pas encore visible sur
 * `page.url()` au retour de `mouse.click`. Naviguer immédiatement ensuite provoque
 * « Navigation to X is interrupted by another navigation to Y ». Cette attente porte
 * sur un état réel de l'application, pas sur une durée arbitraire.
 */
export async function settleRoute(page: Page): Promise<void> {
  let previous: string | null = null;
  let stableReads = 0;
  await expect
    .poll(
      async () => {
        const current = await page.evaluate(() => window.location.pathname);
        stableReads = current === previous ? stableReads + 1 : 0;
        previous = current;
        return stableReads;
      },
      { timeout: COLD_START_TIMEOUT },
    )
    .toBeGreaterThanOrEqual(2);
}

/**
 * Vrai geste pointeur aux coordonnées d'une destination de bottom-nav, overlay ouvert.
 *
 * Aucun `force`, aucun `.click()` sur élément masqué : un seul `mouse.click` aux
 * coordonnées relevées.
 *
 * Preuve principale — le compteur pose en CAPTURE sur la bottom-nav : si le geste
 * l'atteignait, un évènement `click` y remonterait. Il est synchrone et conclusif au
 * retour de `mouse.click`, contrairement à `page.url()` qui ne reflète pas encore une
 * navigation cliente Next au même instant (source d'une branche instable écartée ici).
 *
 * L'appelant repart TOUJOURS d'un état rechargé ensuite : le geste peut légitimement
 * avoir fermé la surface (backdrop) ou activé le contenu propre d'un tiroir.
 */
export async function assertPointerOnBottomNavIsAbsorbed(
  page: Page,
  state: ModalLayerState,
  label: string,
): Promise<void> {
  // Choix du point de mesure — toujours aux coordonnées d'une destination de
  // bottom-nav, jamais ailleurs. On préfère, dans l'ordre :
  //   1. un point où le backdrop est au premier plan (exerce en plus le contrat
  //      « le clic backdrop ferme sans jamais traverser ») ;
  //   2. un point du panneau qui ne porte pas de lien interne — le geste n'a alors
  //      aucun effet de bord, ce qui rend la suite du scénario déterministe ;
  //   3. à défaut, la destination /map.
  // Le contrat vérifié est identique dans les trois cas : la bottom-nav ne reçoit
  // aucun clic. Seul l'effet de bord sur la surface change.
  const probe =
    state.navTargets.find((t) => t.hitIsBackdrop) ??
    state.navTargets.find((t) => !t.hitLinkHref) ??
    state.navTargets.find((t) => t.target === "/map") ??
    state.navTargets[0];
  expect(probe, `${label} : destination de bottom-nav introuvable`).toBeTruthy();
  const resolved = probe as NavTargetProbe;

  await armBottomNavClickSentinel(page);
  const before = pathOf(page.url());

  await page.mouse.click(resolved.center.x, resolved.center.y);

  const navClicks = await readBottomNavClicks(page);
  expect(
    navClicks,
    `${label} : la bottom-nav a reçu ${navClicks} clic(s) derrière la surface modale`,
  ).toBe(0);

  // Si le point retenu portait un lien interne de la surface, sa navigation est un
  // FAIT CONNU d'avance : on l'attend explicitement. Inférer « rien ne navigue »
  // d'une URL encore inchangée est structurellement racy — c'est ce qui faisait
  // ensuite échouer `page.goto` avec « interrupted by another navigation ».
  if (resolved.hitLinkHref && resolved.hitLinkHref.startsWith("/")) {
    await page.waitForURL(
      (url) => url.pathname === resolved.hitLinkHref,
      { timeout: COLD_START_TIMEOUT },
    );
  }
  await settleRoute(page);

  const after = pathOf(page.url());
  if (after !== before) {
    expect(
      BOTTOM_NAV_HREFS as readonly string[],
      `${label} : navigation vers la destination de bottom-nav ${after}`,
    ).not.toContain(after);
  }

  // Quand le point relevé tombe sur le backdrop (Dialog centré), le contrat exige la
  // fermeture — sans jamais traverser vers un lien situé derrière.
  if (resolved.hitIsBackdrop) {
    await expect(
      page.getByRole("dialog"),
      `${label} : le clic backdrop n'a pas fermé la surface`,
    ).toHaveCount(0, { timeout: COLD_START_TIMEOUT });
  }
}

/** Après fermeture : aucun résidu de portail, d'inertie ou de verrou de scroll. */
export async function assertNoOverlayResidue(page: Page, label: string): Promise<void> {
  await expect(page.getByRole("dialog"), `${label} : dialogue résiduel`).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
  const residue = await page.evaluate(() => ({
    populatedPortals: Array.from(
      document.querySelectorAll("[data-yunicity-overlay-root]"),
    ).filter((root) => root.childElementCount > 0).length,
    backdrops: document.querySelectorAll("[data-yunicity-overlay-backdrop]").length,
    overlayStates: document.querySelectorAll("[data-yunicity-overlay-state]").length,
    inert: document.querySelectorAll("[inert]").length,
    bodyOverflow: document.body.style.overflow,
  }));
  expect(residue.populatedPortals, `${label} : portail peuplé résiduel`).toBe(0);
  expect(residue.backdrops, `${label} : backdrop résiduel`).toBe(0);
  expect(residue.overlayStates, `${label} : phase d'overlay résiduelle`).toBe(0);
  expect(residue.inert, `${label} : attribut inert résiduel`).toBe(0);
  expect(residue.bodyOverflow, `${label} : verrou de scroll résiduel`).not.toBe("hidden");
}

/** Après fermeture, la bottom-nav redevient réellement interactive (un seul clic suffit). */
export async function assertBottomNavInteractiveAgain(page: Page, label: string): Promise<void> {
  const probe = await page.evaluate((navSelector) => {
    const link = document.querySelector<HTMLElement>(`${navSelector} a[href="/map"]`);
    if (!link) return null;
    const r = link.getBoundingClientRect();
    const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const hit = document.elementFromPoint(center.x, center.y);
    return {
      center,
      hitIsTheLink: Boolean(hit && link.contains(hit)),
      insideInert: Boolean(link.closest("[inert]")),
    };
  }, BOTTOM_NAV_SELECTOR);

  expect(probe, `${label} : destination /map absente après fermeture`).not.toBeNull();
  const resolved = probe as NonNullable<typeof probe>;
  expect(resolved.insideInert, `${label} : bottom-nav encore inerte après fermeture`).toBe(false);
  expect(resolved.hitIsTheLink, `${label} : destination /map encore masquée après fermeture`).toBe(
    true,
  );

  await page.mouse.click(resolved.center.x, resolved.center.y);
  await expect(page, `${label} : un clic unique ne navigue pas vers /map`).toHaveURL(/\/map/, {
    timeout: COLD_START_TIMEOUT,
  });
}
