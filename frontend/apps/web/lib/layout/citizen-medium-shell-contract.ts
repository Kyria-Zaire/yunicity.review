import type { CitizenMediumRailDestination } from "@/lib/layout/citizen-medium-rail-contract";

/**
 * Éligibilité d'une route au rail citoyen medium (C3-CITIZEN-MEDIUM-SHELL-R1A).
 *
 * ── Pourquoi cette source unique ─────────────────────────────────────────────
 * Le rail était monté par `FeedAppShell` seul. Le dépôt ne possède ni route
 * group Next ni layout citoyen commun : huit shells indépendants montent chacun
 * `WebSidebar` au même emplacement de grille. `WebSidebar` est donc le seul
 * point de convergence réel, et devient le propriétaire unique du rail.
 *
 * Mais `WebSidebar` est aussi monté par des familles NON citoyennes
 * (organisations, back-office partenaire). « `WebSidebar` présent = route
 * citoyenne » serait donc faux : la politique doit être explicite.
 *
 * ── Contrat ──────────────────────────────────────────────────────────────────
 * Fonction PURE : aucun DOM, aucun `window`, aucun React, aucun breakpoint.
 * Politique FAIL-SAFE : une route inconnue n'affiche pas le rail. Mieux vaut un
 * rail manquant sur une route non inventoriée qu'un rail citoyen surgissant
 * dans le back-office partenaire.
 */

/**
 * Parcours de création en cours (C3-CITIZEN-MEDIUM-SHELL-R1E).
 *
 * Vérifiés AVANT toute inclusion : `/videos/new` et `/feed/new` descendent de
 * familles porteuses d'une destination principale, `/stories/new` d'une famille
 * secondaire. Sans cette priorité, le préfixe général l'emporterait.
 *
 * Motif : sur ces écrans le Create Hub est masqué sur toutes les surfaces
 * (`create-hub-routes`). Un rail qui annonce neuf contrôles y apparaîtrait
 * structurellement amputé de son action « Créer ». Il n'y apparaît donc pas.
 *
 * ⚠️ EXCEPTION `/feed/new` (FEED-NEW-UX-01, décision de Kyria du 2026-11-03) :
 * les deux planches validées montrent le rail medium AVEC « Créer », et la
 * décision n°10 exige le chrome réel. `/feed/new` redevient donc une route de
 * la famille `/feed` — rail présent, Create Hub visible (voir
 * `create-hub-routes`). La perte du brouillon est gardée par la confirmation
 * de sortie de l'écran (`lib/navigation/leave-guard`), pas par l'absence de
 * chrome. Les autres parcours de création gardent la règle R1E.
 */
const PREFIXES_PARCOURS_CREATION = [
  "/stories/new",
  "/videos/new",
  "/sortir/create",
  "/organizations/request",
] as const;

/** Exclusions — elles gagnent toujours sur les inclusions. */
const PREFIXES_EXCLUS = [
  "/login",
  "/register",
  "/legal",
  "/dev",
  "/organizations",
  "/creators",
  "/creator-content",
  "/protected",
] as const;

/** Familles citoyennes portant une destination principale du rail. */
const DESTINATIONS: ReadonlyArray<{
  prefixe: string;
  destination: CitizenMediumRailDestination;
}> = [
  { prefixe: "/feed", destination: "feed" },
  { prefixe: "/videos", destination: "videos" },
  { prefixe: "/map", destination: "map" },
  { prefixe: "/sortir", destination: "sortir" },
  { prefixe: "/events", destination: "sortir" },
];

/**
 * Familles citoyennes SECONDAIRES : le rail est présent, aucune destination
 * principale n'est active. `/events` appartient à Sortir (listing redirige,
 * le détail `/events/[id]` reste dans la famille).
 */
const PREFIXES_CITOYENS_SECONDAIRES = [
  "/search",
  "/stories",
  "/tribes",
  "/passport",
  "/subscriptions",
  "/discussions",
  "/notifications",
  "/profile",
  "/neighborhoods",
  "/places",
  "/settings",
  "/user",
] as const;

/** Trois états autoritaires — aucune liste parallèle en dehors de ce résolveur. */
export type CitizenMediumPresentation = "rail" | "creation-flow" | "legacy";

export type CitizenMediumRouteResolution = {
  presentation: CitizenMediumPresentation;
  activeDestination?: CitizenMediumRailDestination;
  /**
   * L'écran courant EST la création : le rail met « Créer » en avant, et
   * aucune destination principale n'est active.
   */
  createActive?: true;
};

/**
 * Écrans de création qui portent le rail (exception à R1E) — « Créer » y est
 * l'élément actif. FEED-NEW-UX-01 : « Accueil » ne doit pas paraître actif
 * sur `/feed/new` (décision de Kyria du 2026-11-04).
 */
const ROUTES_CREATION_AVEC_RAIL = ["/feed/new"] as const;

/** Normalise : retire query, hash et slash final (sauf la racine). */
function normaliser(pathname: string): string {
  const sansQuery = pathname.split("?")[0]!.split("#")[0]!;
  if (sansQuery.length > 1 && sansQuery.endsWith("/")) return sansQuery.slice(0, -1);
  return sansQuery || "/";
}

/** La route appartient-elle à cette famille — exactement, ou par descendance ? */
function dansLaFamille(route: string, prefixe: string): boolean {
  return route === prefixe || route.startsWith(`${prefixe}/`);
}

/**
 * L'écran courant est-il une création qui porte le chrome (`/feed/new`) ?
 *
 * Source UNIQUE de l'état actif « Créer » : le rail medium et la barre basse
 * mobile la consultent tous deux, pour qu'aucune destination (Accueil) n'y
 * paraisse active pendant qu'on rédige.
 */
export function isCreationRouteWithChrome(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const route = normaliser(pathname);
  return ROUTES_CREATION_AVEC_RAIL.some((prefixe) => dansLaFamille(route, prefixe));
}

export function resolveCitizenMediumRoute(
  pathname: string | null | undefined,
): CitizenMediumRouteResolution {
  if (!pathname) return { presentation: "legacy" };
  const route = normaliser(pathname);

  if (isCreationRouteWithChrome(route)) {
    return { presentation: "rail", createActive: true };
  }

  // Un parcours de création prime sur sa famille d'origine.
  if (PREFIXES_PARCOURS_CREATION.some((prefixe) => dansLaFamille(route, prefixe))) {
    return { presentation: "creation-flow" };
  }

  // Les exclusions priment : le back-office partenaire monte lui aussi
  // `WebSidebar`, il ne doit jamais hériter du rail citoyen.
  if (PREFIXES_EXCLUS.some((prefixe) => dansLaFamille(route, prefixe))) {
    return { presentation: "legacy" };
  }

  const principale = DESTINATIONS.find(({ prefixe }) => dansLaFamille(route, prefixe));
  if (principale) {
    return { presentation: "rail", activeDestination: principale.destination };
  }

  if (PREFIXES_CITOYENS_SECONDAIRES.some((prefixe) => dansLaFamille(route, prefixe))) {
    return { presentation: "rail" };
  }

  // Fail-safe : famille non prouvée, comportement historique.
  return { presentation: "legacy" };
}
