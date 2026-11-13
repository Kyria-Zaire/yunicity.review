"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopQuartierTile } from "@yunicity/utils";
import {
  PLACES_DESKTOP_QUARTIERS_TITLE,
  PLACES_DESKTOP_QUARTIERS_VIEW_ALL,
  placesDesktopNeighborhoodsHref,
} from "@yunicity/utils";
import Link from "next/link";

type PlacesDesktopQuartiersRowProps = {
  city: string;
  tiles: PlacesDesktopQuartierTile[];
};

export function PlacesDesktopQuartiersRow({ city, tiles }: PlacesDesktopQuartiersRowProps) {
  return (
    <section className="space-y-4" aria-labelledby="places-desktop-quartiers-title" data-places-desktop-quartiers="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="places-desktop-quartiers-title" className="text-lg font-bold text-neutral-900">
          {PLACES_DESKTOP_QUARTIERS_TITLE}
        </h2>
        <Link
          href={placesDesktopNeighborhoodsHref(city)}
          className="text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PLACES_DESKTOP_QUARTIERS_VIEW_ALL}
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.slug}>
            <Link
              href={tile.href}
              className="group relative block overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-900 shadow-sm"
            >
              <div className="relative aspect-[16/10]">
                <CulturalImage
                  src={tile.imageUrl}
                  alt=""
                  placeName={tile.label}
                  className="absolute inset-0 size-full opacity-90 transition group-hover:scale-[1.02] group-hover:opacity-100"
                  sizes="(max-width: 1280px) 25vw, 240px"
                  showFallbackCaption={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <p className="absolute bottom-3 left-3 text-sm font-bold text-white">{tile.label}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
