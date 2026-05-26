"use client";

import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { MapTransitQueryPoint } from "@/hooks/use-map-transit-nearby";
import type { MapPageContextState } from "@/hooks/use-map-page-context";
import {
  MAP_EDITORIAL_ROUTES,
  MAP_RAIL_CULTURE_EMPTY,
  MAP_RAIL_CULTURE_TITLE,
  MAP_RAIL_NEIGHBORHOODS_EMPTY,
  MAP_RAIL_NEIGHBORHOODS_TITLE,
  MAP_RAIL_PRIVILEGES_TITLE,
  MAP_RAIL_URBAN_SOON,
  MAP_RAIL_URBAN_TITLE,
  MAP_OFFER_CTA,
  MAP_OFFER_EMPTY,
  formatOfferValidUntil,
  searchResultTitle,
} from "@yunicity/utils";
import Link from "next/link";

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

export function MapRightRail({
  context,
  transitPoint,
}: {
  context: MapPageContextState;
  transitPoint: MapTransitQueryPoint;
}) {
  const { loading, neighborhoods, culturalPlaces, highlightOffer, city } = context;

  if (loading) {
    return <RailSkeleton />;
  }

  return (
    <div className="space-y-4">
      <WebContextPanel title={MAP_RAIL_URBAN_TITLE}>
        <ul className="space-y-2">
          {MAP_EDITORIAL_ROUTES.map((route) => (
            <li
              key={route.id}
              className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5"
            >
              <p className="font-medium text-neutral-900">{route.title}</p>
              <p className="text-xs text-neutral-500">
                {route.duration} · {route.difficulty}
              </p>
              <span className="mt-2 inline-block text-xs font-medium text-neutral-400">
                {MAP_RAIL_URBAN_SOON}
              </span>
            </li>
          ))}
        </ul>
      </WebContextPanel>

      <MapTransitNearby point={transitPoint} />

      <WebContextPanel title={MAP_RAIL_CULTURE_TITLE}>
        {culturalPlaces.length === 0 ? (
          <p className="text-neutral-500">{MAP_RAIL_CULTURE_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {culturalPlaces.map((place) => (
              <li key={place.id}>
                <Link
                  href="/search?type=organization"
                  className="block rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                >
                  <span className="font-medium text-neutral-800">
                    {searchResultTitle(place)}
                  </span>
                  {place.city ? (
                    <span className="block text-xs text-neutral-500">{place.city}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </WebContextPanel>

      <WebContextPanel title={MAP_RAIL_NEIGHBORHOODS_TITLE}>
        {neighborhoods.length === 0 ? (
          <p className="text-neutral-500">{MAP_RAIL_NEIGHBORHOODS_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {neighborhoods.map((hood) => (
              <li key={hood.id}>
                <Link
                  href={`/neighborhoods/${hood.slug}?city=${encodeURIComponent(city)}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                >
                  <span className="font-medium text-neutral-800">{hood.display_name}</span>
                  <span className="text-xs text-yunicity-primary">Explorer</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/neighborhoods?city=${encodeURIComponent(city)}`}
          className="inline-block text-xs font-semibold text-yunicity-primary hover:underline"
        >
          Tous les quartiers
        </Link>
      </WebContextPanel>

      <WebContextPanel title={MAP_RAIL_PRIVILEGES_TITLE}>
        {highlightOffer ? (
          <div className="space-y-2">
            <p className="font-medium text-neutral-900">{highlightOffer.title}</p>
            {highlightOffer.valid_until ? (
              <p className="text-xs text-neutral-500">
                {formatOfferValidUntil(highlightOffer.valid_until)}
              </p>
            ) : null}
            <Link
              href="/passport"
              className="inline-flex rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
            >
              {MAP_OFFER_CTA}
            </Link>
          </div>
        ) : (
          <p className="text-neutral-500">{MAP_OFFER_EMPTY}</p>
        )}
      </WebContextPanel>
    </div>
  );
}
