"use client";

import type { Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_MAP_CTA,
  NEIGHBORHOOD_DETAIL_MAP_ROUTE_CTA,
  NEIGHBORHOOD_DETAIL_MAP_TITLE,
  NEIGHBORHOOD_DETAIL_MAP_UNAVAILABLE,
  buildMapboxStaticPreviewUrl,
  buildNeighborhoodDetailMapUrl,
  neighborhoodHasMapCoordinates,
} from "@yunicity/utils";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type NeighborhoodDetailMapBlockProps = {
  hood: Neighborhood;
};

export function NeighborhoodDetailMapBlock({ hood }: NeighborhoodDetailMapBlockProps) {
  const hasCoords = neighborhoodHasMapCoordinates(hood);
  const mapHref = buildNeighborhoodDetailMapUrl(hood);
  const routeHref = buildNeighborhoodDetailMapUrl(hood, { route: true });
  const previewUrl =
    hasCoords && hood.latitude != null && hood.longitude != null
      ? buildMapboxStaticPreviewUrl(hood.latitude, hood.longitude, MAPBOX_TOKEN)
      : null;

  if (!hasCoords) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="hood-map-title">
      <h2 id="hood-map-title" className="text-lg font-bold text-neutral-900">
        {NEIGHBORHOOD_DETAIL_MAP_TITLE}
      </h2>

      <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
        {previewUrl ? (
          <Link href={mapHref} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="h-44 w-full object-cover sm:h-52" />
          </Link>
        ) : (
          <p className="border-b border-neutral-100 px-4 py-3 text-sm text-neutral-500">
            {NEIGHBORHOOD_DETAIL_MAP_UNAVAILABLE}
          </p>
        )}

        <div className="flex flex-wrap gap-2 p-4">
          <Link
            href={mapHref}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
          >
            {NEIGHBORHOOD_DETAIL_MAP_CTA}
          </Link>
          <Link
            href={routeHref}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
          >
            {NEIGHBORHOOD_DETAIL_MAP_ROUTE_CTA}
          </Link>
        </div>
      </div>
    </section>
  );
}
