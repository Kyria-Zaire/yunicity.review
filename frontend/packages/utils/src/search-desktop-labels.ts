/** Recherche desktop — micro-copy (SEARCH-DESKTOP-01). */

import type { SearchGroupKey, SearchTypeFilter } from "@yunicity/types";

export const SEARCH_DESKTOP_BACK = "Recherche globale";
export const SEARCH_DESKTOP_TITLE = (city: string) => `Rechercher dans ${city}`;
export const SEARCH_DESKTOP_SUBTITLE =
  "Retrouvez les sorties, publications et acteurs de votre ville.";
export const SEARCH_DESKTOP_CITY_BADGE = (city: string) => city;
export const SEARCH_DESKTOP_SEARCH_LABEL = "Rechercher";
export const SEARCH_DESKTOP_CLEAR_ARIA = "Effacer la recherche";
export const SEARCH_DESKTOP_RESULTS_FOR = (query: string) => `Résultats pour « ${query} »`;

export const SEARCH_DESKTOP_FILTERS_TITLE = "Affiner la recherche";
export const SEARCH_DESKTOP_FILTER_CITY = "Ville";
export const SEARCH_DESKTOP_FILTER_NEIGHBORHOOD = "Quartier";
export const SEARCH_DESKTOP_FILTER_NEIGHBORHOOD_ALL = "Tous les quartiers";
export const SEARCH_DESKTOP_FILTER_PERIOD = "Période";
export const SEARCH_DESKTOP_FILTER_PERIOD_ALL = "Toutes les dates";
export const SEARCH_DESKTOP_FILTER_PERIOD_TODAY = "Aujourd'hui";
export const SEARCH_DESKTOP_FILTER_PERIOD_WEEK = "Cette semaine";
export const SEARCH_DESKTOP_FILTER_PERIOD_MONTH = "Ce mois-ci";
export const SEARCH_DESKTOP_FILTER_CONTENT_TYPES = "Type de contenu";
export const SEARCH_DESKTOP_APPLY_FILTERS = "Appliquer les filtres";
export const SEARCH_DESKTOP_RESET_FILTERS = "Réinitialiser";

export const SEARCH_DESKTOP_RECENT_TITLE = "Recherches récentes";
export const SEARCH_DESKTOP_RECENT_SUBTITLE =
  "Enregistrées sur cet appareil, non visibles publiquement.";
export const SEARCH_DESKTOP_RECENT_EMPTY = "Aucune recherche récente";
export const SEARCH_DESKTOP_RECENT_CLEAR = "Effacer l'historique";
export const SEARCH_DESKTOP_RECENT_REMOVE_ARIA = (query: string) =>
  `Retirer « ${query} » de l'historique`;

export const SEARCH_DESKTOP_VIEW_ALL = {
  events: "Voir toutes les sorties",
  tribes: "Voir toutes les tribus",
  posts: "Voir toutes les publications",
  organizations: "Voir toutes les organisations",
  offers: "Voir toutes les offres",
  users: "Voir tous les citoyens",
  neighborhoods: "Voir tous les quartiers",
} as const satisfies Record<SearchGroupKey, string>;

export const SEARCH_DESKTOP_GROUP_LABELS: Record<SearchGroupKey, string> = {
  events: "Sorties",
  posts: "Publications",
  organizations: "Organisations",
  offers: "Offres",
  tribes: "Tribus",
  users: "Citoyens",
  neighborhoods: "Quartiers",
};

export const SEARCH_DESKTOP_OTHER_RESULTS = "Autres résultats";

export const SEARCH_DESKTOP_EMPTY_HINT_TITLE = "Lancez une recherche";
export const SEARCH_DESKTOP_EMPTY_HINT_BODY =
  "Saisissez au moins deux caractères pour trouver des sorties, publications, organisations et plus.";

export const SEARCH_MEDIUM_TITLE = "Recherche";
export const SEARCH_MEDIUM_SUBTITLE = (city: string) => `Dans ${city}`;
export const SEARCH_MEDIUM_FILTERS_TITLE = "Affiner la recherche";

export const SEARCH_DESKTOP_EVENT_CTA = "Voir la sortie";
export const SEARCH_DESKTOP_TRIBE_CTA = "Voir la tribu";
export const SEARCH_DESKTOP_ORG_CTA = "Voir le profil";
export const SEARCH_DESKTOP_ORG_KIND = "Organisation";

export const SEARCH_DESKTOP_TYPE_TABS: ReadonlyArray<{
  value: SearchTypeFilter;
  label: string;
}> = [
  { value: "all", label: "Tout" },
  { value: "event", label: "Sorties" },
  { value: "post", label: "Publications" },
  { value: "organization", label: "Organisations" },
  { value: "offer", label: "Offres" },
  { value: "tribe", label: "Tribus" },
  { value: "user", label: "Citoyens" },
  { value: "neighborhood", label: "Quartiers" },
];

export type SearchDesktopPeriodPreset = "all" | "today" | "week" | "month";

export const SEARCH_DESKTOP_PERIOD_PRESETS: ReadonlyArray<{
  id: SearchDesktopPeriodPreset;
  label: string;
}> = [
  { id: "all", label: SEARCH_DESKTOP_FILTER_PERIOD_ALL },
  { id: "today", label: SEARCH_DESKTOP_FILTER_PERIOD_TODAY },
  { id: "week", label: SEARCH_DESKTOP_FILTER_PERIOD_WEEK },
  { id: "month", label: SEARCH_DESKTOP_FILTER_PERIOD_MONTH },
];

export type SearchDesktopContentTypeId = Exclude<SearchTypeFilter, "all">;

export const SEARCH_DESKTOP_CONTENT_TYPES: ReadonlyArray<{
  id: SearchDesktopContentTypeId;
  label: string;
  groupKey: SearchGroupKey;
}> = [
  { id: "event", label: "Sorties", groupKey: "events" },
  { id: "post", label: "Publications", groupKey: "posts" },
  { id: "organization", label: "Organisations", groupKey: "organizations" },
  { id: "offer", label: "Offres", groupKey: "offers" },
  { id: "tribe", label: "Tribus", groupKey: "tribes" },
  { id: "user", label: "Citoyens", groupKey: "users" },
  { id: "neighborhood", label: "Quartiers", groupKey: "neighborhoods" },
];
