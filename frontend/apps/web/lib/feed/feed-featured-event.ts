import type { LocalEvent } from "@yunicity/types";

import { selectFeedRightRailEveningEvents } from "@/lib/feed/feed-right-rail-modules";

function scoreFeaturedCandidate(event: LocalEvent): number {
  let score = 0;
  if (event.description?.trim()) score += 2;
  if (event.cover_image_url) score += 2;
  if (typeof event.interest_count === "number" && event.interest_count > 0) score += 1;
  return score;
}

/**
 * Choisit l'événement mis en avant sous le bandeau « Ce soir à … ».
 * Priorité : couverture + description, puis ordre chronologique du rail soirée.
 */
export function selectFeedFeaturedEvent(
  events: readonly LocalEvent[],
  now: Date = new Date(),
): LocalEvent | null {
  const { events: candidates } = selectFeedRightRailEveningEvents(events, now);
  if (candidates.length === 0) return null;

  return [...candidates]
    .sort(
      (a, b) =>
        scoreFeaturedCandidate(b) - scoreFeaturedCandidate(a) ||
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
    .at(0) ?? null;
}

export function filterEveningEventsExcludingFeatured(
  events: readonly LocalEvent[],
  featuredEventId: string | null,
): LocalEvent[] {
  if (!featuredEventId) return [...events];
  const filtered = events.filter((event) => event.id !== featuredEventId);
  // Garde le bandeau peuplé quand il reste d'autres événements ce soir.
  return filtered.length > 0 ? filtered : [...events];
}

/** Le bandeau « Ce soir » doit-il être masqué (carte à la une suffit) ? */
export function shouldHideFeedEveningEventsStrip(
  displayEvents: readonly LocalEvent[],
  featuredEventId: string | null,
): boolean {
  if (!featuredEventId || displayEvents.length === 0) return false;
  const withoutFeatured = displayEvents.filter((event) => event.id !== featuredEventId);
  // Un seul événement ce soir : il vit dans la carte éditoriale, pas dans un bandeau vide.
  return withoutFeatured.length === 0;
}
