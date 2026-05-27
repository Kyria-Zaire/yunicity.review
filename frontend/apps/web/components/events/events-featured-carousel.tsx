"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { FeaturedCarouselItem } from "@yunicity/utils";
import { EVENTS_FEATURED_EMPTY, EVENTS_FEATURED_SUBTITLE, EVENTS_FEATURED_TITLE } from "@yunicity/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";

type EventsFeaturedCarouselProps = {
  items: FeaturedCarouselItem[];
};

const SCROLL_STEP_RATIO = 0.75;

export function EventsFeaturedCarousel({ items }: EventsFeaturedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = el.clientWidth * SCROLL_STEP_RATIO;
    el.scrollBy({ left: direction === "left" ? -delta : delta, behavior: "smooth" });
  }, []);

  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-bold text-neutral-900">{EVENTS_FEATURED_TITLE}</h2>
          <p className="mt-1 text-sm text-neutral-600">{EVENTS_FEATURED_SUBTITLE}</p>
        </header>
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
          {EVENTS_FEATURED_EMPTY}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label={EVENTS_FEATURED_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <header className="min-w-0">
          <h2 className="text-xl font-bold text-neutral-900">{EVENTS_FEATURED_TITLE}</h2>
          <p className="mt-1 text-sm text-neutral-600">{EVENTS_FEATURED_SUBTITLE}</p>
        </header>
        <div className="flex shrink-0 items-center gap-2">
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
        className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max gap-4">
          {items.map((item) => (
            <li key={item.id} className="w-[17.5rem] shrink-0 sm:w-[18.5rem]">
              <FeaturedCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const FEATURED_BADGE_CLASS =
  "bg-yunicity-primary text-white shadow-sm ring-1 ring-white/25";

function FeaturedCard({ item }: { item: FeaturedCarouselItem }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <CulturalImage
          src={item.imageUrl}
          alt={item.title}
          placeName={item.title}
          className="h-full w-full"
          sizes="296px"
          showFallbackCaption={false}
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${FEATURED_BADGE_CLASS}`}
        >
          {item.badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
          {item.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-neutral-500">{item.subtitle}</p>
        <Link
          href={item.href}
          className="mt-auto inline-flex pt-4 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {item.ctaLabel} →
        </Link>
      </div>
    </article>
  );
}
