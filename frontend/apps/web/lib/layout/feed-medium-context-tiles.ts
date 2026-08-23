/**
 * Contrat des tuiles de contexte local Feed medium (C3-FEED-M9).
 *
 * Source unique des identités `data-feed-medium-context-tile`. L'ordre de
 * lecture suit l'ordre du DOM — aucun `order` CSS, aucun sélecteur `nth-child`.
 */
export const FEED_MEDIUM_CONTEXT_TILES = [
  "privilege",
  "tribes",
  "must-see",
  "local-now",
] as const;

export type FeedMediumContextTile = (typeof FEED_MEDIUM_CONTEXT_TILES)[number];

/** Libellés de diagnostic — jamais utilisés comme sélecteur principal. */
export const FEED_MEDIUM_CONTEXT_TILE_LABELS: Record<FeedMediumContextTile, string> = {
  privilege: "Privilège local",
  tribes: "Dans vos tribus",
  "must-see": "À ne pas manquer",
  "local-now": "En ce moment à",
};

/** Gap unique de la mosaïque context (égal horizontal et vertical). */
export const FEED_MEDIUM_CONTEXT_GAP_PX = 16;

/** Padding interne commun des quatre tuiles (mesure RED = 16 px). */
export const FEED_MEDIUM_CONTEXT_PADDING_PX = 16;

export const FEED_MEDIUM_CONTEXT_GAP_CSS_VAR = "--feed-medium-context-gap";
export const FEED_MEDIUM_CONTEXT_PADDING_CSS_VAR = "--feed-medium-context-padding";

/** La séquence observée respecte-t-elle l'ordre autoritaire, sans doublon ? */
export function isFeedMediumContextTileSequenceValid(sequence: readonly string[]): boolean {
  if (sequence.length !== FEED_MEDIUM_CONTEXT_TILES.length) return false;
  if (new Set(sequence).size !== sequence.length) return false;
  return sequence.every((tile, index) => tile === FEED_MEDIUM_CONTEXT_TILES[index]);
}
