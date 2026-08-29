"use client";

import type { LocalEvent } from "@yunicity/types";
import { resolveFeaturedCarouselEventImage } from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

import {
  formatFeedEventInterestLabel,
  formatFeedEventTime,
} from "@/lib/feed/feed-evening-events";
import {
  filterEveningEventsExcludingFeatured,
  shouldHideFeedEveningEventsStrip,
} from "@/lib/feed/feed-featured-event";
import { selectFeedRightRailEveningEvents } from "@/lib/feed/feed-right-rail-modules";

type FeedDesktopEveningEventsStripProps = {
  events: readonly LocalEvent[];
  city: string;
  className?: string;
  /** Surface primaire plate en bande medium (C3-FEED-M3.3). */
  markPrimarySurface?: boolean;
  /** Événement déjà mis en avant sous le bandeau — exclu des colonnes. */
  excludeEventId?: string | null;
};

function EveningEventCover({ event }: { event: LocalEvent }) {
  const imageUrl = resolveFeaturedCarouselEventImage(event);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- couverture événement dynamique
      <img
        src={imageUrl}
        alt=""
        className="h-14 w-[4.75rem] shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div
      className="flex h-14 w-[4.75rem] shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-400"
      aria-hidden
    >
      {event.title.slice(0, 1).toUpperCase()}
    </div>
  );
}

function EveningEventColumn({ event, time }: { event: LocalEvent; time: string | null }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50"
    >
      <div className="flex w-12 shrink-0 items-center justify-center self-stretch border-r border-neutral-200 pr-3">
        {time ? (
          <span className="text-sm font-bold leading-none tabular-nums text-orange-500">{time}</span>
        ) : (
          <span className="text-xs font-semibold text-neutral-400">—</span>
        )}
      </div>

      <EveningEventCover event={event} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
          {event.title}
        </p>
        {event.location_name ? (
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{event.location_name}</p>
        ) : null}
        {typeof event.interest_count === "number" ? (
          <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-neutral-400">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span>{formatFeedEventInterestLabel(event.interest_count)}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function FeedDesktopEveningEventsStrip({
  events,
  city,
  className = "",
  markPrimarySurface = false,
  excludeEventId = null,
}: FeedDesktopEveningEventsStripProps) {
  const { events: displayEvents } = selectFeedRightRailEveningEvents(events);
  const visibleEvents = filterEveningEventsExcludingFeatured(displayEvents, excludeEventId);
  const title = `Ce soir à ${city}`;

  if (shouldHideFeedEveningEventsStrip(displayEvents, excludeEventId)) {
    return null;
  }

  return (
    <section
      className={`feed-desktop-surface overflow-hidden ${className}`}
      data-feed-desktop-evening-events-strip=""
      data-feed-medium-surface={markPrimarySurface ? "primary" : undefined}
      aria-labelledby="feed-evening-events-title"
    >
      <header className="flex items-center justify-between border-b border-neutral-200/90 px-4 pb-3 pt-4">
        <h2 id="feed-evening-events-title" className="text-sm font-bold text-neutral-900">
          {title}
        </h2>
        <Link href="/sortir" className="text-xs font-medium text-yunicity-primary hover:underline">
          Tout voir
        </Link>
      </header>

      {visibleEvents.length === 0 ? (
        <p className="px-4 py-4 text-sm leading-relaxed text-neutral-500">
          Aucun événement prévu pour le moment.{" "}
          <Link href="/sortir" className="font-medium text-yunicity-primary hover:underline">
            Explorer Sortir
          </Link>
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-200 xl:grid xl:grid-cols-3 xl:divide-x xl:divide-y-0">
          {visibleEvents.map((event) => (
            <EveningEventColumn key={event.id} event={event} time={formatFeedEventTime(event)} />
          ))}
        </div>
      )}
    </section>
  );
}
