"use client";

import { NeighborhoodDetailTransitCompact } from "@/components/neighborhoods/neighborhood-detail-transit-compact";
import type { Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_ACCESS,
  NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_ACCESS_VALUE,
  NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_ADDRESS,
  NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_MORE,
  NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_TITLE,
  NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_TRANSIT,
  buildNeighborhoodDetailMapUrl,
  neighborhoodHasMapCoordinates,
} from "@yunicity/utils";
import Link from "next/link";

type NeighborhoodDetailPracticalCardProps = {
  hood: Neighborhood;
  address: string;
  city: string;
};

export function NeighborhoodDetailPracticalCard({
  hood,
  address,
  city,
}: NeighborhoodDetailPracticalCardProps) {
  const hasCoords = neighborhoodHasMapCoordinates(hood);
  const transitPoint =
    hasCoords && hood.latitude != null && hood.longitude != null
      ? { lat: hood.latitude, lon: hood.longitude, city }
      : null;

  return (
    <section
      id="neighborhood-practical"
      className="scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_TITLE}</h2>

      <dl className="mt-4 space-y-4">
        <div>
          <dt className="text-sm font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_ADDRESS}</dt>
          <dd className="mt-1 text-sm text-neutral-700">{address}</dd>
        </div>

        {transitPoint ? (
          <div>
            <dt className="text-sm font-bold text-neutral-900">
              {NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_TRANSIT}
            </dt>
            <dd className="mt-2">
              <NeighborhoodDetailTransitCompact point={transitPoint} />
            </dd>
          </div>
        ) : null}

        {hasCoords ? (
          <div>
            <dt className="text-sm font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_ACCESS}</dt>
            <dd className="mt-1 text-sm text-neutral-700">
              {NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_ACCESS_VALUE}
            </dd>
          </div>
        ) : null}
      </dl>

      {hasCoords ? (
        <Link
          href={buildNeighborhoodDetailMapUrl(hood)}
          className="mt-5 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_MORE} →
        </Link>
      ) : null}
    </section>
  );
}
