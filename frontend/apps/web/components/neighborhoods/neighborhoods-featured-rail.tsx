"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodFeaturedCard, NeighborhoodPortalThemeSlug } from "@yunicity/utils";
import {
  NEIGHBORHOODS_PORTAL_CAFES_LABEL,
  NEIGHBORHOODS_PORTAL_EVENTS_WEEK_LABEL,
  NEIGHBORHOODS_PORTAL_FEATURED_CTA,
  NEIGHBORHOODS_PORTAL_FEATURED_TITLE,
  NEIGHBORHOODS_PORTAL_MOMENTS_LABEL,
} from "@yunicity/utils";
import { Bookmark, CalendarDays, ChevronRight, Coffee, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const THEME_BADGE: Record<NeighborhoodPortalThemeSlug, string> = {
  "saint-remi": "bg-blue-600/95",
  "centre-ville": "bg-pink-600/95",
  boulingrin: "bg-emerald-600/95",
  cernay: "bg-violet-600/95",
  clairmarais: "bg-teal-600/95",
  "croix-rouge": "bg-orange-600/95",
};

const THEME_BUTTON: Record<NeighborhoodPortalThemeSlug, string> = {
  "saint-remi": "bg-blue-600 hover:bg-blue-700",
  "centre-ville": "bg-pink-600 hover:bg-pink-700",
  boulingrin: "bg-emerald-600 hover:bg-emerald-700",
  cernay: "bg-violet-600 hover:bg-violet-700",
  clairmarais: "bg-teal-600 hover:bg-teal-700",
  "croix-rouge": "bg-orange-600 hover:bg-orange-700",
};

type NeighborhoodsFeaturedRailProps = {
  cards: NeighborhoodFeaturedCard[];
  onSeeAll: () => void;
};

export function NeighborhoodsFeaturedRail({ cards, onSeeAll }: NeighborhoodsFeaturedRailProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanScrollNext(node.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [cards, updateScrollState]);

  if (cards.length === 0) return null;

  return (
    <section
      id="neighborhoods-featured"
      className="scroll-mt-28 space-y-4"
      aria-labelledby="neighborhoods-featured-title"
    >
      <div className="flex items-end justify-between gap-3">
        <h2 id="neighborhoods-featured-title" className="text-xl font-bold text-neutral-900">
          {NEIGHBORHOODS_PORTAL_FEATURED_TITLE}
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOODS_PORTAL_FEATURED_CTA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="relative">
        <ul
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cards.map((card) => {
            const theme = card.themeSlug as NeighborhoodPortalThemeSlug;
            const badgeClass = THEME_BADGE[theme] ?? THEME_BADGE["centre-ville"];
            const buttonClass = THEME_BUTTON[theme] ?? THEME_BUTTON["centre-ville"];

            return (
              <li key={card.id} className="w-[min(100%,260px)] shrink-0 sm:w-[260px]">
                <Link
                  href={card.href}
                  className="group relative block h-[360px] overflow-hidden rounded-2xl border border-neutral-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CulturalImage
                    src={card.imageUrl}
                    alt={card.name}
                    placeName={card.name}
                    className="absolute inset-0"
                    imageClassName="transition duration-300 group-hover:scale-[1.03]"
                    sizes="260px"
                    showFallbackCaption={false}
                    overlay={false}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15"
                    aria-hidden
                  />

                  <span
                    className={`absolute left-3 top-3 inline-flex max-w-[85%] items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${badgeClass}`}
                  >
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="truncate">{card.name}</span>
                  </span>

                  <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm">
                    <Bookmark className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Favori — bientôt</span>
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="text-lg font-bold leading-snug">{card.headline}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/85">
                      {card.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/80">
                      <span>{NEIGHBORHOODS_PORTAL_MOMENTS_LABEL(card.momentsCount)}</span>
                      {card.cafesCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Coffee className="h-3 w-3" aria-hidden />
                          {NEIGHBORHOODS_PORTAL_CAFES_LABEL(card.cafesCount)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Coffee className="h-3 w-3" aria-hidden />
                          cafés
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden />
                        {NEIGHBORHOODS_PORTAL_EVENTS_WEEK_LABEL(card.eventsThisWeek)}
                      </span>
                    </div>

                    <span
                      className={`absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg ${buttonClass}`}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                      <span className="sr-only">Explorer {card.name}</span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {canScrollNext ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#F4F5F7] to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
    </section>
  );
}
