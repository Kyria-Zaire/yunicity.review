"use client";

import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import { LocalWeatherRailPanel } from "@/components/weather/local-weather-rail-panel";
import type { NeighborhoodDetailContextState } from "@/hooks/use-neighborhood-detail-context";
import type { CulturalPlaceListItem, Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_RAIL_FLUX_CALM,
  NEIGHBORHOOD_DETAIL_RAIL_FLUX_TITLE,
  NEIGHBORHOOD_DETAIL_RAIL_MAP_TITLE,
  NEIGHBORHOOD_DETAIL_RAIL_NEARBY_EMPTY,
  NEIGHBORHOOD_DETAIL_RAIL_NEARBY_TITLE,
  NEIGHBORHOOD_DETAIL_RAIL_PASSPORT_CTA,
  NEIGHBORHOOD_DETAIL_RAIL_PASSPORT_EMPTY,
  NEIGHBORHOOD_DETAIL_RAIL_PASSPORT_TITLE,
  NEIGHBORHOOD_DETAIL_RAIL_TRANSIT_TITLE,
  buildMapNeighborhoodUrl,
  buildNeighborhoodDetailFluxLine,
} from "@yunicity/utils";
import Link from "next/link";

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

type NeighborhoodDetailRightRailProps = {
  context: NeighborhoodDetailContextState;
  hood: Neighborhood;
  weatherLat: number | null;
  weatherLon: number | null;
};

export function NeighborhoodDetailRightRail({
  context,
  hood,
  weatherLat,
  weatherLon,
}: NeighborhoodDetailRightRailProps) {
  const { loading, nearbyPlaces, passportOffers, atmosphereLine, city } = context;

  if (loading) {
    return <RailSkeleton />;
  }

  const transitPoint =
    hood.latitude != null && hood.longitude != null
      ? { lat: hood.latitude, lon: hood.longitude, city }
      : null;

  const fluxLine = buildNeighborhoodDetailFluxLine(hood, atmosphereLine);

  return (
    <div className="space-y-4">
      <WebContextPanel title={NEIGHBORHOOD_DETAIL_RAIL_MAP_TITLE}>
        <Link
          href={buildMapNeighborhoodUrl(hood.slug, { city })}
          className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
        >
          Voir sur la carte
        </Link>
      </WebContextPanel>

      {transitPoint ? (
        <MapTransitNearby point={transitPoint} title={NEIGHBORHOOD_DETAIL_RAIL_TRANSIT_TITLE} />
      ) : null}

      <LocalWeatherRailPanel city={city} lat={weatherLat} lon={weatherLon} />

      <NearbyPlacesPanel places={nearbyPlaces} city={city} />

      <WebContextPanel title={NEIGHBORHOOD_DETAIL_RAIL_PASSPORT_TITLE}>
        {passportOffers.length === 0 ? (
          <p className="text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_RAIL_PASSPORT_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {passportOffers.slice(0, 2).map((offer) => (
              <li key={offer.id}>
                <Link
                  href="/passport"
                  className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 hover:bg-white"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{offer.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{offer.partner.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/passport"
          className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOOD_DETAIL_RAIL_PASSPORT_CTA}
        </Link>
      </WebContextPanel>

      <WebContextPanel title={NEIGHBORHOOD_DETAIL_RAIL_FLUX_TITLE}>
        <p className="text-sm leading-relaxed text-neutral-600">
          {fluxLine || NEIGHBORHOOD_DETAIL_RAIL_FLUX_CALM}
        </p>
      </WebContextPanel>
    </div>
  );
}

function NearbyPlacesPanel({
  places,
  city,
}: {
  places: CulturalPlaceListItem[];
  city: string;
}) {
  return (
    <WebContextPanel title={NEIGHBORHOOD_DETAIL_RAIL_NEARBY_TITLE}>
      {places.length === 0 ? (
        <p className="text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_RAIL_NEARBY_EMPTY}</p>
      ) : (
        <ul className="space-y-2">
          {places.map((place) => (
            <li key={place.id}>
              <Link
                href={`/map?place=${encodeURIComponent(place.slug)}&city=${encodeURIComponent(city)}`}
                className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 hover:bg-white"
              >
                <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{place.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WebContextPanel>
  );
}
