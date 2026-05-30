/** Discussions portal micro-copy (WEB-DISCUSSIONS-01). */

export const DISCUSSIONS_PAGE_TITLE = "Discussions";
export const DISCUSSIONS_PAGE_SUBTITLE =
  "Échangez, partagez et trouvez des réponses auprès de votre communauté locale.";

export const DISCUSSIONS_CATEGORY_ALL = "Toutes";
export const DISCUSSIONS_CATEGORY_QUESTIONS = "Questions";
export const DISCUSSIONS_CATEGORY_TIPS = "Bons plans";
export const DISCUSSIONS_CATEGORY_NEWS = "Actualités locales";
export const DISCUSSIONS_CATEGORY_CULTURE = "Culture";
export const DISCUSSIONS_CATEGORY_SPORTS = "Sports";
export const DISCUSSIONS_CATEGORY_TRIBES = "Tribus";

export const DISCUSSIONS_CTA_TITLE = "Partagez vos idées";
export const DISCUSSIONS_CTA_BODY =
  "Posez une question, lancez un sujet ou partagez vos bons plans avec la communauté.";
export const DISCUSSIONS_CTA_BUTTON = "Nouvelle discussion";

export const DISCUSSIONS_TRIBES_TITLE = "Vos tribus";
export const DISCUSSIONS_TRIBES_CTA = "Voir tout";
export const DISCUSSIONS_TRIBES_MORE = (count: number) => `+ ${count} autre${count > 1 ? "s" : ""} tribu${count > 1 ? "s" : ""}`;
export const DISCUSSIONS_TRIBES_EMPTY = "Rejoignez une tribu pour enrichir vos discussions.";

export const DISCUSSIONS_TRENDING_TITLE = "Sujets tendance";
export const DISCUSSIONS_TRENDING_CTA = "Voir tout";
export const DISCUSSIONS_TRENDING_EMPTY = "Les sujets émergent au fil des échanges locaux.";
export const DISCUSSIONS_TRENDING_MESSAGES = (count: number) =>
  `${count} message${count > 1 ? "s" : ""}`;

export const DISCUSSIONS_ACTIVE_TITLE = "Discussions actives";
export const DISCUSSIONS_ACTIVE_CTA = "Voir tout";
export const DISCUSSIONS_ACTIVE_EMPTY = "Aucune discussion active pour le moment.";
export const DISCUSSIONS_ACTIVE_REPLIES = (count: number, ago: string) =>
  `${count} réponse${count > 1 ? "s" : ""} · ${ago}`;

export const DISCUSSIONS_RULES_TITLE = "Règles de la communauté";
export const DISCUSSIONS_RULES_SEE_ALL = "Voir toutes les règles";
export const DISCUSSIONS_RULES_ITEMS = [
  { id: "respect", label: "Soyez respectueux" },
  { id: "spam", label: "Pas de spam ou publicité" },
  { id: "topic", label: "Restez dans le sujet" },
  { id: "protect", label: "Protégeons notre communauté" },
] as const;

export const DISCUSSIONS_LOAD_MORE = "Charger plus de discussions";
export const DISCUSSIONS_LOADING = "Chargement des discussions…";
export const DISCUSSIONS_ERROR = "Impossible de charger les discussions.";
export const DISCUSSIONS_RETRY = "Réessayer";
export const DISCUSSIONS_EMPTY =
  "Aucune discussion pour l'instant. Lancez le premier sujet avec votre communauté.";

export const DISCUSSIONS_LEFT_HOME = "Accueil";
export const DISCUSSIONS_LEFT_SUBSCRIPTIONS = "Abonnements";
export const DISCUSSIONS_LEFT_POPULAR = "Populaires";
export const DISCUSSIONS_LEFT_NEARBY = "Près de moi";
export const DISCUSSIONS_LEFT_DISCUSSIONS = "Discussions";
export const DISCUSSIONS_LEFT_CONTRIBUTIONS = "Contributions";
export const DISCUSSIONS_LEFT_SAVED = "Enregistrés";
