/**
 * Visibilité Create Hub par route — CREATORS-UX-02A.
 *
 * Règle (CREATORS-ARCH-01) : toute nouvelle page de création doit être
 * déclarée ici (préfixe exact ou helper dédié). Ne pas dupliquer des
 * pathname === "…" dans les composants UI.
 */

/** Routes où le FAB / triggers Create Hub sont masqués (écran création en cours). */
export const CREATE_HUB_HIDDEN_PATH_PREFIXES: readonly string[] = [
  "/login",
  "/register",
  /** Portail Vidéos : CTA dédié « Publier une vidéo » remplace le hub Créer. */
  "/videos",
  "/stories/new",
];

/** Préfixes réservés — pages auth / onboarding sans chrome create. */
export const CREATE_HUB_HIDDEN_AUTH_PREFIXES: readonly string[] = ["/login", "/register"];

export function isCreateHubPartnerPortalPath(pathname: string): boolean {
  return pathname === "/organizations/me/partner" || pathname.startsWith("/organizations/me/partner/");
}

export function isCreateHubVisiblePath(pathname: string): boolean {
  const normalized = pathname.trim() || "/";

  if (CREATE_HUB_HIDDEN_PATH_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix))) {
    return false;
  }

  if (isCreateHubPartnerPortalPath(normalized)) {
    return false;
  }

  return true;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
