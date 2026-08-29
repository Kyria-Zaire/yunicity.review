"use client";

import type { LocalEvent } from "@yunicity/types";
import {
  FEED_ACTION_SAVED,
  FEED_EVENT_INTEREST_CTA,
  resolveFeaturedCarouselEventImage,
} from "@yunicity/utils";
import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { formatFeedEventInterestLabel, formatFeedFeaturedEventScheduleLabel } from "@/lib/feed/feed-evening-events";

type FeedDesktopFeaturedEventCardProps = {
  event: LocalEvent;
  className?: string;
  markPrimarySurface?: boolean;
};

function IconBookmark({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </svg>
  );
}

function InterestAvatarStack({ count }: { count: number }) {
  const visibleSlots = Math.min(Math.max(count, 0), 4);

  if (visibleSlots === 0) return null;

  return (
    <div className="flex items-center" aria-hidden>
      {Array.from({ length: visibleSlots }, (_, index) => (
        <span
          key={index}
          className="relative -ml-2 first:ml-0 inline-flex h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-violet-200 to-violet-500"
        />
      ))}
    </div>
  );
}

export function FeedDesktopFeaturedEventCard({
  event,
  className = "",
  markPrimarySurface = false,
}: FeedDesktopFeaturedEventCardProps) {
  const api = useYunicityApi();
  const [interestLoading, setInterestLoading] = useState(false);
  const [interested, setInterested] = useState(event.interested_by_me);
  const [interestCount, setInterestCount] = useState(event.interest_count ?? 0);

  const imageUrl = resolveFeaturedCarouselEventImage(event);
  const scheduleLabel = formatFeedFeaturedEventScheduleLabel(event);
  const eventHref = `/events/${event.id}`;

  async function handleToggleInterest() {
    if (interestLoading) return;
    setInterestLoading(true);
    try {
      const result = await api.toggleEventInterest(event.id);
      setInterested(result.interested);
      setInterestCount(result.interest_count);
    } finally {
      setInterestLoading(false);
    }
  }

  return (
    <section
      className={`feed-desktop-surface feed-featured-event-card overflow-hidden ${className}`}
      data-feed-desktop-featured-event=""
      data-feed-publication-event=""
      data-feed-medium-surface={markPrimarySurface ? "primary" : undefined}
      aria-labelledby="feed-featured-event-title"
    >
      <p className="sr-only">Événement à la une</p>
      <article className="flex flex-col sm:flex-row">
        <Link
          href={eventHref}
          className="relative block aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:w-[45%] sm:min-h-[17.5rem]"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- couverture événement dynamique
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full min-h-[12rem] w-full items-center justify-center bg-neutral-100 text-3xl font-bold text-neutral-300">
              {event.title.slice(0, 1).toUpperCase()}
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          {scheduleLabel ? (
            <div className="mb-3">
              <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold leading-snug text-neutral-900">
                {scheduleLabel}
              </span>
            </div>
          ) : null}

          <h2
            id="feed-featured-event-title"
            className="text-xl font-bold leading-snug text-neutral-900 sm:text-2xl"
          >
            <Link href={eventHref} className="transition hover:text-yunicity-primary">
              {event.title}
            </Link>
          </h2>

          {event.location_name ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span>{event.location_name}</span>
            </p>
          ) : null}

          {event.description ? (
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{event.description}</p>
          ) : null}

          {interestCount > 0 ? (
            <div className="mt-4 flex items-center gap-2">
              <InterestAvatarStack count={interestCount} />
              <p className="text-sm text-neutral-500">{formatFeedEventInterestLabel(interestCount)}</p>
            </div>
          ) : null}

          <div className="mt-auto flex items-center gap-2 pt-5">
            <button
              type="button"
              disabled={interestLoading}
              onClick={() => void handleToggleInterest()}
              aria-pressed={interested}
              data-feed-publication-action="event-interest-primary"
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                interested
                  ? "border-yunicity-primary bg-yunicity-primary-soft text-yunicity-primary"
                  : "border-yunicity-primary text-yunicity-primary hover:bg-yunicity-primary-soft"
              }`}
            >
              <Star
                className={`h-4 w-4 shrink-0 ${interested ? "fill-current" : ""}`}
                aria-hidden
              />
              {interested ? FEED_ACTION_SAVED : FEED_EVENT_INTEREST_CTA}
            </button>
            <Link
              href={eventHref}
              aria-label="Enregistrer l'événement"
              data-feed-publication-action="event-bookmark"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
            >
              <IconBookmark filled={interested} />
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}
