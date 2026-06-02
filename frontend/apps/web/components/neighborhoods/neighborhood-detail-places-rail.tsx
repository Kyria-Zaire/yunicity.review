"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailPlaceCard } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_PORTAL_PLACES_RAIL_CTA,
  NEIGHBORHOOD_DETAIL_PORTAL_PLACES_RAIL_EMPTY,
  NEIGHBORHOOD_DETAIL_PORTAL_PLACES_RAIL_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

type NeighborhoodDetailPlacesRailProps = {
  cards: NeighborhoodDetailPlaceCard[];
  city: string;
  hoodSlug: string;
};

export function NeighborhoodDetailPlacesRail({ cards, city, hoodSlug }: NeighborhoodDetailPlacesRailProps) {
  const mapHref = `/map?city=${encodeURIComponent(city)}&neighborhood=${encodeURIComponent(hoodSlug)}`;

  return (
    <section id="neighborhood-places" className="scroll-mt-28 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_PORTAL_PLACES_RAIL_TITLE}</h2>
        {cards.length > 0 ? (
          <Link
            href={mapHref}
            className="shrink-0 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {NEIGHBORHOOD_DETAIL_PORTAL_PLACES_RAIL_CTA}
          </Link>
        ) : null}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-6 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_PORTAL_PLACES_RAIL_EMPTY}
        </p>
      ) : (
        <ul className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((card) => (
            <li key={card.id} className="w-[220px] shrink-0 sm:w-[240px]">
              <Link
                href={card.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white transition hover:border-neutral-300 hover:shadow-md"
              >
                <CulturalImage
                  src={card.imageUrl}
                  alt={card.name}
                  placeName={card.name}
                  className="aspect-[4/3] w-full"
                  sizes="240px"
                  showFallbackCaption={false}
                />
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 group-hover:text-yunicity-primary">
                    {card.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">{card.tagline}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
