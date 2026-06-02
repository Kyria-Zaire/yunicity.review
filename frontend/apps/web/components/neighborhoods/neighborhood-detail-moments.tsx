"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  EVENT_INTEREST_SAVED,
  NEIGHBORHOOD_DETAIL_MOMENTS_CALM,
  NEIGHBORHOOD_DETAIL_MOMENTS_SUBTITLE,
  NEIGHBORHOOD_DETAIL_MOMENTS_TITLE,
  NEIGHBORHOOD_DETAIL_MOMENT_INTEREST,
  NEIGHBORHOOD_DETAIL_MOMENT_VIEW,
  eventAgendaVibeLine,
  formatEventClockTime,
  formatEventDateRange,
  resolveEventHeroImage,
} from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

type NeighborhoodDetailMomentsProps = {
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  onInterestChange?: (eventId: string, interested: boolean) => void;
};

export function NeighborhoodDetailMoments({
  events,
  culturalPlaces,
  onInterestChange,
}: NeighborhoodDetailMomentsProps) {
  return (
    <section
      id="neighborhood-moments"
      className="scroll-mt-28 space-y-4"
      aria-labelledby="hood-moments-title"
    >
      <header>
        <h2 id="hood-moments-title" className="text-lg font-bold text-neutral-900">
          {NEIGHBORHOOD_DETAIL_MOMENTS_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {events.length > 0 ? NEIGHBORHOOD_DETAIL_MOMENTS_SUBTITLE : NEIGHBORHOOD_DETAIL_MOMENTS_CALM}
        </p>
      </header>

      {events.length === 0 ? null : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <li key={event.id}>
              <MomentCompactCard
                event={event}
                culturalPlaces={culturalPlaces}
                onInterestChange={onInterestChange}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MomentCompactCard({
  event,
  culturalPlaces,
  onInterestChange,
}: {
  event: LocalEvent;
  culturalPlaces: CulturalPlaceListItem[];
  onInterestChange?: (eventId: string, interested: boolean) => void;
}) {
  const api = useYunicityApi();
  const [interested, setInterested] = useState(event.interested_by_me);
  const [toggling, setToggling] = useState(false);
  const imageUrl = resolveEventHeroImage(event, culturalPlaces);

  async function handleInterest() {
    setToggling(true);
    try {
      const result = await api.events.toggleInterest(event.id);
      setInterested(result.interested);
      onInterestChange?.(event.id, result.interested);
    } finally {
      setToggling(false);
    }
  }

  return (
    <article className="flex gap-3 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-3 transition hover:border-neutral-300 hover:shadow-sm">
      <CulturalImage
        src={imageUrl}
        alt={event.title}
        placeName={event.title}
        className="h-20 w-20 shrink-0 rounded-xl"
        sizes="80px"
        showFallbackCaption={false}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tabular-nums text-yunicity-primary">
          {formatEventClockTime(event.starts_at)}
          <span className="font-normal text-neutral-400"> · </span>
          <span className="font-normal text-neutral-500">
            {formatEventDateRange(event.starts_at, event.ends_at).split(" · ")[0]}
          </span>
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold text-neutral-900">{event.title}</h3>
        <p className="mt-0.5 text-xs text-neutral-500">{eventAgendaVibeLine(event)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={`/events/${event.id}`}
            className="rounded-lg bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
          >
            {NEIGHBORHOOD_DETAIL_MOMENT_VIEW}
          </Link>
          <button
            type="button"
            disabled={toggling}
            onClick={() => void handleInterest()}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-yunicity-primary/30 disabled:opacity-60"
          >
            {interested ? EVENT_INTEREST_SAVED : NEIGHBORHOOD_DETAIL_MOMENT_INTEREST}
          </button>
        </div>
      </div>
    </article>
  );
}
