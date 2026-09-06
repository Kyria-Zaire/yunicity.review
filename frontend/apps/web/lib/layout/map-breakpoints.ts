/**
 * Breakpoints canoniques de la Carte — alignés Feed R4 et `videos-breakpoints`.
 *
 * Mobile ≤639 · Medium 640–1023 · Desktop ≥1024.
 *
 * La VISIBILITÉ des trois arbres reste portée par Tailwind dans les écrans
 * (`sm:hidden`, `sm:block lg:hidden`, `lg:grid`). Ces constantes ne pilotent que
 * le CYCLE DE VIE de l'instance Google Maps : un arbre masqué par `display:none`
 * est tout de même monté par React, et `GoogleEventMap` instancie la carte dès son
 * montage. Sans palier, deux instances coexistaient au-dessus de 640px — ce que
 * T2 (instance unique) et T5 (chargement unique) avaient fermé.
 *
 * Le palier ne touche NI la source des données NI le déclenchement des fetchs :
 * events, lieux culturels, partenaires et transit sont chargés une fois par ville
 * dans `EventMapScreen`, parent stable des trois variantes.
 */

export const MAP_VIEWPORT_MOBILE_MAX_PX = 639;
export const MAP_VIEWPORT_MEDIUM_MIN_PX = 640;
export const MAP_VIEWPORT_MEDIUM_MAX_PX = 1023;
export const MAP_VIEWPORT_DESKTOP_MIN_PX = 1024;

export const MAP_VIEWPORT_MOBILE_MEDIA = `(max-width: ${MAP_VIEWPORT_MOBILE_MAX_PX}.98px)` as const;
export const MAP_VIEWPORT_MEDIUM_MEDIA =
  `(min-width: ${MAP_VIEWPORT_MEDIUM_MIN_PX}px) and (max-width: ${MAP_VIEWPORT_MEDIUM_MAX_PX}.98px)` as const;
export const MAP_VIEWPORT_DESKTOP_MEDIA =
  `(min-width: ${MAP_VIEWPORT_DESKTOP_MIN_PX}px)` as const;

export type MapViewportTier = "mobile" | "medium" | "desktop";

/**
 * Palier d'une largeur donnée. Fonction pure et totale : aucune largeur ne tombe
 * entre deux paliers, y compris les valeurs fractionnaires (zoom navigateur, DPR
 * non entier) qui avaient déjà produit une zone morte sur le chrome mobile.
 */
export function resolveMapViewportTier(width: number): MapViewportTier {
  if (width >= MAP_VIEWPORT_DESKTOP_MIN_PX) return "desktop";
  if (width >= MAP_VIEWPORT_MEDIUM_MIN_PX) return "medium";
  return "mobile";
}
