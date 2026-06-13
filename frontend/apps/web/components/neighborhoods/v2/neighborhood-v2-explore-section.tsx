"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_EVENT_CTA,
  NEIGHBORHOOD_V2_EXPLORE_ANCHOR,
  NEIGHBORHOOD_V2_EXPLORE_EVENTS,
  NEIGHBORHOOD_V2_EXPLORE_OFFERS,
  NEIGHBORHOOD_V2_EXPLORE_PLACES,
  NEIGHBORHOOD_V2_EXPLORE_TITLE,
  NEIGHBORHOOD_V2_OFFER_CTA,
  NEIGHBORHOOD_V2_PLACE_CTA,
  buildPublicPlaceHref,
  formatEventClockTime,
  formatEventDateRange,
  hasNeighborhoodV2ExploreContent,
} from "@yunicity/utils";
import Link from "next/link";

type NeighborhoodV2ExploreSectionProps = {
  detail: NeighborhoodDetail;
};

export function NeighborhoodV2ExploreSection({ detail }: NeighborhoodV2ExploreSectionProps) {
  if (!hasNeighborhoodV2ExploreContent(detail)) {
    return null;
  }

  const displayName = detail.hero?.display_name ?? detail.display_name;

  return (
    <section
      id={NEIGHBORHOOD_V2_EXPLORE_ANCHOR}
      className="scroll-mt-28 space-y-8 rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6"
    >
      <header>
        <h2 className="text-lg font-bold tracking-tight text-neutral-900">
          {NEIGHBORHOOD_V2_EXPLORE_TITLE} {displayName}
        </h2>
      </header>

      {detail.places.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_V2_EXPLORE_PLACES}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {detail.places.map((place) => (
              <li key={place.id}>
                <article className="flex h-full gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                    {place.image_url ? (
                      <CulturalImage
                        src={place.image_url}
                        alt=""
                        placeName={place.name}
                        className="h-full w-full"
                        sizes="64px"
                        overlay={false}
                        showFallbackCaption={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                        {place.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="line-clamp-2 text-sm font-bold text-neutral-900">{place.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{place.category}</p>
                    </div>
                    <Link
                      href={buildPublicPlaceHref(place.slug, detail.city)}
                      className="mt-2 text-xs font-semibold text-yunicity-primary hover:underline"
                    >
                      {NEIGHBORHOOD_V2_PLACE_CTA}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {detail.events.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_V2_EXPLORE_EVENTS}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {detail.events.map((event) => (
              <li key={event.id}>
                <article className="flex h-full gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                    {event.cover_image_url ? (
                      <CulturalImage
                        src={event.cover_image_url}
                        alt=""
                        placeName={event.title}
                        className="h-full w-full"
                        sizes="64px"
                        overlay={false}
                        showFallbackCaption={false}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-yunicity-primary/10 px-1 text-center text-[10px] font-bold leading-tight text-yunicity-primary">
                        {formatEventClockTime(event.starts_at)}
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="line-clamp-2 text-sm font-bold text-neutral-900">{event.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-600">
                        {formatEventDateRange(event.starts_at, null)} · {event.location_name}
                      </p>
                    </div>
                    <Link
                      href={`/events/${encodeURIComponent(event.id)}`}
                      className="mt-2 text-xs font-semibold text-yunicity-primary hover:underline"
                    >
                      {NEIGHBORHOOD_V2_EVENT_CTA}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {detail.passport_offers.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_V2_EXPLORE_OFFERS}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {detail.passport_offers.map((offer) => (
              <li key={offer.id}>
                <article className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
                  <p className="line-clamp-2 text-sm font-bold text-neutral-900">{offer.title}</p>
                  <p className="mt-1 text-xs text-neutral-600">{offer.organization_name}</p>
                  <Link
                    href="/passport"
                    className="mt-auto pt-3 text-xs font-semibold text-yunicity-primary hover:underline"
                  >
                    {NEIGHBORHOOD_V2_OFFER_CTA}
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
