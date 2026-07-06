"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirLiveEventCard } from "@yunicity/utils";
import {
  SORTIR_MOBILE_FEATURED_TITLE,
  SORTIR_MOBILE_VIEW_ALL,
  sortirMobileCategoryBadgeClass,
} from "@yunicity/utils";
import { Clock3, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

const BADGE_TONE: Record<SortirLiveEventCard["badgeTone"], string> = {
  concert: "bg-violet-600/95",
  tasting: "bg-pink-600/95",
  exhibition: "bg-blue-600/95",
  default: "bg-yunicity-primary/95",
};

type SortirMobileFeaturedCarouselProps = {
  items: SortirLiveEventCard[];
};

/** Carousel « À ne pas manquer » mobile (MOBILE-SORTIR-01). */
export function SortirMobileFeaturedCarousel({ items }: SortirMobileFeaturedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || items.length === 0) return;
    const index = Math.round(el.scrollLeft / Math.max(el.clientWidth * 0.72, 1));
    setActiveDot(Math.min(index, items.length - 1));
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={SORTIR_MOBILE_FEATURED_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{SORTIR_MOBILE_FEATURED_TITLE}</h2>
        <a href="#sortir-mobile-upcoming" className="text-sm font-semibold text-yunicity-primary">
          {SORTIR_MOBILE_VIEW_ALL} →
        </a>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max gap-3">
          {items.map((item) => (
            <li key={item.id} className="w-[72vw] max-w-[17rem] shrink-0 sm:w-[17rem]">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${BADGE_TONE[item.badgeTone]}`}
                  >
                    {item.badge}
                  </span>
                  <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white">
                    <Heart
                      className={`h-4 w-4 ${item.interestedByMe ? "fill-white" : ""}`}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-4 text-white">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      {item.timeLabel}
                    </p>
                    <h3 className="line-clamp-2 text-base font-bold leading-snug">{item.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-white/80">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {item.locationLine}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${sortirMobileCategoryBadgeClass(item.badgeTone)}`}
                    >
                      {item.badge.charAt(0) + item.badge.slice(1).toLowerCase()}
                    </span>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {items.length > 1 ? (
        <div className="flex justify-center gap-1.5" aria-hidden>
          {items.slice(0, 5).map((item, index) => (
            <span
              key={item.id}
              className={`h-1.5 rounded-full transition-all ${
                index === activeDot ? "w-4 bg-yunicity-primary" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
