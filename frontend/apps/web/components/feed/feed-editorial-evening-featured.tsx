"use client";

import type { LocalEvent } from "@yunicity/types";

import { FeedDesktopEveningEventsStrip } from "@/components/feed/desktop/feed-desktop-evening-events-strip";
import { FeedDesktopFeaturedEventCard } from "@/components/feed/desktop/feed-desktop-featured-event-card";
import { selectFeedFeaturedEvent } from "@/lib/feed/feed-featured-event";

type FeedEditorialEveningFeaturedProps = {
  events: readonly LocalEvent[];
  city: string;
  markPrimarySurface?: boolean;
  className?: string;
};

/**
 * Bandeau « Ce soir » + carte événement éditoriale — partagé aux trois paliers.
 *
 * L'écart entre les deux blocs est nul sous 1280px (rendu mobile/medium validé)
 * et vaut 20px au-delà, comme la colonne Desktop d'origine : porté par
 * `.feed-editorial-evening-featured` dans `globals.css`, pas ici.
 */
export function FeedEditorialEveningFeatured({
  events,
  city,
  markPrimarySurface = false,
  className,
}: FeedEditorialEveningFeaturedProps) {
  const featuredEvent = selectFeedFeaturedEvent(events);

  return (
    <div className={`feed-editorial-evening-featured${className ? ` ${className}` : ""}`}>
      <div data-feed-medium-region="evening-events">
        <FeedDesktopEveningEventsStrip
          events={events}
          city={city}
          markPrimarySurface={markPrimarySurface}
          excludeEventId={featuredEvent?.id ?? null}
        />
      </div>
      {featuredEvent ? (
        <div data-feed-medium-region="featured-event">
          <FeedDesktopFeaturedEventCard event={featuredEvent} markPrimarySurface={markPrimarySurface} />
        </div>
      ) : null}
    </div>
  );
}
