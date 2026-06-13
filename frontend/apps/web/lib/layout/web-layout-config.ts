/**
 * Configuration canonique du shell web citoyen Yunicity.
 * WEB-HOME-01 : navigation primaire feed-first + entrées secondaires.
 */

export type WebNavMatch = "prefix" | "exact";

export type WebNavIconId =
  | "feed"
  | "videos"
  | "map"
  | "search"
  | "events"
  | "sortir"
  | "neighborhoods"
  | "tribes"
  | "passport"
  | "notifications"
  | "profile"
  | "settings"
  | "organizations"
  | "place"
  | "proposePlace"
  | "publish";

export type WebNavTier = "primary" | "secondary";

export type WebNavItem = {
  href: string;
  label: string;
  icon: WebNavIconId;
  match?: WebNavMatch;
  tier?: WebNavTier;
};

/** Navigation principale — ordre feed-first (WEB-HOME-01). */
export const WEB_CITIZEN_NAV_PRIMARY: WebNavItem[] = [
  { href: "/feed", label: "Fil local", icon: "feed", match: "prefix", tier: "primary" },
  { href: "/videos", label: "Vidéos", icon: "videos", match: "prefix", tier: "primary" },
  { href: "/map", label: "Carte", icon: "map", match: "prefix", tier: "primary" },
  { href: "/search", label: "Recherche", icon: "search", match: "prefix", tier: "primary" },
  { href: "/sortir", label: "Sortir", icon: "sortir", match: "prefix", tier: "primary" },
  { href: "/neighborhoods", label: "Quartiers", icon: "neighborhoods", match: "prefix", tier: "primary" },
  { href: "/tribes", label: "Tribus", icon: "tribes", match: "prefix", tier: "primary" },
  { href: "/passport", label: "Passport", icon: "passport", match: "prefix", tier: "primary" },
  { href: "/notifications", label: "Notifications", icon: "notifications", match: "prefix", tier: "primary" },
  { href: "/profile/me", label: "Profil", icon: "profile", match: "prefix", tier: "primary" },
];

/**
 * Onglets centraux — barre haute xl (`CitizenTopNav`).
 * Même périmètre que la sidebar primaire (hors compte / notifications).
 */
export const WEB_CITIZEN_TOP_NAV_CENTER: WebNavItem[] = WEB_CITIZEN_NAV_PRIMARY.filter(
  (item) => item.href !== "/notifications" && item.href !== "/profile/me",
);

/**
 * Liens texte à droite — barre haute xl (avant recherche et menu utilisateur).
 */
export const WEB_CITIZEN_TOP_NAV_UTILITY: WebNavItem[] = [
  { href: "/notifications", label: "Notifications", icon: "notifications", match: "prefix" },
  { href: "/profile/me", label: "Profil", icon: "profile", match: "prefix" },
  { href: "/places", label: "Lieux", icon: "place", match: "prefix" },
  {
    href: "/organizations/request",
    label: "Proposer un lieu",
    icon: "proposePlace",
    match: "prefix",
  },
  { href: "/settings", label: "Paramètres", icon: "settings", match: "prefix" },
];

/** Entrées occasionnelles — footer sidebar, pas la barre mobile compacte. */
export const WEB_CITIZEN_NAV_SECONDARY: WebNavItem[] = [
  { href: "/places", label: "Lieux", icon: "place", match: "prefix", tier: "secondary" },
  {
    href: "/organizations/request",
    label: "Proposer un lieu",
    icon: "proposePlace",
    match: "prefix",
    tier: "secondary",
  },
  { href: "/settings", label: "Paramètres", icon: "settings", match: "prefix", tier: "secondary" },
];

/** Liste complète — compat routes & mobile chrome legacy. */
export const WEB_CITIZEN_NAV: WebNavItem[] = [
  ...WEB_CITIZEN_NAV_PRIMARY,
  ...WEB_CITIZEN_NAV_SECONDARY,
];

/** Largeurs de colonne contenu */
export type WebContentWidth = "form" | "readable" | "feed" | "wide" | "full";

export const WEB_CONTENT_WIDTH_CLASS: Record<WebContentWidth, string> = {
  form: "max-w-xl w-full",
  readable: "max-w-2xl w-full",
  feed: "w-full min-w-0",
  wide: "max-w-3xl w-full",
  full: "w-full min-w-0",
};

export function isWebNavActive(pathname: string, item: WebNavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
