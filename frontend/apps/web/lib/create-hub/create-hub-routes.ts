/**
 * Visibilité Create Hub — CREATORS-UX-02A, révisé C3-CITIZEN-MEDIUM-SHELL-R1E.
 *
 * Règle (CREATORS-ARCH-01) : toute nouvelle page de création doit être
 * déclarée ici (préfixe exact ou helper dédié). Ne pas dupliquer des
 * pathname === "…" dans les composants UI.
 *
 * ── Pourquoi la route ne suffit plus ─────────────────────────────────────────
 * `/videos` était masqué au motif que son CTA « Publier une vidéo » remplaçait
 * le hub. Depuis que le rail citoyen medium porte « Créer » comme l'un de ses
 * neuf contrôles globaux, ce masquage l'ampute sur cette seule route. Mais le
 * lever partout ferait réapparaître un FAB mobile et un bouton desktop que le
 * portail n'a jamais eus.
 *
 * La décision dépend donc de DEUX faits : le `pathname` ET la `surface` qui
 * pose le déclencheur. Contrat PUR : aucun DOM, aucun `window`, aucune largeur.
 * La surface est déclarée par le site de montage, jamais déduite.
 */

/** Surfaces qui posent un déclencheur Create Hub. */
export type CreateHubSurface = "default" | "citizen-medium-rail";

/**
 * Toutes les surfaces connues. Sert à dériver la disponibilité d'une route sans
 * recopier la liste — le provider ne rend qu'un dialogue pour toutes.
 */
export const CREATE_HUB_SURFACES: readonly CreateHubSurface[] = ["default", "citizen-medium-rail"];

/**
 * Routes où le Create Hub est masqué sur TOUTES les surfaces : écran de
 * création en cours, ou authentification.
 */
export const CREATE_HUB_HIDDEN_PATH_PREFIXES: readonly string[] = [
  "/login",
  "/register",
  "/videos/new",
  "/stories/new",
  "/discussions/new",
  "/feed/new",
  "/sortir/create",
];

/**
 * Routes réservées au rail citoyen medium : le contrôle global y existe, les
 * surfaces historiques (FAB mobile, top nav / sidebar desktop) restent gelées.
 * Comparaison EXACTE — `/videos-extra` n'est pas `/videos`, et les descendants
 * relèvent de leur propre règle (`/videos/new` est masqué partout).
 */
const CREATE_HUB_MEDIUM_RAIL_ONLY_PATHS: readonly string[] = ["/videos"];

/** Préfixes réservés — pages auth / onboarding sans chrome create. */
export const CREATE_HUB_HIDDEN_AUTH_PREFIXES: readonly string[] = ["/login", "/register"];

export function isCreateHubPartnerPortalPath(pathname: string): boolean {
  return pathname === "/organizations/me/partner" || pathname.startsWith("/organizations/me/partner/");
}

/** Retire query, hash et slash final (sauf la racine). */
function normalize(pathname: string): string {
  const sansQuery = pathname.split("?")[0]?.split("#")[0] ?? "";
  const nettoye = sansQuery.trim();
  if (nettoye.length > 1 && nettoye.endsWith("/")) return nettoye.slice(0, -1);
  return nettoye || "/";
}

/**
 * Le Create Hub doit-il être rendu par cette surface, sur cette route ?
 *
 * `surface` par défaut = `"default"` : tous les appels historiques gardent
 * exactement leur comportement.
 */
export function resolveCreateHubVisibility({
  pathname,
  surface = "default",
}: {
  pathname: string;
  surface?: CreateHubSurface;
}): boolean {
  const normalized = normalize(pathname);

  if (CREATE_HUB_HIDDEN_PATH_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix))) {
    return false;
  }

  if (isCreateHubPartnerPortalPath(normalized)) {
    return false;
  }

  if (CREATE_HUB_MEDIUM_RAIL_ONLY_PATHS.includes(normalized)) {
    return surface === "citizen-medium-rail";
  }

  return true;
}

/** Politique historique — surface par défaut. */
export function isCreateHubVisiblePath(pathname: string): boolean {
  return resolveCreateHubVisibility({ pathname });
}

/**
 * Le hub est-il atteignable depuis AU MOINS une surface de cette route ?
 *
 * Le provider ne monte qu'un dialogue partagé : s'il se fiait à la surface par
 * défaut, le bouton du rail ouvrirait le vide sur `/videos`.
 */
export function isCreateHubAvailableOnRoute(pathname: string): boolean {
  return CREATE_HUB_SURFACES.some((surface) => resolveCreateHubVisibility({ pathname, surface }));
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
