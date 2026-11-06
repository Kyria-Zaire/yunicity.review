/** Mon agenda — micro-copy (SORTIR-AGENDA-01). */

export const MY_AGENDA_HREF = "/sortir/agenda";
export const MY_AGENDA_BACK = "Retour à Sortir";
export const MY_AGENDA_TITLE = "Mon agenda";
export const MY_AGENDA_KICKER = "Vos sorties enregistrées";
export const MY_AGENDA_SUBTITLE = (city: string) =>
  `Les moments que vous avez gardés à ${city} — prêts à y aller.`;

export const MY_AGENDA_COUNT = (count: number) =>
  count <= 0
    ? "Aucune sortie"
    : count === 1
      ? "1 sortie à venir"
      : `${count} sorties à venir`;

export const MY_AGENDA_GROUP_TODAY = "Aujourd’hui";
export const MY_AGENDA_GROUP_TOMORROW = "Demain";
export const MY_AGENDA_GROUP_WEEK = "Cette semaine";
export const MY_AGENDA_GROUP_LATER = "Plus tard";

export const MY_AGENDA_VIEW_EVENT = "Voir l’événement";
export const MY_AGENDA_REMOVE = "Retirer";
export const MY_AGENDA_REMOVE_ARIA = "Retirer de mon agenda";
export const MY_AGENDA_OPEN_MAP = "Sur la carte";

export const MY_AGENDA_EMPTY_TITLE = "Votre agenda est encore libre";
export const MY_AGENDA_EMPTY_BODY =
  "Enregistrez une sortie depuis Sortir ou une fiche événement — elle apparaîtra ici, classée par date.";
export const MY_AGENDA_EMPTY_CTA = "Explorer Sortir";

export const MY_AGENDA_GUEST_TITLE = "Connectez-vous pour voir votre agenda";
export const MY_AGENDA_GUEST_BODY =
  "Vos sorties enregistrées vous suivent sur mobile, tablette et desktop.";
export const MY_AGENDA_GUEST_CTA = "Se connecter";

export const MY_AGENDA_LOADING = "Chargement de votre agenda…";
export const MY_AGENDA_ERROR = "Impossible de charger votre agenda pour le moment.";
export const MY_AGENDA_RETRY = "Réessayer";

export const MY_AGENDA_TIP_TITLE = "Astuce locale";
export const MY_AGENDA_TIP_BODY =
  "Ajoutez une sortie depuis une fiche événement avec « Ajouter à mon agenda ». Elle reste synchronisée partout.";
export const MY_AGENDA_EXPLORE_TITLE = "Envie d’autre chose ?";
export const MY_AGENDA_EXPLORE_CTA = "Découvrir d’autres sorties";
