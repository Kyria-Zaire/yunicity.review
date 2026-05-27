"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_RELATED_SUBTITLE,
  EVENT_DETAIL_RELATED_TITLE,
  eventAgendaDistrictLine,
  formatEventClockTime,
  formatEventDateRange,
  resolveFeaturedCarouselEventImage,
} from "@yunicity/utils";
import Link from "next/link";

type EventDetailRelatedProps = {
  events: LocalEvent[];
};

export function EventDetailRelated({ events }: EventDetailRelatedProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="event-related-title">
      <header>
        <h2 id="event-related-title" className="text-lg font-bold text-neutral-900">
          {EVENT_DETAIL_RELATED_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{EVENT_DETAIL_RELATED_SUBTITLE}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li key={event.id}>
            <RelatedMomentCard event={event} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RelatedMomentCard({ event }: { event: LocalEvent }) {
  const imageUrl = resolveFeaturedCarouselEventImage(event);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white transition hover:border-neutral-300 hover:shadow-md"
    >
      <CulturalImage
        src={imageUrl}
        alt={event.title}
        placeName={event.title}
        className="aspect-[16/10] w-full"
        sizes="(max-width: 640px) 100vw, 280px"
        showFallbackCaption={false}
      />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 group-hover:text-yunicity-primary">
          {event.title}
        </h3>
        <p className="mt-1.5 text-xs font-semibold tabular-nums text-neutral-700">
          {formatEventClockTime(event.starts_at)}
          <span className="font-normal text-neutral-400"> · </span>
          <span className="font-normal text-neutral-500">
            {formatEventDateRange(event.starts_at, event.ends_at).split(" · ")[0]}
          </span>
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{eventAgendaDistrictLine(event)}</p>
      </div>
    </Link>
  );
}
