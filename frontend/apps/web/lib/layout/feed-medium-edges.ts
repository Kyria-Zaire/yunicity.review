/**
 * Contrat d'alignement des axes du Feed (C3-FEED-M3.1).
 *
 * Règle transversale : tout élément structurant du Feed partage les mêmes axes
 * gauche et droit DANS SA ZONE DE CONTENU DISPONIBLE. « Bout en bout » ne
 * signifie jamais passer sous le rail ou sous un aside — la zone disponible
 * commence après eux.
 *
 * Ce module ne rend rien : il porte la définition testable réutilisée par la
 * spec du header (M3.1) et, plus tard, par la grille de contenu (M4) et les
 * cartes Feed (M8).
 */
export type FeedEdgeZone = "mobile" | "medium" | "desktop";

/** Interprétation de la zone disponible selon le viewport. */
export const FEED_EDGE_ZONE_DEFINITION: Record<FeedEdgeZone, string> = {
  mobile: "limites utiles du viewport mobile (< 640px)",
  medium: "de rail.right + gouttière jusqu'à shell.right − gouttière",
  desktop: "limites de la colonne centrale entre les rails/asides (≥ 1024px)",
};

/** Tolérance d'arrondi subpixel — jamais un moyen de masquer une marge réelle. */
export const FEED_EDGE_TOLERANCE_PX = 1;

/** Un bloc doit occuper au moins cette fraction de la largeur disponible. */
export const FEED_EDGE_MIN_WIDTH_RATIO = 0.998;

/** Un séparateur horizontal doit couvrir au moins cette fraction de son bloc. */
export const FEED_SEPARATOR_MIN_WIDTH_RATIO = 0.99;

export type EdgeBox = { left: number; right: number; width: number };

/**
 * Zone utile medium — définition AUTORITAIRE (C3-FEED-M3.2B).
 *
 * La zone commence après le rail ET la gouttière horizontale du contenu,
 * et se termine avant le bord droit du shell avec la même gouttière.
 */
export const FEED_MEDIUM_CONTENT_GUTTER_PX = 16;

export function mediumContentZone(
  rail: EdgeBox,
  shell: EdgeBox,
  gutterPx = FEED_MEDIUM_CONTENT_GUTTER_PX,
): EdgeBox {
  return {
    left: rail.right + gutterPx,
    right: shell.right - gutterPx,
    width: shell.right - rail.right - gutterPx * 2,
  };
}

/** Les axes gauche/droit coïncident-ils, aux arrondis subpixel près ? */
export function isEdgeAligned(block: EdgeBox, zone: EdgeBox): boolean {
  return (
    Math.abs(block.left - zone.left) <= FEED_EDGE_TOLERANCE_PX &&
    Math.abs(block.right - zone.right) <= FEED_EDGE_TOLERANCE_PX
  );
}

/** Le bloc remplit-il réellement la largeur disponible ? */
export function fillsAvailableWidth(block: EdgeBox, zone: EdgeBox): boolean {
  return zone.width > 0 && block.width / zone.width >= FEED_EDGE_MIN_WIDTH_RATIO;
}

/**
 * Exigences que M4 et M8 devront appliquer aux cartes Feed medium. Enregistrées
 * ici pour qu'elles soient lisibles et vérifiables, PAS encore implémentées.
 */
export const FEED_MEDIUM_CARD_EDGE_REQUIREMENTS = [
  "même bord gauche que le header",
  "même bord droit que le header",
  "largeur uniforme entre cartes",
  "aucune carte arbitrairement plus étroite",
  "séparateurs horizontaux sur toute la largeur de la carte",
  "média autorisé à aller bord à bord DANS la carte",
  "texte et actions conservent leur padding interne",
  "aucune collision avec le rail",
] as const;

/**
 * Contrat enregistré pour le futur chantier desktop (≥ 1280px). Aucune règle
 * CSS desktop n'est créée dans cette passe.
 */
export const DESKTOP_FEED_EDGE_REQUIREMENTS = [
  "mêmes axes pour toute la colonne centrale",
  "médias et séparateurs bord à bord dans cette colonne/carte",
  "aucun passage sous le rail gauche ou l'aside droit",
  "aucune règle medium appliquée au desktop",
] as const;
