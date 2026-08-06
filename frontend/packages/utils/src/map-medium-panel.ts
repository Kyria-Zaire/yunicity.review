/**
 * Panneau contextuel actif dans le format carte MEDIUM (640–1279px) — source de vérité unique.
 *
 * Deux surfaces mutuellement exclusives (T6) : le drawer Filtres (modal, gauche) est prioritaire ;
 * sinon, s'il y a une sélection à détailler, le drawer Détail (non-modal, droite) ; sinon rien.
 * Dérivé des états existants (`filtersOpen`, présence d'un détail) — pas de 2ᵉ source concurrente.
 */
export type MapMediumPanel = "filters" | "detail" | "none";

export function resolveMapMediumPanel(input: {
  filtersOpen: boolean;
  hasDetail: boolean;
}): MapMediumPanel {
  if (input.filtersOpen) return "filters";
  if (input.hasDetail) return "detail";
  return "none";
}
