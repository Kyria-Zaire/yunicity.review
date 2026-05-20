/**
 * Configuration canonique du shell web citoyen Yunicity.
 * Étendre ici la navigation et les largeurs lors de nouvelles surfaces
 * (feed, événements, messagerie, cartes, creators, communautés).
 */

export type WebNavMatch = "prefix" | "exact";

export type WebNavItem = {
  href: string;
  label: string;
  match?: WebNavMatch;
};

/** Navigation principale — zone authentifiée citoyenne. */
export const WEB_CITIZEN_NAV: WebNavItem[] = [
  { href: "/feed", label: "Fil local", match: "prefix" },
  { href: "/events", label: "Événements", match: "prefix" },
  { href: "/neighborhoods", label: "Quartiers", match: "prefix" },
  { href: "/tribes", label: "Tribus", match: "prefix" },
  { href: "/notifications", label: "Notifications", match: "prefix" },
  { href: "/passport", label: "Passport", match: "prefix" },
  { href: "/profile/me", label: "Profil", match: "prefix" },
  { href: "/organizations/me", label: "Lieux", match: "prefix" },
  { href: "/organizations/request", label: "Proposer un lieu", match: "prefix" },
];

/** Largeurs de colonne contenu — éviter lignes et formulaires trop larges. */
export type WebContentWidth = "form" | "readable" | "feed" | "wide" | "full";

export const WEB_CONTENT_WIDTH_CLASS: Record<WebContentWidth, string> = {
  /** Formulaires, onboarding org — ~576px */
  form: "max-w-xl w-full",
  /** Profil, paramètres, texte — ~672px */
  readable: "max-w-2xl w-full",
  /** Fil social, listes d’activité — même lisibilité que readable */
  feed: "max-w-2xl w-full",
  /** Listes événements, grilles cartes légères — ~768px */
  wide: "max-w-3xl w-full",
  /** Utilise la colonne grille (max ~720px avec contexte) sans resserrement */
  full: "w-full min-w-0",
};

export function isWebNavActive(pathname: string, item: WebNavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
