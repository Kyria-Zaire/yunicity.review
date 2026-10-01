"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopQuartierTile } from "@yunicity/utils";
import {
  PLACES_DESKTOP_QUARTIERS_TITLE,
  PLACES_DESKTOP_QUARTIERS_VIEW_ALL,
  placesDesktopNeighborhoodsHref,
} from "@yunicity/utils";
import Link from "next/link";

type PlacesMobileQuartiersRailProps = {
  city: string;
  tiles: PlacesDesktopQuartierTile[];
};

export function PlacesMobileQuartiersRail({ city, tiles }: PlacesMobileQuartiersRailProps) {
  return (
    <section className="space-y-3" aria-labelledby="places-mobile-quartiers-title" data-places-mobile-quartiers="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="places-mobile-quartiers-title" className="text-base font-bold text-neutral-900">
          {PLACES_DESKTOP_QUARTIERS_TITLE}
        </h2>
        <Link
          href={placesDesktopNeighborhoodsHref(city)}
          className="text-xs font-semibold text-yunicity-primary"
        >
          {PLACES_DESKTOP_QUARTIERS_VIEW_ALL}
        </Link>
      </div>

      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiles.map((tile) => (
          <li key={tile.slug} className="w-[42vw] max-w-[11rem] shrink-0">
            <Link
              href={tile.href}
              className="group relative block overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-900 shadow-sm"
            >
              <div className="relative aspect-[4/3]">
                <CulturalImage
                  src={tile.imageUrl}
                  alt=""
                  placeName={tile.label}
                  className="absolute inset-0 size-full opacity-90"
                  sizes="176px"
                  showFallbackCaption={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <p className="absolute bottom-2.5 left-2.5 text-sm font-bold text-white">{tile.label}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
