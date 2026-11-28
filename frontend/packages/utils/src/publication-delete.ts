import { isAuthError } from "./auth/auth-errors";

/**
 * Suppression d'une publication par son auteur — PROFILE-POST-MENU-01.
 *
 * ── Portée EXACTE de l'action, à ne pas écrire autrement ─────────────────────
 * `DELETE /api/v1/posts/{id}` est une suppression DOUCE côté serveur :
 * `post.is_active = False` (`post_service.soft_delete_post`). La ligne RESTE en
 * base, et les fichiers médias RESTENT stockés — aucune purge n'existe.
 *
 * Ce qui change réellement :
 *   • la publication quitte le fil et le profil (lectures en `active_only`) ;
 *   • `GET /posts/{id}` répond `404` ;
 *   • l'auteur conserve l'accès à ses fichiers par URL directe.
 *
 * Le libellé utilisateur dit donc « disparaît » et « ne pourra pas être
 * rétablie » — ce qui est vrai de l'interface — et ne promet NI effacement des
 * fichiers, NI suppression définitive des données.
 */

/** Intitulé de l'action, dans le menu de débordement comme dans la confirmation. */
export const PUBLICATION_DELETE_ACTION = "Supprimer";

/** Titre de la section « propriétaire » du menu de débordement. */
export const PUBLICATION_DELETE_MENU_SECTION = "Ma publication";

export const PUBLICATION_DELETE_CONFIRM_TITLE = "Supprimer cette publication ?";

export const PUBLICATION_DELETE_CONFIRM_BODY =
  "Elle disparaîtra du fil et de votre profil. Vous ne pourrez pas la rétablir.";

export const PUBLICATION_DELETE_CONFIRM_CANCEL = "Annuler";

export const PUBLICATION_DELETE_PENDING = "Suppression…";

export const PUBLICATION_DELETE_DONE = "Publication supprimée.";

export const PUBLICATION_DELETE_ERROR_FORBIDDEN =
  "Vous ne pouvez supprimer que vos propres publications.";

export const PUBLICATION_DELETE_ERROR_GONE = "Cette publication n'existe plus.";

export const PUBLICATION_DELETE_ERROR_SESSION =
  "Votre session a expiré. Reconnectez-vous puis réessayez.";

export const PUBLICATION_DELETE_ERROR_GENERIC =
  "La suppression a échoué. Réessayez dans un instant.";

/**
 * Message utilisateur pour un échec de suppression.
 *
 * Les quatre cas distingués sont ceux que le backend produit réellement :
 * `403 FORBIDDEN` (ni auteur ni modérateur), `404 POST_NOT_FOUND` (déjà
 * supprimée), `401` (session expirée), et tout le reste. Le code d'erreur est
 * lu AVANT le statut : un code stable survit à un changement de statut.
 */
export function humanizePublicationDeleteFailure(error: unknown): string {
  if (!isAuthError(error)) {
    return PUBLICATION_DELETE_ERROR_GENERIC;
  }
  if (error.code === "POST_NOT_FOUND" || error.status === 404) {
    return PUBLICATION_DELETE_ERROR_GONE;
  }
  if (error.code === "FORBIDDEN" || error.status === 403) {
    return PUBLICATION_DELETE_ERROR_FORBIDDEN;
  }
  if (error.status === 401) {
    return PUBLICATION_DELETE_ERROR_SESSION;
  }
  return PUBLICATION_DELETE_ERROR_GENERIC;
}
