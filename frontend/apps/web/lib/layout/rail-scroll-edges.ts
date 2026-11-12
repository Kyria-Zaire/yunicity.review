/**
 * RAIL-SHORT-VIEWPORT-01 — côtés d'un conteneur défilant qui cachent du contenu.
 *
 * Logique pure, sans DOM : le hook `useScrollEdges` lui passe les dimensions
 * lues sur l'élément. Un repère n'est affiché que du côté où du contenu reste
 * caché, jamais quand tout tient dans la zone.
 */

export type ScrollEdges = {
  /** Du contenu est caché au-dessus de la zone visible. */
  above: boolean;
  /** Du contenu est caché au-dessous de la zone visible. */
  below: boolean;
};

export type ScrollMetrics = {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
};

export const NO_SCROLL_EDGES: ScrollEdges = { above: false, below: false };

/**
 * Tolérance d'un pixel : les mises en page fractionnaires (zoom, `dvh`) laissent
 * des restes inférieurs au pixel qui ne cachent aucun contenu réel.
 */
const EDGE_TOLERANCE_PX = 1;

export function computeScrollEdges({ scrollTop, clientHeight, scrollHeight }: ScrollMetrics): ScrollEdges {
  if (clientHeight <= 0 || scrollHeight - clientHeight <= EDGE_TOLERANCE_PX) return NO_SCROLL_EDGES;
  return {
    above: scrollTop > EDGE_TOLERANCE_PX,
    below: scrollTop + clientHeight < scrollHeight - EDGE_TOLERANCE_PX,
  };
}

export function sameScrollEdges(a: ScrollEdges, b: ScrollEdges): boolean {
  return a.above === b.above && a.below === b.below;
}
