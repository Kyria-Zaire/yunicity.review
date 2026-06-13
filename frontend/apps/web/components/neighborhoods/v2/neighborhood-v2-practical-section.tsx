"use client";

import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_PRACTICAL_CITY,
  NEIGHBORHOOD_V2_PRACTICAL_EVENTS,
  NEIGHBORHOOD_V2_PRACTICAL_HOOD,
  NEIGHBORHOOD_V2_PRACTICAL_MAP_CTA,
  NEIGHBORHOOD_V2_PRACTICAL_PLACES,
  NEIGHBORHOOD_V2_PRACTICAL_TITLE,
  buildNeighborhoodDetailMapUrl,
  hasNeighborhoodV2PracticalBlock,
  neighborhoodHasMapCoordinates,
} from "@yunicity/utils";
import Link from "next/link";

type NeighborhoodV2PracticalSectionProps = {
  detail: NeighborhoodDetail;
};

export function NeighborhoodV2PracticalSection({ detail }: NeighborhoodV2PracticalSectionProps) {
  if (!hasNeighborhoodV2PracticalBlock(detail)) {
    return null;
  }

  const displayName = detail.hero?.display_name ?? detail.display_name;
  const placesCount = detail.stats?.places_count ?? 0;
  const eventsCount = detail.stats?.events_count ?? 0;
  const showMapLink = neighborhoodHasMapCoordinates(detail);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{NEIGHBORHOOD_V2_PRACTICAL_TITLE}</h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_V2_PRACTICAL_CITY}
          </dt>
          <dd className="mt-1 text-sm font-medium text-neutral-900">{detail.city}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_V2_PRACTICAL_HOOD}
          </dt>
          <dd className="mt-1 text-sm font-medium text-neutral-900">{displayName}</dd>
        </div>
        {placesCount > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {NEIGHBORHOOD_V2_PRACTICAL_PLACES}
            </dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">{placesCount}</dd>
          </div>
        ) : null}
        {eventsCount > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {NEIGHBORHOOD_V2_PRACTICAL_EVENTS}
            </dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">{eventsCount}</dd>
          </div>
        ) : null}
      </dl>

      {showMapLink ? (
        <Link
          href={buildNeighborhoodDetailMapUrl(detail)}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOOD_V2_PRACTICAL_MAP_CTA} →
        </Link>
      ) : null}
    </section>
  );
}
