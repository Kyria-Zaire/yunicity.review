"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodAtmosphereItem } from "@yunicity/utils";
import {
  EVENTS_NEIGHBORHOOD_ATMOSPHERE_SUBTITLE,
  EVENTS_NEIGHBORHOOD_ATMOSPHERE_TITLE,
  EVENTS_NEIGHBORHOOD_CTA,
  EVENTS_NEIGHBORHOOD_MAP_CTA,
  NEIGHBORHOOD_ATMOSPHERE_TAG_LABELS,
} from "@yunicity/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";

type EventsNeighborhoodAtmosphereProps = {
  items: NeighborhoodAtmosphereItem[];
};

const SCROLL_STEP_RATIO = 0.75;

export function EventsNeighborhoodAtmosphere({ items }: EventsNeighborhoodAtmosphereProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = el.clientWidth * SCROLL_STEP_RATIO;
    el.scrollBy({ left: direction === "left" ? -delta : delta, behavior: "smooth" });
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label={EVENTS_NEIGHBORHOOD_ATMOSPHERE_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <header className="min-w-0">
          <h2 className="text-xl font-bold text-neutral-900">{EVENTS_NEIGHBORHOOD_ATMOSPHERE_TITLE}</h2>
          <p className="mt-1 text-sm text-neutral-600">{EVENTS_NEIGHBORHOOD_ATMOSPHERE_SUBTITLE}</p>
        </header>
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Faire défiler vers la gauche"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Faire défiler vers la droite"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-1 overflow-x-auto px-1 pb-1 lg:overflow-visible lg:px-0 [scrollbar-width:none] lg:[scrollbar-width:auto] [&::-webkit-scrollbar]:hidden lg:[&::-webkit-scrollbar]:auto"
      >
        <ul className="flex min-w-max gap-4 lg:grid lg:min-w-0 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="w-[17.5rem] shrink-0 sm:w-[18.5rem] lg:w-auto">
              <AtmosphereCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AtmosphereCard({ item }: { item: NeighborhoodAtmosphereItem }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        {item.imageUrl ? (
          <CulturalImage
            src={item.imageUrl}
            alt={item.name}
            placeName={item.name}
            className="h-full w-full"
            sizes="(max-width: 1024px) 296px, 33vw"
            showFallbackCaption={false}
          />
        ) : (
          <div
            className="flex h-full flex-col justify-end bg-gradient-to-br from-neutral-100 via-neutral-50 to-yunicity-primary/10 p-4"
            style={item.accentColor ? { backgroundColor: item.accentColor } : undefined}
          >
            <p className="text-sm font-semibold text-neutral-800">{item.name}</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-bold text-neutral-900 group-hover:text-yunicity-primary">
          {item.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.editorialLine}</p>

        {item.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Ambiances du quartier">
            {item.tags.map((tag) => (
              <li key={tag}>
                <span className="inline-flex rounded-full border border-yunicity-primary/15 bg-yunicity-primary-soft/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yunicity-primary">
                  {NEIGHBORHOOD_ATMOSPHERE_TAG_LABELS[tag]}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
          <Link
            href={item.neighborhoodHref}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {EVENTS_NEIGHBORHOOD_CTA} →
          </Link>
          <Link
            href={item.mapHref}
            className="text-sm font-medium text-neutral-500 hover:text-yunicity-primary hover:underline"
          >
            {EVENTS_NEIGHBORHOOD_MAP_CTA}
          </Link>
        </div>
      </div>
    </article>
  );
}
