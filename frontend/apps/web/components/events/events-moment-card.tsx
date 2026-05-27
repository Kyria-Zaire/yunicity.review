"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  EVENT_INTEREST_CTA,
  EVENT_INTEREST_SAVED,
  EVENTS_MOMENT_CTA,
  EVENTS_MOMENT_MAP_CTA,
  buildMapEventUrl,
  eventAgendaDistrictLine,
  eventAgendaVibeLine,
  formatEventClockTime,
  formatEventDurationLabel,
  resolveEventHeroImage,
} from "@yunicity/utils";
import { Bookmark, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type EventsMomentCardProps = {
  event: LocalEvent;
  culturalPlaces: CulturalPlaceListItem[];
  onInterestChange?: (eventId: string, interested: boolean) => void;
};

export function EventsMomentCard({
  event,
  culturalPlaces,
  onInterestChange,
}: EventsMomentCardProps) {
  const api = useYunicityApi();
  const [interested, setInterested] = useState(event.interested_by_me);
  const [toggling, setToggling] = useState(false);

  const imageUrl = resolveEventHeroImage(event, culturalPlaces);
  const time = formatEventClockTime(event.starts_at);
  const duration = formatEventDurationLabel(event.starts_at, event.ends_at);
  const vibe = eventAgendaVibeLine(event);
  const district = eventAgendaDistrictLine(event);
  const mapHref = buildMapEventUrl(event.id);

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

  const timeLine = [time, duration].filter(Boolean).join(" · ");

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition hover:border-neutral-300 hover:shadow-sm">
      <div className="grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <CulturalImage
          src={imageUrl}
          alt={event.title}
          placeName={event.title}
          className="h-44 w-full md:h-full md:min-h-[200px]"
          sizes="(max-width: 768px) 100vw, 380px"
          showFallbackCaption={false}
        />

        <div className="flex flex-col justify-center p-5 sm:p-6">
          <h3 className="text-lg font-bold leading-snug text-neutral-900 sm:text-xl">{event.title}</h3>

          {timeLine ? (
            <p className="mt-2 text-sm font-semibold tabular-nums text-neutral-800">{timeLine}</p>
          ) : null}

          <p className="mt-1.5 text-sm text-neutral-600">
            {district}
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">{vibe}</span>
          </p>

          {event.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-500">
              {event.description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href={`/events/${event.id}`}
              className="rounded-lg bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              {EVENTS_MOMENT_CTA}
            </Link>
            <Link
              href={mapHref}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
              aria-label={EVENTS_MOMENT_MAP_CTA}
            >
              <MapPin className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">{EVENTS_MOMENT_MAP_CTA}</span>
            </Link>
            <button
              type="button"
              disabled={toggling}
              onClick={() => void handleInterest()}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:border-yunicity-primary/30 disabled:opacity-60"
              aria-label={interested ? EVENT_INTEREST_SAVED : EVENT_INTEREST_CTA}
            >
              <Bookmark
                className={`h-4 w-4 ${interested ? "fill-yunicity-primary text-yunicity-primary" : ""}`}
                aria-hidden
              />
              <span className="sr-only">{interested ? EVENT_INTEREST_SAVED : EVENT_INTEREST_CTA}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
