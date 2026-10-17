/** Copy UI — Notifications desktop (DESKTOP-NOTIFICATIONS-01). */

export const NOTIFICATIONS_DESKTOP_TITLE = "Notifications";
export const NOTIFICATIONS_DESKTOP_SUBTITLE =
  "Suivez ce qui compte dans votre vie locale.";

export const NOTIFICATIONS_DESKTOP_TAB_ALL = "Toutes";
export const NOTIFICATIONS_DESKTOP_TAB_UNREAD = "Non lues";

export const NOTIFICATIONS_DESKTOP_TYPE_ALL = "Tous les types";
export const NOTIFICATIONS_DESKTOP_TYPE_EVENTS = "Événements";
export const NOTIFICATIONS_DESKTOP_TYPE_COMMUNITY = "Communauté";
export const NOTIFICATIONS_DESKTOP_TYPE_CONTRIBUTIONS = "Contributions";
export const NOTIFICATIONS_DESKTOP_TYPE_OFFERS = "Offres";
export const NOTIFICATIONS_DESKTOP_TYPE_STATUS = "Statut";

export const NOTIFICATIONS_DESKTOP_SORT_RECENT = "Les plus récentes";
export const NOTIFICATIONS_DESKTOP_SORT_OLDEST = "Les plus anciennes";

export const NOTIFICATIONS_DESKTOP_SETTINGS = "Paramètres";
export const NOTIFICATIONS_DESKTOP_MARK_ALL_READ = "Tout marquer comme lu";
export const NOTIFICATIONS_DESKTOP_LOAD_PREVIOUS = "Afficher les notifications précédentes";

export const NOTIFICATIONS_DESKTOP_SECTION_TODAY = "Aujourd'hui";
export const NOTIFICATIONS_DESKTOP_SECTION_THIS_WEEK = "Cette semaine";
export const NOTIFICATIONS_DESKTOP_SECTION_EARLIER = "Plus tôt";

export const NOTIFICATIONS_DESKTOP_MARK_READ = "Marquer comme lu";
export const NOTIFICATIONS_DESKTOP_ITEM_MENU = "Actions";

export const NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_TITLE = "Résumé";
export const NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_UNREAD = (count: number) =>
  `${count} notification${count > 1 ? "s" : ""} non lue${count > 1 ? "s" : ""}`;
export const NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_DISPLAYED = (
  count: number,
) => `${count} affichée${count > 1 ? "s" : ""} aujourd'hui et cette semaine`;

export const NOTIFICATIONS_DESKTOP_RAIL_DONT_MISS_TITLE = "À ne pas manquer";
export const NOTIFICATIONS_DESKTOP_RAIL_MANAGE_TITLE = "Gérer mes notifications";
export const NOTIFICATIONS_DESKTOP_RAIL_MANAGE_SUBTITLE =
  "Choisissez les activités pour lesquelles vous souhaitez être alerté.";
export const NOTIFICATIONS_DESKTOP_RAIL_OPEN_PREFERENCES = "Ouvrir les préférences";

export const NOTIFICATIONS_DESKTOP_RAIL_PREF_EVENTS = "Sorties enregistrées";
export const NOTIFICATIONS_DESKTOP_RAIL_PREF_TRIBES = "Tribus";
export const NOTIFICATIONS_DESKTOP_RAIL_PREF_PASSPORT = "Passport";
export const NOTIFICATIONS_DESKTOP_RAIL_PREF_CONTRIBUTIONS = "Contributions";

export const NOTIFICATIONS_DESKTOP_RAIL_TRUST_TITLE = "Des alertes utiles, pas de faux signaux";
export const NOTIFICATIONS_DESKTOP_RAIL_TRUST_BODY =
  "Yunicity vous informe uniquement à partir d'activités et de données réelles.";

export const NOTIFICATIONS_DESKTOP_ACTION_VIEW_EVENT = "Voir l'événement";
export const NOTIFICATIONS_DESKTOP_ACTION_OPEN_TRIBE = "Ouvrir la tribu";
export const NOTIFICATIONS_DESKTOP_ACTION_VIEW_CONTRIBUTION = "Voir la contribution";
export const NOTIFICATIONS_DESKTOP_ACTION_VIEW_OFFER = "Voir l'offre";
export const NOTIFICATIONS_DESKTOP_ACTION_VIEW_POST = "Voir la publication";
export const NOTIFICATIONS_DESKTOP_ACTION_VIEW_PASSPORT = "Voir mon Passport";
export const NOTIFICATIONS_DESKTOP_ACTION_VIEW_DETAIL = "Voir le détail";
