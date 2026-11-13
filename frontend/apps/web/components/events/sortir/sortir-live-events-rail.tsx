"use client";

import { SortirEmptyState } from "@/components/events/sortir/sortir-empty-state";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirLiveEventCard } from "@yunicity/utils";
import {
  SORTIR_LIVE_EVENTS_CTA,
  SORTIR_LIVE_EVENTS_EMPTY,
  SORTIR_LIVE_EVENTS_EMPTY_CTA,
  SORTIR_LIVE_EVENTS_TITLE,
} from "@yunicity/utils";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";

const BADGE_TONE: Record<SortirLiveEventCard["badgeTone"], string> = {
  concert: "bg-violet-600/95",
  tasting: "bg-pink-600/95",
  exhibition: "bg-blue-600/95",
  local: "bg-emerald-600/95",
  default: "bg-yunicity-primary/95",
};

type SortirLiveEventsRailProps = {
  items: SortirLiveEventCard[];
  categoryFilterActive?: boolean;
  onClearCategory?: () => void;
};

export function SortirLiveEventsRail({
  items,
  categoryFilterActive = false,
  onClearCategory,
}: SortirLiveEventsRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: "smooth" });
  }, []);

  return (
    <section id="sortir-live-events" className="scroll-mt-24 space-y-4" aria-label={SORTIR_LIVE_EVENTS_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-900">{SORTIR_LIVE_EVENTS_TITLE}</h2>
        {categoryFilterActive && onClearCategory ? (
          <button
            type="button"
            onClick={onClearCategory}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {SORTIR_LIVE_EVENTS_CTA}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <SortirEmptyState
          message={SORTIR_LIVE_EVENTS_EMPTY}
          ctaLabel={SORTIR_LIVE_EVENTS_EMPTY_CTA}
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
                  <Link href={item.href} className="group block">
                    <article className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900 shadow-sm">
                      <CulturalImage
                        src={item.imageUrl}
                        alt=""
                        placeName={item.title}
                        className="absolute inset-0 size-full"
                        sizes="288px"
                        showFallbackCaption={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${BADGE_TONE[item.badgeTone]}`}
                      >
                        {item.badge}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white">
                        <h3 className="text-lg font-bold leading-snug">{item.title}</h3>
                        <p className="text-sm text-white/85">{item.subtitle}</p>
                        <ul className="space-y-1 text-xs text-white/80">
                          <li className="flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5" aria-hidden />
                            {item.timeLabel}
                          </li>
                          {item.metaLine ? (
                            <li className="flex items-center gap-2">
                              {item.metaLine.includes("intéressé") ? (
                                <Users className="h-3.5 w-3.5" aria-hidden />
                              ) : (
                                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                              )}
                              {item.metaLine}
                            </li>
                          ) : null}
                          <li className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" aria-hidden />
                            {item.locationLine}
                          </li>
                        </ul>
                      </div>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {items.length > 2 ? (
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Défiler vers la droite"
              className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-yunicity-primary shadow-md sm:inline-flex"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
          <button type="button" onClick={() => scroll("left")} className="sr-only">
            <ChevronLeft aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
