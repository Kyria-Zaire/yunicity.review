/** Tribe detail mobile copy (MOBILE-TRIBE-DETAIL-01). */

export const TRIBE_DETAIL_MOBILE_BACK = "Retour aux tribus";
export const TRIBE_DETAIL_MOBILE_BOOKMARK = "Enregistrer";
export const TRIBE_DETAIL_MOBILE_BOOKMARK_SOON = "Enregistrer — bientôt disponible";

export const TRIBE_DETAIL_MOBILE_BADGE_PUBLIC = "Tribu publique";
export const TRIBE_DETAIL_MOBILE_BADGE_PRIVATE = "Tribu privée";
export const TRIBE_DETAIL_MOBILE_BADGE_FEATURED = "Tribu à l'honneur";

export const TRIBE_DETAIL_MOBILE_JOIN = "Rejoindre";
export const TRIBE_DETAIL_MOBILE_MEMBER_CTA = "Membre";
export const TRIBE_DETAIL_MOBILE_JOIN_CARD_BODY =
  "Vous pouvez publier du contenu public, répondre aux discussions et recevoir les actualités de la tribu.";
export const TRIBE_DETAIL_MOBILE_CHARTER_CHECK =
  "J'ai lu et j'accepte la charte de la tribu";
export const TRIBE_DETAIL_MOBILE_READ_CHARTER = "Lire la charte";

export const TRIBE_DETAIL_MOBILE_TAB_OVERVIEW = "Aperçu";
export const TRIBE_DETAIL_MOBILE_TAB_DISCUSSIONS = "Discussions";
export const TRIBE_DETAIL_MOBILE_TAB_EVENTS = "Événements";
export const TRIBE_DETAIL_MOBILE_TAB_MEMBERS = "Membres";
export const TRIBE_DETAIL_MOBILE_TAB_ABOUT = "À propos";

export const TRIBE_DETAIL_MOBILE_VISITOR_BANNER =
  "Vous consultez cette tribu en tant que visiteur. Rejoignez-la pour publier ou répondre.";

export const TRIBE_DETAIL_MOBILE_WELCOME_TITLE = "Bienvenue dans la tribu";
export const TRIBE_DETAIL_MOBILE_WELCOME_BODY =
  "Découvrez les membres, les échanges et les rendez-vous de cette communauté locale.";
export const TRIBE_DETAIL_MOBILE_WELCOME_CHARTER_LINK = "Lire la charte de la tribu";

export const TRIBE_DETAIL_MOBILE_DISCUSSIONS_TITLE = "Discussions récentes";
export const TRIBE_DETAIL_MOBILE_DISCUSSIONS_EMPTY =
  "Aucune discussion pour l'instant — le premier message ouvrira la conversation.";
export const TRIBE_DETAIL_MOBILE_DISCUSSIONS_GUEST =
  "Rejoignez la tribu pour lire et participer aux discussions.";
export const TRIBE_DETAIL_MOBILE_DISCUSSIONS_VIEW = "Voir la discussion";

export const TRIBE_DETAIL_MOBILE_NEXT_EVENT_TITLE = "Prochain rendez-vous";
export const TRIBE_DETAIL_MOBILE_NEXT_EVENT_EMPTY =
  "Aucun rendez-vous planifié pour le moment.";
export const TRIBE_DETAIL_MOBILE_NEXT_EVENT_VIEW = "Voir l'événement";

export const TRIBE_DETAIL_MOBILE_PROJECTS_TITLE = "Projets récemment partagés";
export const TRIBE_DETAIL_MOBILE_PROJECTS_EMPTY =
  "Les premiers projets partagés apparaîtront ici.";

export const TRIBE_DETAIL_MOBILE_ABOUT_TITLE = "À propos";
export const TRIBE_DETAIL_MOBILE_ABOUT_PUBLIC = "Tribu publique";
export const TRIBE_DETAIL_MOBILE_ABOUT_PRIVATE = "Tribu privée";

export const TRIBE_DETAIL_MOBILE_RULES_TITLE = "Règles essentielles";
export const TRIBE_DETAIL_MOBILE_RULE_RESPECT = "Respect et retours constructifs";
export const TRIBE_DETAIL_MOBILE_RULE_NO_SPAM = "Pas de promotion répétitive";
export const TRIBE_DETAIL_MOBILE_RULE_PRIVACY = "Protéger les informations privées";
export const TRIBE_DETAIL_MOBILE_RULES_ALL = "Lire toute la charte";

export const TRIBE_DETAIL_MOBILE_MODERATION_TITLE = "Modération et sécurité";
export const TRIBE_DETAIL_MOBILE_CONTACT_MODS = "Contacter les modérateurs";
export const TRIBE_DETAIL_MOBILE_REPORT = "Signaler la tribu";

export const TRIBE_DETAIL_MOBILE_COMMUNITY_SUFFIX = "Communauté locale";
export const TRIBE_DETAIL_MOBILE_TEAM_PREFIX = "Équipe";

export const TRIBE_DETAIL_MOBILE_STAT_MEMBERS = "Membres";
export const TRIBE_DETAIL_MOBILE_STAT_POSTS = "Publications";
export const TRIBE_DETAIL_MOBILE_STAT_EVENTS = "Événements";
export const TRIBE_DETAIL_MOBILE_STAT_CATEGORY = "Thème";

/** @deprecated Utiliser TRIBE_DETAIL_MOBILE_TAB_OVERVIEW */
export const TRIBE_DETAIL_MOBILE_TAB_FEATURED = TRIBE_DETAIL_MOBILE_TAB_OVERVIEW;

/** @deprecated Utiliser TRIBE_DETAIL_MOBILE_JOIN */
export const TRIBE_DETAIL_MOBILE_JOIN_CTA = TRIBE_DETAIL_MOBILE_JOIN;

/** @deprecated Utiliser TRIBE_DETAIL_MOBILE_BADGE_PUBLIC / PRIVATE */
export const TRIBE_DETAIL_MOBILE_VISIBILITY_PUBLIC = TRIBE_DETAIL_MOBILE_BADGE_PUBLIC;
export const TRIBE_DETAIL_MOBILE_VISIBILITY_PRIVATE = TRIBE_DETAIL_MOBILE_BADGE_PRIVATE;

/** @deprecated Utiliser TRIBE_DETAIL_MOBILE_WELCOME_TITLE */
export const TRIBE_DETAIL_MOBILE_FEATURED_TITLE = TRIBE_DETAIL_MOBILE_WELCOME_TITLE;

/** @deprecated Utiliser TRIBE_DETAIL_MOBILE_NEXT_EVENT_TITLE */
export const TRIBE_DETAIL_MOBILE_EVENTS_TITLE = TRIBE_DETAIL_MOBILE_NEXT_EVENT_TITLE;

export const TRIBE_DETAIL_MOBILE_MEMBERS_TITLE = "Membres";
export const TRIBE_DETAIL_MOBILE_MEMBERS_SEE_ALL = "Voir tous les membres";
export const TRIBE_DETAIL_MOBILE_VIEW_ALL = "Tout voir";
export const TRIBE_DETAIL_MOBILE_MORE = "Voir plus";

export function formatTribeDetailMobileJoinCardTitle(tribeName: string): string {
  return `Rejoindre ${tribeName}`;
}
