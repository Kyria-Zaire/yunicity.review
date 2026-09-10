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
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

/**
 * Bandeau « Ce soir » + carte événement éditoriale de la colonne centrale.
 *
 * FEED-MAIN-LAYOUT-UIUX-01 §5 : à partir de 1024px le volet droit devient la
 * position principale de l'agenda, et ce bloc est masqué par
 * `.feed-editorial-evening-featured` dans `globals.css` — sans quoi les mêmes
 * événements seraient affichés deux fois sur le même écran. Il ne subsiste donc
 * qu'en mobile et medium, où l'écart entre bandeau et carte est nul.
 */
export function FeedEditorialEveningFeatured({
  events,
  city,
  markPrimarySurface = false,
  className,
  loading = false,
  error = false,
  onRetry,
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
          loading={loading}
          error={error}
          onRetry={onRetry}
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
