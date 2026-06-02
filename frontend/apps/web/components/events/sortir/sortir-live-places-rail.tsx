"use client";

import { SortirEmptyState } from "@/components/events/sortir/sortir-empty-state";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirLivePlaceCard } from "@yunicity/utils";
import {
  SORTIR_LIVE_PLACES_BUTTON,
  SORTIR_LIVE_PLACES_CTA,
  SORTIR_LIVE_PLACES_EMPTY,
  SORTIR_LIVE_PLACES_EMPTY_CTA,
  SORTIR_LIVE_PLACES_TITLE,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";

const MOOD_CLASS: Record<SortirLivePlaceCard["moodTone"], string> = {
  lively: "bg-pink-600/90",
  calm: "bg-amber-700/90",
  music: "bg-violet-700/90",
  culture: "bg-blue-700/90",
};

type SortirLivePlacesRailProps = {
  items: SortirLivePlaceCard[];
};

export function SortirLivePlacesRail({ items }: SortirLivePlacesRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.75, behavior: "smooth" });
  }, []);

  return (
    <section className="space-y-4" aria-label={SORTIR_LIVE_PLACES_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-900">{SORTIR_LIVE_PLACES_TITLE}</h2>
        <Link href="/places" className="text-sm font-semibold text-yunicity-primary hover:underline">
          {SORTIR_LIVE_PLACES_CTA}
        </Link>
      </div>

      {items.length === 0 ? (
        <SortirEmptyState
          message={SORTIR_LIVE_PLACES_EMPTY}
          ctaLabel={SORTIR_LIVE_PLACES_EMPTY_CTA}
          ctaHref="/places"
        />
      ) : (
        <div className="relative">
          <div
            ref={scrollerRef}
            className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex min-w-max gap-4">
              {items.map((item) => (
                <li key={item.id} className="w-[17rem] shrink-0 sm:w-[18rem]">
                  <article className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900 shadow-sm">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.name}
                      className="absolute inset-0 size-full"
                      sizes="288px"
                      showFallbackCaption={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                    <div className="absolute inset-x-0 bottom-0 space-y-3 p-4 text-white">
                      <div>
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <p className="mt-1 text-sm text-white/85">{item.subtitle}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${MOOD_CLASS[item.moodTone]}`}
                      >
                        {item.moodLabel}
                      </span>
                      <Link
                        href={item.href}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-100"
                      >
                        {SORTIR_LIVE_PLACES_BUTTON}
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
          {items.length > 2 ? (
            <button
              type="button"
              onClick={scroll}
              aria-label="Défiler vers la droite"
              className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-yunicity-primary shadow-md sm:inline-flex"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
