/** Neighborhoods mobile copy (MOBILE-QUARTIERS-01 + refonte hub). */

export const NEIGHBORHOODS_MOBILE_SEARCH_PLACEHOLDER =
  "Rechercher un quartier, une ambiance...";
export const NEIGHBORHOODS_MOBILE_FILTERS_ARIA = "Filtres avancés";
export const NEIGHBORHOODS_MOBILE_FILTERS_SOON = "Filtres avancés — bientôt disponible";

export const NEIGHBORHOODS_MOBILE_CATEGORY_ALL = "Tous";
export const NEIGHBORHOODS_MOBILE_CATEGORY_POPULAR = "Populaires";
export const NEIGHBORHOODS_MOBILE_CATEGORY_CULTURE = "Culture";
export const NEIGHBORHOODS_MOBILE_CATEGORY_SORTIR = "Sorties";
export const NEIGHBORHOODS_MOBILE_CATEGORY_FAMILY = "Famille";
export const NEIGHBORHOODS_MOBILE_CATEGORY_NATURE = "Nature";

export const NEIGHBORHOODS_MOBILE_MY_TITLE = "Mes quartiers";
export const NEIGHBORHOODS_MOBILE_MY_MANAGE = "Gérer";
export const NEIGHBORHOODS_MOBILE_MY_MANAGE_SOON = "Gérer mes quartiers — bientôt disponible";
export const NEIGHBORHOODS_MOBILE_BADGE_FAVORITE = "Favori";
export const NEIGHBORHOODS_MOBILE_BADGE_SUBSCRIBED = "Abonné";
export const NEIGHBORHOODS_MOBILE_FAVORITE_ARIA = "Ajouter aux favoris";
export const NEIGHBORHOODS_MOBILE_FAVORITE_SOON = "Favoris — bientôt disponible";

export const NEIGHBORHOODS_MOBILE_DISCOVER_TITLE = "Découvrir les quartiers";
export const NEIGHBORHOODS_MOBILE_DISCOVER_EXPLORE = "Explorer";
export const NEIGHBORHOODS_MOBILE_DISCOVER_STATS = (placesCount: number, eventsCount: number) =>
  `${placesCount} lieu${placesCount > 1 ? "x" : ""} • ${eventsCount} événement${eventsCount > 1 ? "s" : ""}`;

export const NEIGHBORHOODS_MOBILE_RECOMMENDED_TITLE = "Recommandé pour vous";
export const NEIGHBORHOODS_MOBILE_RECOMMENDED_VIEW_ALL = "Voir tout";

/** Hub mobile refonte (maquette <640). */
export const NEIGHBORHOODS_MOBILE_SUBTITLE =
  "Découvrez leur identité et ce qui s'y passe aujourd'hui.";
export const NEIGHBORHOODS_MOBILE_VIEW_ON_MAP = "Sur la carte";
export const NEIGHBORHOODS_MOBILE_DEFINE = "Définir";
export const NEIGHBORHOODS_MOBILE_YOUR_HOOD_HINT =
  "Retrouvez plus vite les informations qui vous concernent.";
export const NEIGHBORHOODS_MOBILE_MAP_BODY =
  "Repérez les quartiers et ce qui se trouve autour de vous.";
export const NEIGHBORHOODS_MOBILE_CONTRIBUTE_TITLE = "Contribuer";
export const NEIGHBORHOODS_MOBILE_CONTRIBUTE_CTA = "Proposer";
export const NEIGHBORHOODS_MOBILE_SEE_ALL_ARROW = (count: number) => `Voir les ${count}`;

export function formatNeighborhoodsMobileCardStats(
  placesCount: number,
  eventsCount: number,
): string {
  return NEIGHBORHOODS_MOBILE_DISCOVER_STATS(placesCount, eventsCount);
}
