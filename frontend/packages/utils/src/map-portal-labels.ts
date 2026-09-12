/** Map portal micro-copy (WEB-MAP-02). */

export const MAP_PORTAL_TITLE = "Carte";
export const MAP_DESKTOP_EXPLORER_TITLE = "Explorer Reims";
export const MAP_PORTAL_CITY_LABEL = "Ville";

export const MAP_PORTAL_CATEGORY_ALL = "Tout";
export const MAP_PORTAL_CATEGORY_EVENTS = "Événements";
export const MAP_PORTAL_CATEGORY_PLACES = "Lieux";
export const MAP_PORTAL_CATEGORY_CULTURE = "Culture";
export const MAP_PORTAL_CATEGORY_NATURE = "Nature & balades";
export const MAP_PORTAL_CATEGORY_TRIBES = "Tribus";
export const MAP_PORTAL_CATEGORY_NEIGHBORHOODS = "Quartiers";
export const MAP_PORTAL_CATEGORY_TRANSIT = "Transports";
export const MAP_PORTAL_CATEGORY_PARTNERS = "Partenaires";
export const MAP_PORTAL_CATEGORY_PASSPORT = "Passport";

export const MAP_PORTAL_PARTNER_TAG = "PARTENAIRE";
export const MAP_PORTAL_PARTNER_SEE_PROFILE = "Voir la fiche";
export const MAP_PORTAL_PARTNER_PANEL_ROUTE = "Itinéraire";

export const MAP_PORTAL_FAVORITES = "Mes favoris";
export const MAP_PORTAL_VISITED = "Mes lieux visités";

export const MAP_PORTAL_FILTERS_TITLE = "Filtres rapides";
export const MAP_PORTAL_FILTERS_RESET = "Réinitialiser";
export const MAP_PORTAL_OPEN_NOW = "Ouvert maintenant";
export const MAP_PORTAL_DISTANCE = "Distance max.";
export const MAP_PORTAL_DISTANCE_KM = (km: number) => `${km} km`;

export const MAP_PORTAL_AMBIANCE_TITLE = "Ambiance";
export const MAP_PORTAL_MORE_FILTERS = "Plus de filtres";

export const MAP_PORTAL_GEO_TITLE = "Découvrez en vous laissant guider ✨";
export const MAP_PORTAL_GEO_BODY =
  "Activez la géolocalisation pour des recommandations autour de vous.";
export const MAP_PORTAL_GEO_CTA = "Activer ma position";

export const MAP_PORTAL_SEARCH_PLACEHOLDER =
  "Rechercher un lieu, un événement, une activité…";

/** Copy mobile carte (MOBILE-MAP-01). */
export const MAP_MOBILE_SEARCH_PLACEHOLDER =
  "Rechercher un lieu, un événement, un quartier…";
export const MAP_MOBILE_CATEGORY_ALL = "Tous";
export const MAP_MOBILE_CATEGORY_DINING = "Restauration";
export const MAP_MOBILE_CATEGORY_OUTINGS = "Sorties";
export const MAP_MOBILE_CATEGORY_CULTURE = "Culture";
export const MAP_MOBILE_CATEGORY_RETAIL = "Commerces";
export const MAP_MOBILE_FILTERS_ARIA = "Filtres de la carte";
export const MAP_MOBILE_LOCATE_ARIA = "Centrer sur ma position";
export const MAP_MOBILE_NAVIGATE_ARIA = "Itinéraire";
export const MAP_MOBILE_BOOKMARK_ARIA = "Enregistrer";
export const MAP_MOBILE_BOOKMARK_SOON = "Enregistrer — bientôt disponible";
export const MAP_MOBILE_EVENT_BADGE = "Événement";
export const MAP_MOBILE_POPULAR_BADGE = "Populaire";
export const MAP_MOBILE_WALK_MINUTES = (minutes: number) =>
  minutes <= 1 ? "1 min" : `${minutes} min`;

export const MAP_PORTAL_CHIP_ALL = "Tout";
export const MAP_PORTAL_CHIP_EVENTS = "Événements";
export const MAP_PORTAL_CHIP_PLACES = "Lieux";
export const MAP_PORTAL_CHIP_CULTURE = "Culture";
export const MAP_PORTAL_CHIP_MORE = "Plus";
export const MAP_PORTAL_CHIP_PARTNERS = "Partenaires";
export const MAP_PORTAL_CHIP_PASSPORT = "Passport";

export const MAP_PORTAL_AROUND_TITLE = "Autour de vous";
export const MAP_DESKTOP_SEARCH_IN_ZONE = "Rechercher dans cette zone";
export const MAP_RAIL_NEIGHBORHOOD_AMBIANCE_TITLE = "Ambiance des quartiers";
export const MAP_PORTAL_AROUND_SEE_ALL = "Voir tout";
export const MAP_PORTAL_AROUND_EMPTY =
  "Déplacez la carte ou activez votre position pour voir ce qui est proche.";

export const MAP_PORTAL_DETAIL_ROUTE = "Itinéraire";
export const MAP_PORTAL_DETAIL_CALL = "Appeler";
export const MAP_PORTAL_DETAIL_WEBSITE = "Site web";
export const MAP_PORTAL_DETAIL_SHARE = "Partager";
export const MAP_PORTAL_DETAIL_SEE_MORE = "Voir plus";
export const MAP_PORTAL_DETAIL_HIGHLIGHTS = "À ne pas manquer ici";
export const MAP_PORTAL_DETAIL_HIGHLIGHTS_EMPTY =
  "Aucun événement à venir signalé à proximité immédiate.";
export const MAP_PORTAL_DETAIL_SOURCE = "En savoir plus";
export const MAP_PORTAL_DETAIL_ADD_PLACE = "Ajouter un lieu manquant";
export const MAP_PORTAL_DETAIL_CLOSE = "Fermer";
export const MAP_PORTAL_DETAIL_LOADING = "Chargement…";
export const MAP_PORTAL_DETAIL_ERROR = "Impossible de charger ce lieu.";
export const MAP_PORTAL_EVENT_TAG = "ÉVÉNEMENT";
export const MAP_PORTAL_PLACE_TAG = "LIEU";
export const MAP_PORTAL_DISTANCE_AWAY = (meters: number) =>
  meters < 1000 ? `À ${Math.round(meters)} m` : `À ${(meters / 1000).toFixed(1)} km`;
export const MAP_PORTAL_EVENT_TIME = (label: string) => label;
export const MAP_PORTAL_OPEN_STATUS = "À venir";
