"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodsMobileDiscoverSlide } from "@yunicity/utils";
import {
  NEIGHBORHOODS_MOBILE_DISCOVER_EXPLORE,
  NEIGHBORHOODS_MOBILE_DISCOVER_TITLE,
} from "@yunicity/utils";
import { MapPin, Music2, UtensilsCrossed, Wine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type NeighborhoodsMobileDiscoverCarouselProps = {
  slides: NeighborhoodsMobileDiscoverSlide[];
};

/** Carousel « Découvrir les quartiers » mobile (MOBILE-QUARTIERS-01). */
export function NeighborhoodsMobileDiscoverCarousel({
  slides,
}: NeighborhoodsMobileDiscoverCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (slides.length === 0) return null;

  const slide = slides[Math.min(activeIndex, slides.length - 1)]!;

  return (
    <section className="space-y-3" aria-label={NEIGHBORHOODS_MOBILE_DISCOVER_TITLE}>
      <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOODS_MOBILE_DISCOVER_TITLE}</h2>

      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="grid min-h-[220px] grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="relative z-10 m-3 flex flex-col justify-between rounded-xl border border-neutral-100 bg-white p-3 shadow-sm">
            <div className="flex gap-2">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <CulturalImage
                  src={slide.imageUrl}
                  alt=""
                  placeName={slide.name}
                  className="size-full object-cover"
                  sizes="48px"
                  showFallbackCaption={false}
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-neutral-900">{slide.name}</h3>
                <p className="text-xs text-neutral-500">{slide.city}</p>
                <p className="mt-0.5 text-[11px] font-medium text-neutral-600">{slide.statsLine}</p>
              </div>
            </div>

            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neutral-600">
              {slide.description}
            </p>

            <Link
              href={slide.href}
              className="mt-3 inline-flex w-fit rounded-full bg-yunicity-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              {NEIGHBORHOODS_MOBILE_DISCOVER_EXPLORE}
            </Link>
          </div>

          <Link
            href={slide.mapHref}
            className="relative overflow-hidden bg-[linear-gradient(135deg,#E8F4FC_0%,#D4E8F7_50%,#C5DCF0_100%)]"
            aria-label={`Voir ${slide.name} sur la carte`}
          >
            <div className="absolute inset-0 opacity-30" aria-hidden>
              <svg viewBox="0 0 120 120" className="h-full w-full text-sky-200/80">
                <path
                  d="M0 40h120M0 80h120M40 0v120M80 0v120"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  fill="none"
                />
              </svg>
            </div>
            <span className="absolute left-[18%] top-[22%] inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-white shadow-md">
              <Music2 className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="absolute left-[55%] top-[35%] inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-md">
              <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="absolute left-[38%] top-[58%] inline-flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-white shadow-md">
              <Wine className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="absolute right-[18%] top-[48%] inline-flex h-8 w-8 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg ring-4 ring-yunicity-primary/20">
              <MapPin className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Afficher ${item.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-2 rounded-full transition ${
                index === activeIndex ? "w-5 bg-yunicity-primary" : "w-2 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
