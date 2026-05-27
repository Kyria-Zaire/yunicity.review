"use client";

import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  MAP_CULTURE_DETAILS_CTA,
  MAP_CULTURE_IMAGE_PLACEHOLDER,
  MAP_CULTURE_ROUTE_CTA,
  MAP_RAIL_CULTURE_EMPTY,
  MAP_RAIL_CULTURE_TITLE,
  culturalPlaceCategoryLabel,
  culturalPlaceLocationLine,
  resolveCulturalPlaceImageUrl,
} from "@yunicity/utils";

type MapCulturalPlacesRailProps = {
  places: CulturalPlaceListItem[];
  selectedSlug: string | null;
  expandedSlug: string | null;
  onSelectPlace: (place: CulturalPlaceListItem) => void;
  onStartRoute: (place: CulturalPlaceListItem) => void;
  onToggleDetails: (place: CulturalPlaceListItem) => void;
};

function PlaceImage({ place }: { place: CulturalPlaceListItem }) {
  const src = resolveCulturalPlaceImageUrl(place);
  if (src) {
    return (
      <img
        src={src}
        alt={place.image_alt ?? place.name}
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 text-xs font-medium text-neutral-500"
      aria-hidden
    >
      {MAP_CULTURE_IMAGE_PLACEHOLDER.slice(0, 1)}
    </div>
  );
}

export function MapCulturalPlacesRail({
  places,
  selectedSlug,
  expandedSlug,
  onSelectPlace,
  onStartRoute,
  onToggleDetails,
}: MapCulturalPlacesRailProps) {
  return (
    <WebContextPanel title={MAP_RAIL_CULTURE_TITLE}>
      {places.length === 0 ? (
        <p className="text-sm text-neutral-500">{MAP_RAIL_CULTURE_EMPTY}</p>
      ) : (
        <ul className="space-y-3">
          {places.map((place) => {
            const isSelected = selectedSlug === place.slug;
            const isExpanded = expandedSlug === place.slug;
            return (
              <li
                key={place.id}
                className={`rounded-xl border px-3 py-3 transition-colors ${
                  isSelected
                    ? "border-yunicity-primary/40 bg-yunicity-primary/5"
                    : "border-neutral-100 bg-neutral-50/80"
                }`}
              >
                <div className="flex gap-3">
                  <PlaceImage place={place} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onSelectPlace(place)}
                      className="text-left"
                    >
                      <p className="font-medium text-neutral-900">{place.name}</p>
                      <p className="text-xs text-neutral-500">
                        {culturalPlaceCategoryLabel(place.category)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        {culturalPlaceLocationLine(place)}
                      </p>
                    </button>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onStartRoute(place)}
                        className="rounded-full bg-yunicity-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
                      >
                        {MAP_CULTURE_ROUTE_CTA}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleDetails(place)}
                        className="rounded-full px-2.5 py-1 text-xs font-semibold text-yunicity-primary hover:underline"
                      >
                        {MAP_CULTURE_DETAILS_CTA}
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {place.short_description}
                  </p>
                ) : null}
                {place.photo_credit ? (
                  <p className="mt-2 text-[10px] text-neutral-400">{place.photo_credit}</p>
                ) : place.source_name ? (
                  <p className="mt-2 text-[10px] text-neutral-400">{place.source_name}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </WebContextPanel>
  );
}
