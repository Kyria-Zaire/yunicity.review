"use client";

import { MapCulturalPlacesRail } from "@/components/map/map-cultural-places-rail";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { MapTransitQueryPoint } from "@/hooks/use-map-transit-nearby";
import type { MapPageContextState } from "@/hooks/use-map-page-context";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  MAP_EDITORIAL_ROUTES,
  MAP_RAIL_NEIGHBORHOODS_EMPTY,
  MAP_RAIL_NEIGHBORHOODS_TITLE,
  MAP_RAIL_PRIVILEGES_TITLE,
  MAP_RAIL_URBAN_SOON,
  MAP_RAIL_URBAN_TITLE,
  MAP_OFFER_CTA,
  MAP_OFFER_EMPTY,
  formatOfferValidUntil,
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

type MapRightRailProps = {
  context: MapPageContextState;
  culturalPlaces: CulturalPlaceListItem[];
  transitPoint: MapTransitQueryPoint;
  selectedCulturalSlug: string | null;
  expandedCulturalSlug: string | null;
  onSelectCulturalPlace: (place: CulturalPlaceListItem) => void;
  onStartRoute: (place: CulturalPlaceListItem) => void;
  onToggleCulturalDetails: (place: CulturalPlaceListItem) => void;
};

export function MapRightRail({
  context,
  culturalPlaces,
  transitPoint,
  selectedCulturalSlug,
  expandedCulturalSlug,
  onSelectCulturalPlace,
  onStartRoute,
  onToggleCulturalDetails,
}: MapRightRailProps) {
  const { loading, neighborhoods, highlightOffer, city } = context;

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

      <MapCulturalPlacesRail
        places={culturalPlaces}
        selectedSlug={selectedCulturalSlug}
        expandedSlug={expandedCulturalSlug}
        onSelectPlace={onSelectCulturalPlace}
        onStartRoute={onStartRoute}
        onToggleDetails={onToggleCulturalDetails}
      />

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
