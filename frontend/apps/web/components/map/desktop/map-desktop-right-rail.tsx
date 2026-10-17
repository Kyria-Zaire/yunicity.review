"use client";

import { MapDesktopLiveCard } from "@/components/map/desktop/map-desktop-live-card";
import { MapDesktopNeighborhoodAmbianceList } from "@/components/map/desktop/map-desktop-neighborhood-ambiance-list";
import type { MapPageContextState } from "@/hooks/use-map-page-context";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  MAP_RAIL_LIVE_EMPTY,
  MAP_RAIL_LIVE_TITLE,
  buildMapLiveDiscoveryItems,
} from "@yunicity/utils";

type MapDesktopRightRailProps = {
  context: MapPageContextState;
  culturalPlaces: CulturalPlaceListItem[];
};

export function MapDesktopRightRail({ context, culturalPlaces }: MapDesktopRightRailProps) {
  const { loading, neighborhoods, city, upcomingEvents, passportOffers } = context;
  const liveItems = buildMapLiveDiscoveryItems({
    city,
    events: upcomingEvents,
    culturalPlaces,
    passportOffers,
    neighborhoods,
    maxItems: 3,
  });

  if (loading) {
    return (
      <div className="space-y-4" data-map-desktop-right-rail="">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-map-desktop-right-rail="">
      <h2 className="px-1 text-lg font-bold tracking-tight text-neutral-950">
        {MAP_RAIL_LIVE_TITLE}
      </h2>

      {liveItems.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-6 text-sm text-neutral-500">
          {MAP_RAIL_LIVE_EMPTY}
        </p>
      ) : (
        <div className="space-y-4">
          {liveItems.map((item) => (
            <MapDesktopLiveCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <MapDesktopNeighborhoodAmbianceList city={city} neighborhoods={neighborhoods} />
    </div>
  );
}
