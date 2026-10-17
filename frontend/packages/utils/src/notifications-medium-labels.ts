/** Copy UI — Notifications medium (MEDIUM-NOTIFICATIONS-01). */

export const NOTIFICATIONS_MEDIUM_SUMMARY_DISPLAYED = (count: number) =>
  `${count} notification${count > 1 ? "s" : ""} affichée${count > 1 ? "s" : ""}`;

export const NOTIFICATIONS_MEDIUM_SUMMARY_EMPTY_EVENT = "Aucune sortie à venir";
export const NOTIFICATIONS_MEDIUM_SUMMARY_EMPTY_OFFER = "Aucune offre urgente";
