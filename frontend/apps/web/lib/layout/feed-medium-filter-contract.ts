/**
 * Contrat du filtre Feed medium (C3-FEED-M10).
 *
 * Dimension réelle unique : le basculement client « centres d'intérêt du
 * profil » déjà appliqué par `filterFeedPostsByView` lorsque la vue est
 * `for_you`. Aucun critère inventé (ville, distance, date, type, popularité).
 *
 * Pur : aucun DOM, breakpoint, composant ou CSS.
 */

/** Identité unique du critère réellement supporté. */
export const FEED_MEDIUM_FILTER_CRITERION_IDS = ["profile-interests"] as const;

export type FeedMediumFilterCriterionId =
  (typeof FEED_MEDIUM_FILTER_CRITERION_IDS)[number];

export const FEED_MEDIUM_FILTER_CRITERION_LABELS: Record<
  FeedMediumFilterCriterionId,
  string
> = {
  "profile-interests": "Centres d'intérêt du profil",
};

export const FEED_MEDIUM_FILTER_PANEL_TITLE = "Filtrer le fil";

export const FEED_MEDIUM_FILTER_CLOSE_LABEL = "Fermer";

export const FEED_MEDIUM_FILTER_RESET_LABEL = "Réinitialiser";

/**
 * Le filtre est actif dès que l'utilisateur l'a activé ET que le profil
 * expose au moins un centre d'intérêt reconnu. Sans intérêt, l'activation
 * n'applique aucune transformation (comportement historique).
 */
export function isFeedMediumInterestFilterActive(input: {
  activated: boolean;
  interests: readonly string[];
}): boolean {
  return input.activated && input.interests.length > 0;
}

/**
 * Nombre de critères actifs. Dimension unique booléenne : 0 ou 1.
 * Ne pas confondre avec le nombre d'intérêts du profil.
 */
export function countFeedMediumActiveFilterCriteria(input: {
  activated: boolean;
  interests: readonly string[];
}): number {
  return isFeedMediumInterestFilterActive(input) ? 1 : 0;
}

/** Politique de réinitialisation : désactiver le critère unique. */
export function resetFeedMediumFilterActivation(): false {
  return false;
}
