"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  PLACES_FEATURED_TRUST_PREFIX,
  PLACES_PORTAL_FEATURED_CTA,
  PLACES_PORTAL_FEATURED_TITLE,
  buildPlaceHref,
  culturalPlaceCategoryLabel,
  formatPlaceTrustLine,
  placesCategoryBadgeTone,
  resolveCulturalPlaceDisplayUrl,
} from "@yunicity/utils";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const CARD_WIDTH = 200;
const CARD_GAP = 12;

type PlacesFeaturedRailProps = {
  places: CulturalPlaceListItem[];
  city: string;
};

export function PlacesFeaturedRail({ places, city }: PlacesFeaturedRailProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanScrollPrev(node.scrollLeft > 8);
    setCanScrollNext(node.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [places, updateScrollState]);

  if (places.length === 0) return null;

  function scrollByCards(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({
      left: direction * (CARD_WIDTH + CARD_GAP) * 2,
      behavior: "smooth",
    });
  }

  return (
    <section className="space-y-4" aria-labelledby="places-featured-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="places-featured-title" className="text-xl font-bold text-neutral-900">
          {PLACES_PORTAL_FEATURED_TITLE}
        </h2>
        <Link
          href={`/places?city=${encodeURIComponent(city)}#places-recent`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PLACES_PORTAL_FEATURED_CTA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="relative">
        <ul
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 pl-0.5 pr-14 sm:pr-20 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {places.map((place) => (
            <li
              key={place.id}
              className="w-[200px] shrink-0 snap-start sm:w-[208px]"
              style={{ scrollSnapStop: "always" }}
            >
              <FeaturedCard place={place} city={city} />
            </li>
          ))}
        </ul>

        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#F4F5F7] via-[#F4F5F7]/80 to-transparent sm:w-20"
          aria-hidden
        />

        {places.length > 2 ? (
          <div className="absolute right-1 top-[38%] z-10 hidden -translate-y-1/2 items-center gap-1.5 sm:flex">
            {canScrollPrev ? (
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Lieux précédents"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-700 shadow-md transition hover:border-yunicity-primary/30 hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            {canScrollNext ? (
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Lieux suivants"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-700 shadow-md ring-4 ring-[#F4F5F7] transition hover:border-yunicity-primary/30 hover:text-yunicity-primary focus:outline-none focus-visible:ring-yunicity-primary"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FeaturedCard({ place, city }: { place: CulturalPlaceListItem; city: string }) {
  const imageUrl = resolveCulturalPlaceDisplayUrl(place, "hero");
  const hood = place.neighborhood?.display_name ?? "Reims";
  const trust = formatPlaceTrustLine(place);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={buildPlaceHref(place, city)} className="relative block aspect-[4/5] overflow-hidden">
        <CulturalImage
          src={imageUrl}
          alt={place.name}
          placeName={place.name}
          className="h-full w-full"
          imageClassName="transition duration-300 group-hover:scale-[1.02]"
          sizes="208px"
          showFallbackCaption={false}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-neutral-900">
          {place.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-neutral-600">
          {place.editorial_excerpt || place.short_description}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {hood}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-neutral-700">
          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
          <span className="line-clamp-1">
            {PLACES_FEATURED_TRUST_PREFIX} {trust}
          </span>
        </p>
        <div className="mt-auto pt-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${placesCategoryBadgeTone(place.category)}`}
          >
            {culturalPlaceCategoryLabel(place.category)}
          </span>
        </div>
      </div>
    </article>
  );
}
