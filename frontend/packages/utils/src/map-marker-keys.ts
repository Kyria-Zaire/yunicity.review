import type { MapTerritorySelection } from "./map-living-territory";

/** Types de marqueurs de la carte (registre + diff de sélection). */
export type MapMarkerKind = "event" | "place" | "neighborhood" | "tribe" | "partner";

/** Clé stable et unique d'un marqueur carte, ex. "place:le-manege". */
export function mapMarkerKey(kind: MapMarkerKind, id: string): string {
  return `${kind}:${id}`;
}

export type MapMarkerSelectionInputs = {
  selection: MapTerritorySelection | null;
  focusedEventId: string | null;
  selectedCulturalSlug: string | null;
  selectedPartnerSlug: string | null;
};

/**
 * Ensemble des clés de marqueurs qui doivent être en état "actif" (sélectionné / focus), dérivé
 * de la sélection territoriale et des slugs/id de focus.
 *
 * Pur et testable : permet à la carte (T4) de ne mettre à jour QUE les marqueurs dont l'état
 * change entre deux sélections, au lieu de reconstruire tous les marqueurs à chaque clic.
 */
export function resolveActiveMapMarkerKeys(input: MapMarkerSelectionInputs): Set<string> {
  const { selection, focusedEventId, selectedCulturalSlug, selectedPartnerSlug } = input;
  const keys = new Set<string>();

  if (selection) {
    if (selection.kind === "event") {
      keys.add(mapMarkerKey("event", selection.id));
    } else {
      keys.add(mapMarkerKey(selection.kind, selection.slug));
    }
  }
  if (focusedEventId) keys.add(mapMarkerKey("event", focusedEventId));
  if (selectedCulturalSlug) keys.add(mapMarkerKey("place", selectedCulturalSlug));
  if (selectedPartnerSlug) keys.add(mapMarkerKey("partner", selectedPartnerSlug));

  return keys;
}
