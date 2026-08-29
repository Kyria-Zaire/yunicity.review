/**
 * Ossature éditoriale du Feed medium (C3-FEED-M4).
 *
 * Cinq régions ordonnées composent la voie principale entre 640 et 1023,98 px.
 * La vidéo locale et les modules contextuels sont des items du `stream`.
 * Elles sont identifiées par un marqueur explicite `data-feed-medium-region`,
 * jamais par `nth-child`, profondeur DOM, balise ou texte visible.
 *
 * Région éditoriale ≠ surface primaire : une région est une case de la grille
 * verticale, une surface (`data-feed-medium-surface="primary"`) est un rectangle
 * visuel plat. Un même élément peut porter les deux quand il est à la fois la
 * région et son unique surface — c'est le cas de `stories`.
 */
export const FEED_MEDIUM_REGIONS = [
  "stories",
  "composer",
  "evening-events",
  "featured-event",
  "stream",
] as const;

export type FeedMediumRegion = (typeof FEED_MEDIUM_REGIONS)[number];

/** Ce que chaque région porte — documenté pour les tickets M5 à M9. */
export const FEED_MEDIUM_REGION_CONTENT: Record<FeedMediumRegion, string> = {
  stories: "Moments près de vous",
  composer: "création de publication",
  "evening-events": "Ce soir à venir",
  "featured-event": "événement éditorial mis en avant",
  stream: "publications et publication vidéo locale, ou état filtré/vide alternatif",
};

/** Rang éditorial d'une région — l'ordre de lecture suit l'ordre du DOM. */
export function feedMediumRegionOrder(region: FeedMediumRegion): number {
  return FEED_MEDIUM_REGIONS.indexOf(region);
}

/** La séquence observée respecte-t-elle l'ordre éditorial, sans doublon ? */
export function isFeedMediumRegionSequenceValid(sequence: readonly string[]): boolean {
  if (sequence.length !== FEED_MEDIUM_REGIONS.length) return false;
  if (new Set(sequence).size !== sequence.length) return false;
  return sequence.every((region, index) => region === FEED_MEDIUM_REGIONS[index]);
}
