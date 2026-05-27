"use client";

import { CulturalPlaceTrendCard } from "@/components/culture/cultural-place-trend-card";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { CulturalPlaceListItem } from "@yunicity/types";
import { MAP_RAIL_CULTURE_EMPTY, MAP_RAIL_CULTURE_TITLE } from "@yunicity/utils";

const MAP_CULTURE_RAIL_LIMIT = 4;

type MapCulturalPlacesRailProps = {
  places: CulturalPlaceListItem[];
  selectedSlug: string | null;
  expandedSlug: string | null;
  onSelectPlace: (place: CulturalPlaceListItem) => void;
  onStartRoute: (place: CulturalPlaceListItem) => void;
  onToggleDetails: (place: CulturalPlaceListItem) => void;
};

export function MapCulturalPlacesRail({
  places,
  selectedSlug,
  expandedSlug,
  onSelectPlace,
  onStartRoute,
  onToggleDetails,
}: MapCulturalPlacesRailProps) {
  void onToggleDetails;
  const visible = places.slice(0, MAP_CULTURE_RAIL_LIMIT);

  return (
    <WebContextPanel title={MAP_RAIL_CULTURE_TITLE}>
      {visible.length === 0 ? (
        <p className="text-sm text-neutral-500">{MAP_RAIL_CULTURE_EMPTY}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((place) => (
            <li key={place.id}>
              <CulturalPlaceTrendCard
                place={place}
                layout="rail"
                mode="interactive"
                selected={selectedSlug === place.slug}
                expanded={expandedSlug === place.slug}
                onSelectMap={() => onSelectPlace(place)}
                onRoute={() => onStartRoute(place)}
              />
            </li>
          ))}
        </ul>
      )}
    </WebContextPanel>
  );
}
