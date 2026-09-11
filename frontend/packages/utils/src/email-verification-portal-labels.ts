/** Confirmation d'adresse e-mail — micro-copy (AUTH-01). */

export const VERIFY_EMAIL_PAGE_TITLE = "Confirmez votre adresse";
export const VERIFY_EMAIL_CHECKING_TITLE = "Confirmation en cours";
export const VERIFY_EMAIL_CHECKING_BODY = "Un instant, nous validons votre lien…";

export const VERIFY_EMAIL_SUCCESS_TITLE = "Adresse confirmée";
export const VERIFY_EMAIL_SUCCESS_BODY =
  "Votre adresse e-mail est confirmée.\nVous pouvez maintenant vous connecter.";
export const VERIFY_EMAIL_LOGIN_CTA = "Se connecter";

/** État post-inscription : le compte existe, le lien vient de partir. */
export const VERIFY_EMAIL_PENDING_TITLE = "Vérifiez votre boîte de réception";
export const VERIFY_EMAIL_PENDING_BODY =
  "Nous venons de vous envoyer un lien de confirmation. Ouvrez-le pour activer votre compte.";
export const VERIFY_EMAIL_PENDING_HINT =
  "Rien reçu au bout de quelques minutes ? Pensez à regarder dans les indésirables.";

export const VERIFY_EMAIL_INVALID_TITLE = "Lien invalide";
export const VERIFY_EMAIL_EXPIRED_TITLE = "Lien expiré";
export const VERIFY_EMAIL_ALREADY_USED_TITLE = "Lien déjà utilisé";

export const VERIFY_EMAIL_INVALID_BODY =
  "Ce lien de confirmation n'est pas valide. Demandez-en un nouveau ci-dessous.";
export const VERIFY_EMAIL_EXPIRED_BODY =
  "Ce lien a expiré. Demandez-en un nouveau ci-dessous, il reste valable 24 heures.";
export const VERIFY_EMAIL_ALREADY_USED_BODY =
  "Ce lien a déjà servi. Si votre adresse est confirmée, connectez-vous directement.";
export const VERIFY_EMAIL_FAILURE_BODY =
  "La confirmation n'a pas abouti. Réessayez ou demandez un nouveau lien.";

export const VERIFY_EMAIL_RESEND_FIELD = "Votre adresse e-mail";
export const VERIFY_EMAIL_RESEND_PLACEHOLDER = "vous@exemple.fr";
export const VERIFY_EMAIL_RESEND_SUBMIT = "Recevoir un nouveau lien";
export const VERIFY_EMAIL_RESEND_SUBMITTING = "Envoi…";
export const VERIFY_EMAIL_RESEND_VALIDATION_EMAIL = "Indiquez une adresse e-mail valide.";

/**
 * Confirmation du renvoi, volontairement identique quelle que soit l'issue.
 *
 * Ne jamais la remplacer par un message qui distinguerait « adresse connue » de
 * « adresse inconnue » : ce serait offrir un moyen d'énumérer les comptes. Le
 * backend applique la même règle.
 */
export const VERIFY_EMAIL_RESEND_DONE =
  "Si un compte non vérifié existe avec cette adresse, vous allez recevoir un e-mail de confirmation.";

export const VERIFY_EMAIL_LOGIN_LINK = "Retour à la connexion";

/** Connexion refusée faute de confirmation (code EMAIL_NOT_VERIFIED). */
export const LOGIN_EMAIL_NOT_VERIFIED =
  "Confirmez votre adresse e-mail pour accéder à votre compte. Vérifiez votre boîte de réception, ou demandez un nouveau lien.";

/** Invitation NON bloquante, pour les comptes antérieurs à l'exigence. */
export const VERIFY_EMAIL_BANNER_TITLE = "Confirmez votre adresse e-mail";
export const VERIFY_EMAIL_BANNER_BODY =
  "Votre compte reste accessible. Confirmer votre adresse sécurise la récupération de votre compte.";
export const VERIFY_EMAIL_BANNER_CTA = "Confirmer mon adresse";
export const VERIFY_EMAIL_BANNER_DISMISS = "Plus tard";
