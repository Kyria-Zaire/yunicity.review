/** Search UI micro-copy & helpers (FEATURE-B / TICKET-B.5). */

import type {
  SearchGroupKey,
  SearchGroups,
  SearchResultGroup,
  SearchResultItem,
  SearchTypeFilter,
} from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";
import { neighborhoodHref } from "./neighborhood-labels";
import { tribeHref } from "./tribe-labels";

export const SEARCH_PAGE_TITLE = "Explorer";
export const SEARCH_PAGE_SUBTITLE =
  "Votre porte d’entrée locale — moments, lieux, quartiers et tribus à Reims.";
export const SEARCH_PLACEHOLDER = "Rechercher à Reims…";
export const SEARCH_CITY_LABEL = "Ville";
export const SEARCH_LOADING = "Recherche en cours…";
export const SEARCH_ERROR = "Impossible d’effectuer la recherche.";
export const SEARCH_RETRY = "Réessayer";
export const SEARCH_LOAD_MORE = "Voir plus";
export const SEARCH_INITIAL_TITLE = "Explorez votre ville";
export const SEARCH_INITIAL_BODY =
  "Saisissez au moins deux caractères pour chercher un événement, un lieu, une publication ou un quartier.";
export const SEARCH_EMPTY_TITLE = "Aucun résultat";
export const SEARCH_EMPTY_BODY =
  "Essayez un autre mot ou élargissez le type de contenu.";
export const SEARCH_MIN_QUERY_HINT = "Minimum 2 caractères.";
export const SEARCH_RESULT_COUNT = (count: number): string =>
  count === 1 ? "1 résultat" : `${count} résultats`;

export const SEARCH_TYPE_TABS: ReadonlyArray<{ value: SearchTypeFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "post", label: "Moments" },
  { value: "event", label: "Événements" },
  { value: "organization", label: "Lieux" },
  { value: "neighborhood", label: "Quartiers" },
  { value: "tribe", label: "Tribus" },
  { value: "offer", label: "Passport" },
];

/** URL slugs for /search?tab=… (WEB-SEARCH-02C). */
export const SEARCH_TAB_SLUGS: Record<SearchTypeFilter, string> = {
  all: "tous",
  post: "moments",
  event: "evenements",
  organization: "lieux",
  neighborhood: "quartiers",
  tribe: "tribus",
  offer: "passport",
  user: "personnes",
};

const SEARCH_TAB_FROM_SLUG: Record<string, SearchTypeFilter> = Object.fromEntries(
  Object.entries(SEARCH_TAB_SLUGS).map(([filter, slug]) => [slug, filter as SearchTypeFilter]),
) as Record<string, SearchTypeFilter>;

export function searchTabFromUrlParam(value: string | null | undefined): SearchTypeFilter {
  if (!value?.trim()) return "all";
  return SEARCH_TAB_FROM_SLUG[value.trim().toLowerCase()] ?? "all";
}

/** Returns null for "all" — omit tab param from URL. */
export function searchTabToUrlParam(type: SearchTypeFilter): string | null {
  if (type === "all") return null;
  return SEARCH_TAB_SLUGS[type];
}

/** Tab-specific explorer section titles (empty-query mode). */
export const SEARCH_TAB_EXPLORER_TITLES: Record<SearchTypeFilter, string> = {
  all: "Explorer",
  post: "Moments à découvrir",
  event: "Événements à venir",
  organization: "Lieux culturels",
  neighborhood: "Quartiers",
  tribe: "Tribus locales",
  offer: "Avantages Passport",
  user: "Personnes",
};

export const SEARCH_TAB_EXPLORER_SUBTITLES: Partial<Record<SearchTypeFilter, string>> = {
  post: "Sélection éditoriale — ce qui anime la ville cette semaine.",
  event: "Liste des prochains rendez-vous locaux.",
  organization: "Patrimoine et lieux culturels à explorer.",
  neighborhood: "Ambiances et repères par quartier.",
  tribe: "Communautés ouvertes autour de vos passions.",
  offer: "Offres actives réservées aux détenteurs du Passport.",
};

export const SEARCH_TAB_EMPTY_MESSAGES: Partial<Record<SearchTypeFilter, string>> = {
  all: "Aucune tendance locale pour le moment.",
  post: "Les premiers moments apparaîtront ici.",
  event: "Aucun événement annoncé pour le moment.",
  organization: "Les lieux culturels arrivent progressivement.",
  neighborhood: "Les quartiers arrivent progressivement.",
  tribe: "Les tribus de votre ville apparaîtront ici.",
  offer: "Aucune offre Passport active pour le moment.",
};

export const SEARCH_TRENDS_EMPTY = "Aucune tendance locale pour le moment.";

/** WEB-SEARCH-01 — Local Explorer sections */
export const SEARCH_EXPLORER_HERO_TITLE = "À découvrir aujourd’hui";
export const SEARCH_EXPLORER_HERO_CTA_EVENT = "Voir l’événement";
export const SEARCH_EXPLORER_HERO_CTA_PLACE = "Voir sur la carte";
export const SEARCH_EXPLORER_TRENDS_TITLE = "Tendances locales";
export const SEARCH_EXPLORER_TRENDS_SUBTITLE =
  "Repères calmes — pas de classement viral ni de compteurs agressifs.";
export const SEARCH_EXPLORER_CULTURE_TITLE = "Lieux culturels";
export const SEARCH_EXPLORER_CULTURE_BADGE = "Lieu culturel";
export const SEARCH_EXPLORER_CULTURE_CTA = "Carte";
export const SEARCH_EXPLORER_CULTURE_CTA_HINT = "Explorer";
export const SEARCH_EXPLORER_CULTURE_ROUTE = "Itinéraire";
export const SEARCH_EXPLORER_TRIBES_TITLE = "Tribus locales";
export const SEARCH_EXPLORER_TRIBES_EMPTY = "Les tribus de votre ville apparaîtront ici.";
export const SEARCH_EXPLORER_TRIBE_DISCOVER = "Découvrir";
export const SEARCH_EXPLORER_TRIBE_JOIN = "Rejoindre";
export const SEARCH_EXPLORER_VIEW_ALL_TRIBES = "Toutes les tribus";
export const SEARCH_EXPLORER_VIEW_ALL_CULTURE = "Tout voir";
export const SEARCH_EXPLORER_RESULTS_TITLE = "Résultats";
export const SEARCH_RAIL_TRANSIT_NOTE =
  "Horaires indicatifs autour du centre-ville — sans géolocalisation.";

export const SEARCH_GROUP_ORDER: readonly SearchGroupKey[] = [
  "events",
  "organizations",
  "neighborhoods",
  "offers",
  "posts",
  "tribes",
  "users",
] as const;

export const SEARCH_GROUP_LABELS: Record<SearchGroupKey, string> = {
  events: "Événements",
  organizations: "Lieux",
  posts: "Publications",
  offers: "Offres",
  tribes: "Tribus",
  users: "Personnes",
  neighborhoods: "Quartiers",
};

export function searchTypeToApiParam(type: SearchTypeFilter): string {
  if (type === "organization") return "org";
  if (type === "all") return "all";
  return type;
}

export function searchTypeFilterFromApi(
  value: string | null | undefined,
): SearchTypeFilter {
  if (!value || value === "all") return "all";
  if (value === "org") return "organization";
  const allowed: SearchTypeFilter[] = [
    "post",
    "event",
    "offer",
    "tribe",
    "user",
    "neighborhood",
  ];
  return allowed.includes(value as SearchTypeFilter) ? (value as SearchTypeFilter) : "all";
}

export function isSearchQueryReady(query: string): boolean {
  return query.trim().length >= 2;
}

export function isSearchInitialState(query: string, hasSearched: boolean): boolean {
  return !hasSearched || !isSearchQueryReady(query);
}

export function emptySearchGroups(): SearchGroups {
  const empty: SearchResultGroup = { items: [], count: 0, has_more: false };
  return {
    events: { ...empty },
    organizations: { ...empty },
    posts: { ...empty },
    offers: { ...empty },
    tribes: { ...empty },
    users: { ...empty },
    neighborhoods: { ...empty },
  };
}

export function searchResultTitle(item: SearchResultItem): string {
  return (item.title ?? item.name ?? item.username ?? "Sans titre").trim();
}

export function searchResultSubtitle(
  item: SearchResultItem,
  groupKey: SearchGroupKey,
  city: string,
): string {
  const parts: string[] = [];
  if (item.city) parts.push(item.city);
  else if (city) parts.push(city);
  if (groupKey === "events" && item.starts_at) {
    parts.push(formatEventDateRange(item.starts_at, null));
  }
  if (groupKey === "posts" && item.body) {
    const snippet = item.body.trim();
    parts.push(snippet.length > 120 ? `${snippet.slice(0, 117)}…` : snippet);
  }
  if (groupKey === "users" && item.username) {
    parts.push(`@${item.username}`);
  }
  if (groupKey === "offers" && item.is_flash) {
    parts.push("Offre flash");
  }
  if (groupKey === "organizations" && item.slug) {
    parts.push(item.slug);
  }
  return parts.filter(Boolean).join(" · ");
}

export type SearchHrefTarget = {
  web?: string;
  mobile?: string;
};

export function searchResultHref(
  item: SearchResultItem,
  groupKey: SearchGroupKey,
  city: string,
): SearchHrefTarget | null {
  switch (groupKey) {
    case "events":
      return { web: `/events/${item.id}`, mobile: `/(protected)/events/${item.id}` };
    case "posts":
      return null;
    case "organizations":
      return item.slug
        ? {
            web: `/map?place=${encodeURIComponent(item.slug)}&city=${encodeURIComponent(city)}`,
            mobile: "/(protected)/(tabs)/organizations",
          }
        : null;
    case "offers":
      return { web: "/passport", mobile: "/(protected)/(tabs)/passport" };
    case "tribes":
      return item.slug
        ? { web: tribeHref(item.slug, city), mobile: tribeHref(item.slug, city) }
        : null;
    case "users":
      return item.username
        ? { web: `/profile/${encodeURIComponent(item.username)}` }
        : null;
    case "neighborhoods":
      return item.slug
        ? {
            web: neighborhoodHref(item.slug, city),
            mobile: `/(protected)/neighborhoods/${item.slug}?city=${encodeURIComponent(city)}`,
          }
        : null;
    default:
      return null;
  }
}

export function visibleSearchGroups(
  groups: SearchGroups,
  typeFilter: SearchTypeFilter,
): Array<{ key: SearchGroupKey; group: SearchResultGroup }> {
  const entries = SEARCH_GROUP_ORDER.map((key) => ({ key, group: groups[key] }));
  if (typeFilter === "all") {
    return entries.filter(({ group }) => group.count > 0 || group.items.length > 0);
  }
  const map: Record<SearchTypeFilter, SearchGroupKey> = {
    all: "events",
    post: "posts",
    event: "events",
    organization: "organizations",
    offer: "offers",
    tribe: "tribes",
    user: "users",
    neighborhood: "neighborhoods",
  };
  const key = map[typeFilter];
  return [{ key, group: groups[key] }];
}
