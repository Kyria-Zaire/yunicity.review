import type { LocalVideoFeedItem } from "@yunicity/types";

import type { MapTerritorySelection } from "./map-living-territory";

export const LOCAL_VIDEO_TEASER_MAX = 3;
export const LOCAL_VIDEO_TEASER_FETCH_LIMIT = 20;

export const LOCAL_VIDEO_TEASER_CTA = "Voir la vidéo";
export const LOCAL_VIDEO_TEASER_SECTION_FEED = "Vidéos près de chez vous";
export const LOCAL_VIDEO_TEASER_SECTION_PLACE = "Vidéos de ce lieu";
export const LOCAL_VIDEO_TEASER_SECTION_NEIGHBORHOOD = "Vidéos du quartier";
export const LOCAL_VIDEO_TEASER_SECTION_EVENT = "Vidéos de l'événement";

// Etat vide de la fiche quartier : un quartier sans vidéo n'est pas une
// erreur, c'est une invitation.
export const LOCAL_VIDEO_TEASER_NEIGHBORHOOD_EMPTY =
  "Aucune vidéo de ce quartier pour le moment.";

export type LocalVideoTeaserFilter =
  | { kind: "city" }
  | { kind: "place"; culturalPlaceSlug: string }
  | { kind: "neighborhood"; neighborhoodSlug: string }
  | { kind: "event"; localEventId: string };

/**
 * Sélection de la carte → filtre de teaser (VIDEO-03-TEASERS-03).
 *
 * La carte tient déjà une sélection servie par le backend : ce n'est qu'un
 * changement de vocabulaire, aucun slug n'est deviné et aucune géographie n'est
 * reconstruite côté client.
 *
 * Une tribu ne porte pas de vidéo : plutôt qu'un filtre qui renverrait un
 * résultat arbitraire, on ne produit rien et le teaser reste masqué.
 */
export function buildLocalVideoTeaserFilterFromMapSelection(
  selection: MapTerritorySelection | null,
): LocalVideoTeaserFilter | null {
  if (!selection) return null;
  switch (selection.kind) {
    case "place":
      return { kind: "place", culturalPlaceSlug: selection.slug };
    case "neighborhood":
      return { kind: "neighborhood", neighborhoodSlug: selection.slug };
    case "event":
      return { kind: "event", localEventId: selection.id };
    case "tribe":
    default:
      return null;
  }
}

export function buildLocalVideoTeaserHref(videoId: string): string {
  return `/videos?video=${encodeURIComponent(videoId)}`;
}

export function filterLocalVideoTeasers(
  items: readonly LocalVideoFeedItem[],
  filter: LocalVideoTeaserFilter,
  max: number = LOCAL_VIDEO_TEASER_MAX,
): LocalVideoFeedItem[] {
  let filtered: LocalVideoFeedItem[];
  switch (filter.kind) {
    case "place":
      filtered = items.filter((item) => item.cultural_place_slug === filter.culturalPlaceSlug);
      break;
    case "neighborhood":
      filtered = items.filter((item) => item.neighborhood_slug === filter.neighborhoodSlug);
      break;
    case "event":
      filtered = items.filter((item) => item.local_event_id === filter.localEventId);
      break;
    case "city":
    default:
      filtered = [...items];
  }
  return filtered.slice(0, max);
}

export function formatLocalVideoDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  if (minutes <= 0) return `${remainder}s`;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function resolveLocalVideoTeaserTitle(item: LocalVideoFeedItem): string {
  return (
    item.title?.trim() ||
    item.cultural_place_name?.trim() ||
    item.description?.trim()?.slice(0, 80) ||
    "Vidéo locale"
  );
}

export function reorderLocalVideoFeedForFocus(
  items: readonly LocalVideoFeedItem[],
  focusVideoId: string | null | undefined,
): LocalVideoFeedItem[] {
  if (!focusVideoId) return [...items];
  const index = items.findIndex((item) => item.id === focusVideoId);
  if (index <= 0) return [...items];
  const next = [...items];
  const target = next[index];
  if (!target) return [...items];
  next.splice(index, 1);
  return [target, ...next];
}
