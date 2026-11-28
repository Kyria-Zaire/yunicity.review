/** Sortir portal micro-copy (WEB-SORTIR-01). */

export const SORTIR_PORTAL_PAGE_TITLE = "Sortir";
export const SORTIR_PORTAL_HERO_PREFIX = "Que faire à";
export const SORTIR_PORTAL_HERO_SUFFIX = "ce soir ?";
export const SORTIR_PORTAL_HERO_BODY =
  "Découvrez les événements, rencontres et lieux qui animent la ville.";
export const SORTIR_PORTAL_LOCATION_AROUND = "Autour de moi";

export const SORTIR_LIVE_EVENTS_TITLE = "En ce moment";
export const SORTIR_LIVE_EVENTS_CTA = "Voir tout";
export const SORTIR_LIVE_EVENTS_EMPTY =
  "Rien de public n’est annoncé pour l’instant. Les prochains moments apparaîtront ici dès qu’ils seront publiés.";
export const SORTIR_LIVE_EVENTS_EMPTY_CTA = "Explorer les lieux";

export const SORTIR_LIVE_PLACES_TITLE = "Les lieux qui vivent ce soir";
export const SORTIR_LIVE_PLACES_CTA = "Voir tout";
export const SORTIR_LIVE_PLACES_EMPTY =
  "Aucun lieu n’a encore d’activité annoncée ce soir.";
export const SORTIR_LIVE_PLACES_EMPTY_CTA = "Découvrir les lieux";
export const SORTIR_LIVE_PLACES_BUTTON = "Voir le lieu";

export const SORTIR_ACTIVE_NEIGHBORHOODS_TITLE = "Quartiers les plus actifs";
export const SORTIR_ACTIVE_NEIGHBORHOODS_CTA = "Voir tout";
export const SORTIR_ACTIVE_NEIGHBORHOODS_EMPTY =
  "Les quartiers se réveillent doucement — explorez la carte.";

export const SORTIR_FOR_YOU_TITLE = "Pour vous";
export const SORTIR_FOR_YOU_SUBTITLE = "Recommandations basées sur vos centres d'intérêt";
export const SORTIR_FOR_YOU_EMPTY =
  "Ajoutez quelques centres d’intérêt dans votre profil pour recevoir des suggestions plus pertinentes.";
export const SORTIR_FOR_YOU_EMPTY_CTA = "Compléter mon profil";
export const SORTIR_FOR_YOU_CTA = "Voir l'activité";
export const SORTIR_FOR_YOU_SPOTS = (count: number): string =>
  count > 0 ? `${count} place${count > 1 ? "s" : ""} restante${count > 1 ? "s" : ""}` : "Places limitées";

export const SORTIR_TRIBES_TONIGHT_TITLE = "Activités de vos tribus ce soir";
export const SORTIR_TRIBES_TONIGHT_SUBTITLE = (count: number): string =>
  count === 0
    ? "Aucune activité liée à vos tribus ce soir."
    : count === 1
      ? "1 activité liée à vos tribus ce soir."
      : `${count} activités liées à vos tribus ce soir.`;
export const SORTIR_TRIBES_TONIGHT_CTA = "Voir toutes les activités de mes tribus";
export const SORTIR_TRIBES_TONIGHT_EMPTY =
  "Rejoignez une tribu pour suivre les sorties de votre communauté.";
export const SORTIR_TRIBES_TONIGHT_EMPTY_CTA = "Découvrir les tribus";
export const SORTIR_TRIBES_TONIGHT_MORE = "Voir les activités";

export const SORTIR_LOADING = "Chargement…";
export const SORTIR_ERROR = "Impossible de charger les sorties.";
export const SORTIR_RETRY = "Réessayer";

export const SORTIR_CATEGORY_CULTURE = "Culture";
export const SORTIR_CATEGORY_SORTIR = "Sortir";
export const SORTIR_CATEGORY_CAFE = "Café";
export const SORTIR_CATEGORY_CONCERTS = "Concerts";
export const SORTIR_CATEGORY_RENCONTRES = "Rencontres";
export const SORTIR_CATEGORY_TONIGHT = "Ce soir";
export const SORTIR_CATEGORY_TREND = "Bientôt";

export const SORTIR_MOOD_LIVELY = "Très animé";
export const SORTIR_MOOD_CALM = "Ambiance calme";
export const SORTIR_MOOD_CULTURE = "Culture";
export const SORTIR_MOOD_OUTINGS = "Sorties";
export const SORTIR_MOOD_LIVE_MUSIC = "Musique live";

export const SORTIR_EVENT_INTERESTED = "Vous êtes intéressé·e";
export const SORTIR_EVENT_UNTIL = (label: string): string => `Jusqu'au ${label}`;

export const SORTIR_HERO_STAT_NEIGHBORHOODS = (count: number): string =>
  count === 0 ? "Quartiers à explorer" : `${count} quartier${count > 1 ? "s" : ""} à explorer`;
export const SORTIR_HERO_STAT_PLACES = (count: number): string =>
  count === 0 ? "Lieux à découvrir" : `${count} lieu${count > 1 ? "x" : ""} à découvrir`;
export const SORTIR_HERO_STAT_TRIBES = (count: number): string =>
  count === 0 ? "Tribus à découvrir" : `${count} tribu${count > 1 ? "s" : ""} locales`;
export const SORTIR_HERO_STAT_EVENTS = (count: number): string =>
  count === 0 ? "À venir côté agenda" : `${count} événement${count > 1 ? "s" : ""} à venir`;

export const SORTIR_NEW_USER_WELCOME = "Bienvenue dans votre agenda local.";

export const SORTIR_FEATURED_TODAY_TITLE = "À la une aujourd’hui";
export const SORTIR_FEATURED_TODAY_CTA = "Voir tout";
export const SORTIR_FEATURED_FALLBACK_TITLE = "Commencer à sortir à Reims";
export const SORTIR_FEATURED_FALLBACK_BODY =
  "Votre agenda est encore calme. Commencez par explorer les quartiers, les lieux et les tribus de Reims.";
export const SORTIR_FEATURED_LINK_NEIGHBORHOODS = "Quartiers";
export const SORTIR_FEATURED_LINK_PLACES = "Lieux";
export const SORTIR_FEATURED_LINK_TRIBES = "Tribus";
export const SORTIR_FEATURED_LINK_MAP = "Carte";

/** Copy mobile Sortir (MOBILE-SORTIR-01). */
export const SORTIR_MOBILE_SEARCH_PLACEHOLDER = "Rechercher une sortie, un lieu...";
export const SORTIR_MOBILE_FILTERS_ARIA = "Filtres Sortir";
export const SORTIR_MOBILE_CATEGORY_ALL = "Tous";
export const SORTIR_MOBILE_CATEGORY_CONCERTS = "Concerts";
export const SORTIR_MOBILE_CATEGORY_PARTIES = "Soirées";
export const SORTIR_MOBILE_CATEGORY_EXPOS = "Expos";
export const SORTIR_MOBILE_CATEGORY_SPORT = "Sport";
export const SORTIR_MOBILE_CATEGORY_OTHER = "Autres";
export const SORTIR_MOBILE_FEATURED_TITLE = "À ne pas manquer 🔥";
export const SORTIR_MOBILE_UPCOMING_TITLE = "Prochains événements";
export const SORTIR_MOBILE_POPULAR_PLACES_TITLE = "Lieux populaires";
export const SORTIR_MOBILE_VIEW_ALL = "Voir tout";
export const SORTIR_MOBILE_BOOKMARK_ARIA = "Enregistrer";
export const SORTIR_MOBILE_BOOKMARK_SOON = "Enregistrer — bientôt disponible";
export const SORTIR_MOBILE_EDITORIAL_BODY = "Des idées locales selon vos envies.";
export const SORTIR_MOBILE_AGENDA_PILL = (count: number): string => `Mon agenda · ${count}`;
export const SORTIR_MOBILE_FEATURED_MAP = "Sur la carte";

/** Copy desktop Sortir — shell 3 colonnes (DESKTOP-SORTIR-01). */
export const SORTIR_DESKTOP_PAGE_TITLE = "Sortir à Reims";
export const SORTIR_DESKTOP_EDITORIAL_KICKER = (city: string, moment: string): string =>
  `${city.toUpperCase()} · ${moment}`;
export const SORTIR_DESKTOP_EDITORIAL_TITLE = (city: string): string => `Que faire à ${city} ?`;
export const SORTIR_DESKTOP_EDITORIAL_BODY =
  "Des idées locales choisies selon le moment, vos envies et votre quartier.";
export const SORTIR_DESKTOP_SEARCH_PLACEHOLDER =
  "Rechercher une sortie, un lieu, une ambiance…";
export const SORTIR_DESKTOP_WHEN_TITLE = "Quand ?";
export const SORTIR_DESKTOP_WHEN_TODAY = "Aujourd'hui";
export const SORTIR_DESKTOP_WHEN_TOMORROW = "Demain";
export const SORTIR_DESKTOP_WHEN_WEEKEND = "Ce week-end";
export const SORTIR_DESKTOP_WHEN_PICK = "Choisir une date";
export const SORTIR_DESKTOP_CATEGORIES_TITLE = "Catégories";
export const SORTIR_DESKTOP_CATEGORY_ALL = "Tout";
export const SORTIR_DESKTOP_CATEGORY_CULTURE = "Culture";
export const SORTIR_DESKTOP_CATEGORY_MUSIC = "Musique";
export const SORTIR_DESKTOP_CATEGORY_FOOD = "Food";
export const SORTIR_DESKTOP_CATEGORY_SPORT = "Sport";
export const SORTIR_DESKTOP_CATEGORY_FAMILY = "Famille";
export const SORTIR_DESKTOP_CATEGORY_LOCAL = "Vie locale";
export const SORTIR_DESKTOP_FILTERS_TITLE = "Filtres";
export const SORTIR_DESKTOP_FILTER_FREE = "Gratuit";
export const SORTIR_DESKTOP_FILTER_NEARBY = "À moins de 3 km";
export const SORTIR_DESKTOP_FILTER_ACCESSIBLE = "Accessible";
export const SORTIR_DESKTOP_FILTER_INDOOR = "En intérieur";
export const SORTIR_DESKTOP_MORE_FILTERS = "Plus de filtres";
export const SORTIR_DESKTOP_MOOD_TONIGHT = "Ce soir";
export const SORTIR_DESKTOP_MOOD_FRIENDS = "Entre amis";
export const SORTIR_DESKTOP_MOOD_FAMILY = "En famille";
export const SORTIR_DESKTOP_MOOD_BUDGET = "Petit budget";
export const SORTIR_DESKTOP_MOOD_CALM = "Au calme";
export const SORTIR_DESKTOP_MOOD_DANCE = "Danser";
export const SORTIR_DESKTOP_FEATURED_BADGE = "À LA UNE";
export const SORTIR_DESKTOP_FEATURED_CTA = "Voir l'événement";
export const SORTIR_DESKTOP_FEATURED_SAVE = "Enregistrer";
export const SORTIR_DESKTOP_FEATURED_MAP = "Voir sur la carte";
export const SORTIR_DESKTOP_TONIGHT_TITLE = "Ce soir à Reims";
export const SORTIR_DESKTOP_TONIGHT_VIEW_ALL = "Voir tout →";
export const SORTIR_DESKTOP_CARD_DETAIL = "Voir le détail";
export const SORTIR_DESKTOP_AGENDA_TITLE = "Votre agenda";
export const SORTIR_DESKTOP_AGENDA_COUNT = (count: number): string =>
  count === 0
    ? "Aucune sortie enregistrée"
    : count === 1
      ? "1 sortie enregistrée"
      : `${count} sorties enregistrées`;
export const SORTIR_DESKTOP_AGENDA_CTA = "Voir mon agenda";
export const SORTIR_DESKTOP_SOON_TITLE = "Bientôt";
export const SORTIR_DESKTOP_SOON_CTA = "Voir";
export const SORTIR_DESKTOP_EXPLORE_TITLE = "Explorer autrement";
export const SORTIR_DESKTOP_EXPLORE_MAP = "Autour de moi";
export const SORTIR_DESKTOP_EXPLORE_MAP_BODY = "Voir les sorties autour de vous";
export const SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD = "Par quartier";
export const SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD_BODY = "Découvrir les ambiances locales";
export const SORTIR_DESKTOP_EXPLORE_PASSPORT = "Offres Passport";
export const SORTIR_DESKTOP_EXPLORE_PASSPORT_BODY = "Sorties, avantages et bons plans";
export const SORTIR_DESKTOP_WEEKEND_TITLE = "Ce week-end";
export const SORTIR_DESKTOP_WEEKEND_CTA = "Voir l'événement";
export const SORTIR_DESKTOP_SAVE_SOON = "Enregistrer — bientôt disponible";
export const SORTIR_CARD_BADGE_MUSIC = "Musique";
export const SORTIR_CARD_BADGE_FOOD = "Food";
export const SORTIR_CARD_BADGE_LOCAL = "Vie locale";
export const SORTIR_CARD_BADGE_CULTURE = "Culture";
