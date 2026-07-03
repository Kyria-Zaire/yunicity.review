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

/** Entrées compte — menu profil (sidebar / top nav), pas la nav principale. */
export const WEB_CITIZEN_ACCOUNT_MENU: WebNavItem[] = [
  { href: "/profile/me", label: "Profil", icon: "profile", match: "prefix" },
  { href: "/settings", label: "Paramètres", icon: "settings", match: "prefix" },
  { href: "/passport", label: "Passport", icon: "passport", match: "prefix" },
];

const WEB_CITIZEN_ACCOUNT_MENU_HREFS = new Set(
  WEB_CITIZEN_ACCOUNT_MENU.map((item) => item.href),
);

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

/** 4 onglets stratégiques — sidebar + top nav centre. */
export const WEB_CITIZEN_SIDEBAR_STRATEGIC: WebNavItem[] = [
  { href: "/feed", label: "Fil local", icon: "feed", match: "prefix", tier: "primary" },
  { href: "/map", label: "Carte", icon: "map", match: "prefix", tier: "primary" },
  { href: "/sortir", label: "Sortir", icon: "sortir", match: "prefix", tier: "primary" },
  { href: "/videos", label: "Vidéos", icon: "videos", match: "prefix", tier: "primary" },
];

/** Menu Yunicity (grille) — exploration et contribution. */
export const WEB_CITIZEN_YUNICITY_MENU: WebNavItem[] = [
  { href: "/search", label: "Recherche", icon: "search", match: "prefix", tier: "secondary" },
  { href: "/neighborhoods", label: "Quartiers", icon: "neighborhoods", match: "prefix", tier: "secondary" },
  { href: "/tribes", label: "Tribus", icon: "tribes", match: "prefix", tier: "secondary" },
  { href: "/places", label: "Lieux", icon: "place", match: "prefix", tier: "secondary" },
  {
    href: "/organizations/request",
    label: "Proposer un lieu",
    icon: "proposePlace",
    match: "prefix",
    tier: "secondary",
  },
];

export const YUNICITY_MENU_LABEL = "Menu Yunicity";

export const WEB_CITIZEN_NOTIFICATIONS_NAV: WebNavItem = {
  href: "/notifications",
  label: "Notifications",
  icon: "notifications",
  match: "prefix",
  tier: "primary",
};

/** Onglets centraux — barre haute xl (`CitizenTopNav`). */
export const WEB_CITIZEN_TOP_NAV_CENTER: WebNavItem[] = WEB_CITIZEN_SIDEBAR_STRATEGIC;

/** Droite top nav xl — notifications uniquement (Menu Yunicity = composant dédié). */
export const WEB_CITIZEN_TOP_NAV_UTILITY: WebNavItem[] = [WEB_CITIZEN_NOTIFICATIONS_NAV];

/** Alias legacy — même périmètre que les 4 onglets stratégiques. */
export const WEB_CITIZEN_SIDEBAR_PRIMARY = WEB_CITIZEN_SIDEBAR_STRATEGIC;

/** Alias legacy — entrées du menu grille Yunicity. */
export const WEB_CITIZEN_SIDEBAR_SECONDARY = WEB_CITIZEN_YUNICITY_MENU;

/**
 * Liste plate legacy (mobile chrome, tests) — stratégique + menu Yunicity + notifications.
 * La sidebar web utilise les constantes dédiées + `CitizenYunicityMenu`.
 */
export const WEB_CITIZEN_SIDEBAR_NAV: WebNavItem[] = [
  ...WEB_CITIZEN_SIDEBAR_STRATEGIC,
  ...WEB_CITIZEN_YUNICITY_MENU,
  WEB_CITIZEN_NOTIFICATIONS_NAV,
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

export function isYunicityMenuActive(pathname: string): boolean {
  return WEB_CITIZEN_YUNICITY_MENU.some((item) => isWebNavActive(pathname, item));
}

export function isCitizenAccountMenuActive(pathname: string): boolean {
  return WEB_CITIZEN_ACCOUNT_MENU.some((item) => isWebNavActive(pathname, item));
}
