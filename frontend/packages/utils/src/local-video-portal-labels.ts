/** Copy UI — portail Vidéos (WEB-VIDEOS-01). */

export const VIDEOS_PORTAL_TITLE = "Vidéos locales";
export const VIDEOS_PORTAL_SUBTITLE =
  "Découvrez votre territoire autrement.";
export const VIDEOS_PORTAL_PUBLISH_CTA = "Publier une vidéo";

export const VIDEOS_SIDEBAR_FILTERS_TITLE = "Filtres";
export const VIDEOS_SIDEBAR_RESET = "Réinitialiser";
export const VIDEOS_FILTER_CATEGORY = "Catégorie";
export const VIDEOS_FILTER_LOCATION = "Lieu";
export const VIDEOS_FILTER_DURATION = "Durée";
export const VIDEOS_FILTER_DATE = "Date de publication";
export const VIDEOS_FILTER_POPULARITY = "Popularité";

export const VIDEOS_FILTER_ALL = "Toutes";
export const VIDEOS_FILTER_ALL_LOCATIONS = "Tous les lieux";
export const VIDEOS_FILTER_ALL_DURATIONS = "Toutes durées";
export const VIDEOS_FILTER_ALL_PERIODS = "Toutes périodes";
export const VIDEOS_FILTER_ALL_POPULARITY = "Toutes";

export const VIDEOS_DURATION_SHORT = "Courtes (< 1 min)";
export const VIDEOS_DURATION_MEDIUM = "Moyennes (1–3 min)";
export const VIDEOS_DURATION_LONG = "Longues (> 3 min)";

export const VIDEOS_DATE_TODAY = "Aujourd'hui";
export const VIDEOS_DATE_WEEK = "Cette semaine";
export const VIDEOS_DATE_MONTH = "Ce mois-ci";

export const VIDEOS_POPULARITY_LIKED = "Les plus aimées";
export const VIDEOS_POPULARITY_COMMENTED = "Les plus commentées";

export const VIDEOS_TAB_NEARBY = "Près de vous";
export const VIDEOS_TAB_FOR_YOU = "Pour vous";
export const VIDEOS_DESKTOP_LEFT_EVENTS = "Événements";
export const VIDEOS_DESKTOP_LEFT_PLACES = "Lieux";
export const VIDEOS_DESKTOP_LEFT_SAVED = "Mes vidéos";
export const VIDEOS_DESKTOP_LOCAL_DISCLAIMER =
  "Les vidéos restent liées à la vie locale";
export const VIDEOS_DESKTOP_UP_NEXT = "À découvrir ensuite";
export const VIDEOS_DESKTOP_CREATORS = "Créateurs locaux";
export const VIDEOS_DESKTOP_TOPICS = "Vos sujets";
export const VIDEOS_DESKTOP_VIEW_PROFILE = "Voir le profil";
export const VIDEOS_DESKTOP_FILTER_PANEL = "Filtres vidéo";
export const VIDEOS_DESKTOP_FILTER_CLOSE = "Fermer";
export const VIDEOS_DESKTOP_FILTER_OPEN = "Filtres";
export const VIDEOS_DESKTOP_SEE_ON_MAP = "Voir sur la carte";
export const VIDEOS_DESKTOP_DISCOVER_PLACE = "Découvrir ce lieu";
export const VIDEOS_DESKTOP_SHARE = "Partager";
export const VIDEOS_DESKTOP_SAVE = "Enregistrer";
export const VIDEOS_DESKTOP_FOLLOW = "Suivre";
export const VIDEOS_DESKTOP_ORIGINAL_SOUND = "Son original · {author}";
export const VIDEOS_DESKTOP_MORE = "Plus d'options";
export const VIDEOS_DESKTOP_FOOTER_ABOUT = "À propos";
export const VIDEOS_DESKTOP_FOOTER_HELP = "Aide";
export const VIDEOS_DESKTOP_FOOTER_PRIVACY = "Confidentialité";
export const VIDEOS_DESKTOP_FOOTER_TERMS = "Conditions";
export const VIDEOS_DESKTOP_FOOTER_COPYRIGHT = "© {year} Yunicity";
export const VIDEOS_DESKTOP_FOOTER_ARIA = "Liens légaux";

export const VIDEOS_TAB_ALL = "Tout";
export const VIDEOS_TAB_TRENDING = "Tendances";
export const VIDEOS_TAB_NEW = "Nouveautés";
export const VIDEOS_TAB_SUBSCRIPTIONS = "Abonnements";
export const VIDEOS_TAB_MINE = "Mes vidéos";

/** Copy mobile portail Vidéos (MOBILE-VIDEOS-01). */
export const VIDEOS_MOBILE_TAB_FOR_YOU = "Pour vous";
export const VIDEOS_MOBILE_SEARCH_PLACEHOLDER = "Rechercher une vidéo";
export const VIDEOS_MOBILE_SEARCH_SCOPE_HINT =
  "Titre, description, créateur, quartier ou lieu.";
export const VIDEOS_MOBILE_SEARCH_BACK = "Fermer la recherche";
export const VIDEOS_MOBILE_SEARCH_CLEAR_FIELD = "Effacer le champ de recherche";
export const VIDEOS_MOBILE_SEARCH_CLEAR = "Effacer la recherche";
export const VIDEOS_MOBILE_SEARCH_MORE = "Chercher dans plus de vidéos";
export const VIDEOS_MOBILE_SEARCH_RETRY = "Réessayer";
export const VIDEOS_MOBILE_SEARCH_CURRENT = "Vidéo en cours";
export const VIDEOS_MOBILE_FILTERS_OPEN = "Filtres";
export const VIDEOS_MOBILE_FILTERS_CLOSE = "Fermer les filtres";
export const VIDEOS_MOBILE_FILTERS_RESET = "Réinitialiser";
export const VIDEOS_MOBILE_FILTERS_RESET_CRITERIA = "Réinitialiser les filtres";
export const VIDEOS_MOBILE_FILTERS_LOCATION_HINT = "Quartiers des vidéos chargées";
export const VIDEOS_MOBILE_CRITERIA_EMPTY = "Aucune vidéo ne correspond à vos critères";
export const VIDEOS_MOBILE_CRITERIA_EMPTY_MORE =
  "Aucune vidéo parmi celles déjà chargées ne correspond à vos critères.";
export const VIDEOS_MOBILE_CRITERIA_EMPTY_MORE_HINT =
  "D'autres vidéos peuvent correspondre. Chargez les suivantes ou réinitialisez les filtres.";

export function formatVideosMobileFiltersButtonLabel(activeCount: number): string {
  if (activeCount <= 0) return "Filtres";
  return `Filtres — ${activeCount} actif${activeCount > 1 ? "s" : ""}`;
}

export function formatVideosMobileSearchInView(viewLabel: string): string {
  return `Dans la vue ${viewLabel}`;
}

export function formatVideosMobileSearchLoadedBanner(loadedCount: number): string {
  const n = Math.max(0, loadedCount);
  return `La recherche porte sur les ${n} vidéo${n > 1 ? "s" : ""} déjà chargée${n > 1 ? "s" : ""}. Vous pourrez chercher parmi les suivantes.`;
}

export function formatVideosMobileSearchResultStatus(
  resultCount: number,
  loadedCount: number,
  viewLabel: string,
): string {
  const results = Math.max(0, resultCount);
  const loaded = Math.max(0, loadedCount);
  if (results === 0) {
    return `Aucune vidéo parmi les ${loaded} chargée${loaded > 1 ? "s" : ""} · vue ${viewLabel}`;
  }
  return `${results} vidéo${results > 1 ? "s" : ""} parmi les ${loaded} chargée${loaded > 1 ? "s" : ""} · vue ${viewLabel}`;
}

export function formatVideosMobileSearchNoneAmongLoaded(loadedCount: number, query: string): {
  title: string;
  hint: string;
} {
  const n = Math.max(0, loadedCount);
  const term = query.trim();
  return {
    title: `Aucun résultat parmi les ${n} vidéo${n > 1 ? "s" : ""} chargée${n > 1 ? "s" : ""}`,
    hint: term
      ? `D'autres vidéos peuvent correspondre à « ${term} ». Chargez les suivantes pour poursuivre la recherche.`
      : "Chargez les suivantes pour poursuivre la recherche.",
  };
}

export function formatVideosMobileSearchExhausted(query: string, viewLabel: string): {
  title: string;
  hint: string;
  status: string;
} {
  const term = query.trim();
  return {
    status: `Aucune vidéo parmi celles de la vue ${viewLabel}`,
    title: term ? `Aucune vidéo ne correspond à « ${term} »` : "Aucune vidéo ne correspond à la recherche",
    hint: `Toutes les vidéos de la vue ${viewLabel} ont été parcourues. Essayez un autre mot.`,
  };
}

export function formatVideosMobileFiltersSee(count: number): string {
  const n = Math.max(0, count);
  return `Voir ${n} vidéo${n > 1 ? "s" : ""}`;
}

export function formatVideosMobileFiltersStatus(resultCount: number, loadedCount: number): string {
  const results = Math.max(0, resultCount);
  const loaded = Math.max(0, loadedCount);
  const base = `${results} vidéo${results > 1 ? "s" : ""} parmi les ${loaded} chargée${loaded > 1 ? "s" : ""}.`;
  return `${base} D'autres peuvent correspondre dans les vidéos suivantes.`;
}
export const VIDEOS_MOBILE_RECENT_TITLE = "Les plus récentes";
export const VIDEOS_MOBILE_PUBLISH_ARIA = "Publier une vidéo";
export const VIDEOS_MOBILE_PUBLISH_LABEL = "Publier";

/** VIDEO-REFONTE-L3L4 — fil immersif mobile v2.3 (sélecteur de vue, son, états). */
export const VIDEOS_MOBILE_VIEW_MENU_LABEL = "Choisir une vue";
export function formatVideosMobileViewButtonLabel(viewLabel: string): string {
  return `Vue : ${viewLabel} — changer de vue`;
}
export const VIDEOS_MOBILE_SOUND_ON = "Activer le son";
export const VIDEOS_MOBILE_SOUND_OFF = "Couper le son";
export const VIDEOS_MOBILE_FULLSCREEN = "Plein écran";
export const VIDEOS_MOBILE_FOR_YOU_EMPTY = "Aucune vidéo pour le moment.";
export const VIDEOS_MOBILE_FOR_YOU_EMPTY_HINT = "Les vidéos publiées par les habitants apparaîtront ici.";
export const VIDEOS_MOBILE_TRENDING_EMPTY = "Aucune vidéo tendance pour le moment.";
export const VIDEOS_MOBILE_TRENDING_EMPTY_HINT = "Les vidéos aimées par les habitants apparaîtront ici.";
export const VIDEOS_MOBILE_NEW_EMPTY = "Aucune nouvelle vidéo ces 14 derniers jours.";
export const VIDEOS_MOBILE_NEW_EMPTY_HINT = "Les vidéos publiées récemment apparaîtront ici.";
export const VIDEOS_MOBILE_EMPTY_BACK_TO_FOR_YOU = "Voir « Pour vous »";
export const VIDEOS_MOBILE_ERROR_HINT = "Vérifiez la connexion, puis réessayez.";
export const VIDEOS_MOBILE_SHARE_ACTION = "Partager la vidéo";
export const VIDEOS_MOBILE_SHARE_SHORT = "Partager";
export const VIDEOS_MOBILE_MORE_ACTIONS = "Plus d'options : signaler";
/** VIDEO-REFONTE-L3L4 — lot 4 : légende « plus », feuille Description (E), menu « … » (I). */
export const VIDEOS_MOBILE_CAPTION_MORE = "plus";
export const VIDEOS_MOBILE_DESCRIPTION_TITLE = "Description";
export const VIDEOS_MOBILE_DESCRIPTION_CLOSE = "Fermer la description";
export const VIDEOS_MOBILE_MORE_TITLE = "Plus d'options";
export const VIDEOS_MOBILE_REPORT_ACTION = "Signaler la vidéo";
export const VIDEOS_MOBILE_CANCEL = "Annuler";
export const VIDEOS_MOBILE_PAUSED_BADGE = "En pause";
export function formatVideosMobileViews(viewCount: number): string {
  return `${viewCount} ${viewCount > 1 ? "vues" : "vue"}`;
}
export function formatVideosMobileLikeActionLabel(likedByMe: boolean, likeCount: number): string {
  return `${likedByMe ? "Retirer le J'aime" : "Aimer la vidéo"} — ${likeCount} J'aime`;
}
export function formatVideosMobileCommentsActionLabel(commentCount: number): string {
  return `Ouvrir les commentaires — ${commentCount} ${commentCount > 1 ? "commentaires" : "commentaire"}`;
}

export const VIDEOS_SORT_LABEL = "Trier par :";
export const VIDEOS_SORT_RELEVANCE = "Au plus près de toi";
export const VIDEOS_SORT_RECENT = "Les plus récents";
export const VIDEOS_SORT_POPULAR = "Les plus populaires";

export const VIDEOS_FEATURED_BADGE = "Nouveau";
export const VIDEOS_FEATURED_PREV = "Vidéo précédente";
export const VIDEOS_FEATURED_NEXT = "Vidéo suivante";

/** VIDEO-REFONTE-L1B — section mobile listant les auteurs des vidéos chargées (pas des abonnements). */
export const VIDEOS_FEED_CREATORS_TITLE = "Créateurs du fil";
export const VIDEOS_SUBSCRIPTIONS_TITLE = "Abonnements";
export const VIDEOS_SUBSCRIPTIONS_VIEW_ALL = "Voir tout";
export const VIDEOS_SUBSCRIPTIONS_ONLINE = "En ligne";

export const VIDEOS_PORTAL_LOADING = "Chargement des vidéos…";
export const VIDEOS_PORTAL_LOAD_MORE = "Charger plus de vidéos";
export const VIDEOS_PORTAL_EMPTY =
  "Aucune vidéo ne correspond à vos filtres pour le moment.";
export const VIDEOS_PORTAL_MINE_EMPTY = "Vous n'avez pas encore publié de vidéo.";
export const VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY =
  "Le suivi des créateurs sera bientôt disponible.";
export const VIDEOS_SUBSCRIPTIONS_EMPTY = VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY;

export const VIDEOS_GRID_MORE = "Plus d'options";
