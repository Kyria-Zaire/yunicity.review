"use client";

import type { CulturalPlaceListItem, Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_PORTAL_LOCATION_ROUTE,
  NEIGHBORHOOD_DETAIL_PORTAL_LOCATION_TITLE,
  NEIGHBORHOOD_DETAIL_MAP_UNAVAILABLE,
  buildNeighborhoodDetailMapPreviewUrl,
  buildNeighborhoodDetailMapUrl,
  neighborhoodHasMapCoordinates,
} from "@yunicity/utils";
import { Navigation } from "lucide-react";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type NeighborhoodDetailLocationCardProps = {
  hood: Neighborhood;
  places: CulturalPlaceListItem[];
};

export function NeighborhoodDetailLocationCard({ hood, places }: NeighborhoodDetailLocationCardProps) {
  const hasCoords = neighborhoodHasMapCoordinates(hood);
  if (!hasCoords) {
    return null;
  }

  const previewUrl = buildNeighborhoodDetailMapPreviewUrl(hood, places, MAPBOX_TOKEN, {
    width: 640,
    height: 360,
  });
  const mapHref = buildNeighborhoodDetailMapUrl(hood);
  const routeHref = buildNeighborhoodDetailMapUrl(hood, { route: true });
  const labeledPlaces = places.filter((place) => place.latitude && place.longitude).slice(0, 5);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_PORTAL_LOCATION_TITLE}</h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-50">
        {previewUrl ? (
          <Link href={mapHref} className="relative block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="h-48 w-full object-cover sm:h-52" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/55 to-transparent px-3 pb-3 pt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-white/90">
                {hood.display_name}
              </p>
            </div>
          </Link>
        ) : (
          <p className="px-4 py-6 text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_MAP_UNAVAILABLE}</p>
        )}

        {labeledPlaces.length > 0 ? (
          <ul className="space-y-1.5 border-t border-neutral-100 px-3 py-3">
            {labeledPlaces.map((place) => (
              <li key={place.id} className="flex items-center gap-2 text-xs text-neutral-700">
                <span className="h-2 w-2 shrink-0 rounded-full bg-yunicity-primary" aria-hidden />
                <span className="line-clamp-1">{place.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Link
        href={routeHref}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary-soft/40"
      >
        <Navigation className="h-4 w-4" aria-hidden />
        {NEIGHBORHOOD_DETAIL_PORTAL_LOCATION_ROUTE}
      </Link>
    </section>
  );
}
