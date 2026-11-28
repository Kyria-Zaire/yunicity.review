/**
 * FEED-NEW-UX-01 — portes de publication et libellés d'arbitrage, hors React.
 *
 * Extrait de `use-new-post-draft` : ces règles sont des fonctions pures du
 * brouillon, elles n'ont besoin d'aucun état React, et le hook dépassait la
 * limite de taille du projet.
 *
 * TODO(debt): `publishBlockReason` et `mediaResolution` servent l'écran
 * `/feed/new` ACTUEL. Le lot UI de FEED-NEW-UX-01 les remplace par les libellés
 * `POST_NEW_REJECTED_*` ; ce module disparaîtra alors avec eux.
 */

import type { PostFormatId, PostVisibilityId } from "@yunicity/types";
import {
  COMPOSER_MEDIA_CONTINUE_WITHOUT_MEDIA,
  COMPOSER_MEDIA_CONTINUE_WITHOUT_MEDIA_HINT,
  COMPOSER_MEDIA_IGNORE_REJECTED,
  COMPOSER_MEDIA_IGNORE_REJECTED_HINT,
  POST_COMPOSER_BODY_MAX,
  POST_NEW_BODY_REQUIRED,
  POST_NEW_POLL_MIN_OPTIONS,
} from "@yunicity/utils";

export type MediaResolutionLabels = { continueLabel: string; hint: string };

/**
 * Libellés de l'arbitrage, calculés sur ce qui reste RÉELLEMENT attaché.
 *
 * Annoncer « Continuer sans image » alors que deux photos valides restent
 * jointes décrirait l'inverse de ce qui se produit — et l'écran accepte aussi
 * des vidéos, d'où « média » plutôt qu'« image ».
 */
export function mediaResolutionLabels(hasRemainingMedia: boolean): MediaResolutionLabels {
  return hasRemainingMedia
    ? { continueLabel: COMPOSER_MEDIA_IGNORE_REJECTED, hint: COMPOSER_MEDIA_IGNORE_REJECTED_HINT }
    : {
        continueLabel: COMPOSER_MEDIA_CONTINUE_WITHOUT_MEDIA,
        hint: COMPOSER_MEDIA_CONTINUE_WITHOUT_MEDIA_HINT,
      };
}

export type PublishGateInput = {
  charCount: number;
  format: PostFormatId;
  pollOptions: readonly string[];
  /** Motif du dernier fichier refusé à la sélection, ou `null`. */
  rejectionReason: string | null;
  canPublish: boolean;
  visibility: PostVisibilityId;
  audienceCount: number;
};

/**
 * Ce qui empêche de publier, en français, ou `null` si rien n'empêche.
 *
 * Un fichier refusé à la sélection bloque : publier sans l'avoir arbitré
 * enverrait une publication amputée de ce que l'utilisateur croit joindre.
 */
export function publishBlockReason(input: PublishGateInput): string | null {
  if (input.charCount > POST_COMPOSER_BODY_MAX) {
    return `Texte limité à ${POST_COMPOSER_BODY_MAX} caractères.`;
  }
  if (input.format === "poll") {
    const options = input.pollOptions.map((item) => item.trim()).filter(Boolean);
    if (options.length < 2) return POST_NEW_POLL_MIN_OPTIONS;
  }
  if (input.rejectionReason !== null) return input.rejectionReason;
  if (!input.canPublish) return POST_NEW_BODY_REQUIRED;
  if (input.visibility === "custom" && input.audienceCount === 0) {
    return "Sélectionnez au moins une personne pour une audience personnalisée.";
  }
  return null;
}
