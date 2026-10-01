/**
 * Suppression de compte — micro-copy et règles d'affichage (AUTH-02A).
 *
 * Deux principes gouvernent ces textes :
 *
 * - **Dire ce qui se passe réellement.** Le compte n'est pas supprimé
 *   immédiatement : il devient inaccessible et le restera pendant le délai. Rien
 *   n'est effacé tant que ce délai court.
 * - **Ne promettre aucune conformité.** Écrire « conforme RGPD » engagerait une
 *   qualification juridique que l'ingénierie ne peut pas rendre.
 */

export const DELETE_ACCOUNT_TITLE = "Supprimer mon compte";

export const DELETE_ACCOUNT_INTRO =
  "Votre compte deviendra immédiatement inaccessible. Rien n'est effacé pendant le délai qui suit : vous pouvez revenir sur votre décision.";

export const DELETE_ACCOUNT_CONSEQUENCES = [
  "Vous serez déconnecté de tous vos appareils.",
  "Votre profil n'apparaîtra plus dans Yunicity.",
  "Vos publications, commentaires et tribus restent en place pendant le délai.",
  "Votre solde Yuni n'est ni transféré ni remboursé.",
  "Un e-mail vous donnera un lien pour annuler.",
] as const;

export const DELETE_ACCOUNT_PASSWORD_LABEL = "Votre mot de passe";
export const DELETE_ACCOUNT_PASSWORD_HINT =
  "Nous le redemandons parce que cette action est difficile à défaire.";
export const DELETE_ACCOUNT_CONFIRM_LABEL =
  "Je comprends que mon compte deviendra inaccessible.";
export const DELETE_ACCOUNT_SUBMIT = "Demander la suppression";
export const DELETE_ACCOUNT_SUBMITTING = "Envoi de la demande…";
export const DELETE_ACCOUNT_PASSWORD_REQUIRED = "Saisissez votre mot de passe.";
export const DELETE_ACCOUNT_CONFIRM_REQUIRED =
  "Cochez la case de confirmation pour continuer.";

export const DELETE_ACCOUNT_SUCCESS_TITLE = "Demande enregistrée";
export const DELETE_ACCOUNT_CANCEL_HINT =
  "Pour annuler, ouvrez le lien contenu dans l'e-mail que nous venons de vous envoyer.";
export const DELETE_ACCOUNT_CANCEL_HINT_NO_EMAIL =
  "L'envoi de l'e-mail d'annulation est momentanément indisponible. Contactez le support si vous souhaitez revenir sur cette décision.";

/** Jours restants avant l'échéance, jamais négatif. */
export function daysUntilDeletion(scheduledFor: string, now: Date = new Date()): number {
  const echeance = new Date(scheduledFor).getTime();
  if (Number.isNaN(echeance)) return 0;
  const restant = Math.ceil((echeance - now.getTime()) / 86_400_000);
  return Math.max(restant, 0);
}

/** Date d'échéance en français, ou chaîne vide si la valeur est inexploitable. */
export function formatDeletionDate(scheduledFor: string): string {
  const date = new Date(scheduledFor);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * La section doit-elle apparaître ?
 *
 * Tant que le backend ne déclare pas la fonctionnalité, **rien** n'est affiché —
 * ni titre, ni bouton. Annoncer une suppression qu'on ne peut pas exécuter serait
 * une promesse que l'interface ne peut pas tenir.
 */
export function shouldShowAccountDeletion(
  status: { enabled: boolean } | null | undefined,
): boolean {
  return status?.enabled === true;
}
