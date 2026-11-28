"use client";

import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_TAB_PRACTICAL,
  NEIGHBORHOOD_V2_PRACTICAL_CITY,
  NEIGHBORHOOD_V2_PRACTICAL_EVENTS,
  NEIGHBORHOOD_V2_PRACTICAL_HOOD,
  NEIGHBORHOOD_V2_PRACTICAL_MAP_CTA,
  NEIGHBORHOOD_V2_PRACTICAL_PLACES,
  buildNeighborhoodDetailMapUrl,
  neighborhoodHasMapCoordinates,
} from "@yunicity/utils";
import Link from "next/link";

type NeighborhoodDetailDesktopPracticalProps = {
  detail: NeighborhoodDetail;
};

export function NeighborhoodDetailDesktopPractical({
  detail,
}: NeighborhoodDetailDesktopPracticalProps) {
  const displayName = detail.hero?.display_name ?? detail.display_name;
  const placesCount = detail.stats?.places_count ?? detail.places?.length ?? 0;
  const eventsCount = detail.stats?.events_count ?? detail.events?.length ?? 0;
  const showMapLink = neighborhoodHasMapCoordinates(detail);

  return (
    <section
      id="nd-desktop-practical"
      className="neighborhood-detail-section space-y-4 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-xl font-bold tracking-tight text-neutral-950">
        {NEIGHBORHOOD_DETAIL_DESKTOP_TAB_PRACTICAL}
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
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
          className="inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOOD_V2_PRACTICAL_MAP_CTA}
        </Link>
      ) : null}
    </section>
  );
}
