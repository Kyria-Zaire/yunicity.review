/** Map portal micro-copy (WEB-MAP-02). */

export const MAP_PORTAL_TITLE = "Carte";
export const MAP_PORTAL_CITY_LABEL = "Ville";

export const MAP_PORTAL_CATEGORY_ALL = "Tout afficher";
export const MAP_PORTAL_CATEGORY_EVENTS = "Événements";
export const MAP_PORTAL_CATEGORY_PLACES = "Lieux";
export const MAP_PORTAL_CATEGORY_CULTURE = "Culture";
export const MAP_PORTAL_CATEGORY_NATURE = "Nature & balades";
export const MAP_PORTAL_CATEGORY_TRIBES = "Tribus";
export const MAP_PORTAL_CATEGORY_NEIGHBORHOODS = "Quartiers";
export const MAP_PORTAL_CATEGORY_TRANSIT = "Transports";

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

export const MAP_PORTAL_CHIP_ALL = "Tous";
export const MAP_PORTAL_CHIP_EVENTS = "Événements";
export const MAP_PORTAL_CHIP_PLACES = "Lieux";
export const MAP_PORTAL_CHIP_CULTURE = "Culture";
export const MAP_PORTAL_CHIP_MORE = "Plus de filtres";

export const MAP_PORTAL_AROUND_TITLE = "Autour de vous";
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
