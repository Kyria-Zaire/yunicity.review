"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { LocalEvent } from "@yunicity/types";
import type { EventDesktopBadge } from "@yunicity/utils";
import {
  EVENT_DETAIL_DESKTOP_SIMILAR_CTA,
  EVENT_DETAIL_DESKTOP_SIMILAR_TITLE,
  EVENT_DETAIL_DESKTOP_SIMILAR_VIEW_ALL,
  eventDesktopSimilarBadgeLabel,
  eventDesktopSimilarBadgeTone,
  formatEventClockTime,
  resolveFeaturedCarouselEventImage,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const BADGE_CLASS: Record<EventDesktopBadge["tone"], string> = {
  culture: "bg-blue-100 text-blue-700",
  featured: "bg-amber-100 text-amber-900",
  music: "bg-pink-100 text-pink-700",
  food: "bg-orange-100 text-orange-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-neutral-100 text-neutral-700",
};

type EventMediumSimilarRailProps = {
  events: LocalEvent[];
};

export function EventMediumSimilarRail({ events }: EventMediumSimilarRailProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const items = events.slice(0, 6);

  if (items.length === 0) return null;

  function scrollNext() {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: Math.min(280, node.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <section className="space-y-3" data-event-medium-similar="">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_SIMILAR_TITLE}</h2>
        <Link
          href="/sortir"
          className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {EVENT_DETAIL_DESKTOP_SIMILAR_VIEW_ALL}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="relative">
        <ul
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const imageUrl = resolveFeaturedCarouselEventImage(item);
            const badgeLabel = eventDesktopSimilarBadgeLabel(item.event_type);
            const badgeTone = eventDesktopSimilarBadgeTone(item.event_type);
            const metaLine = `${formatEventClockTime(item.starts_at)} · ${item.district?.trim() || item.location_name}`;
            return (
              <li key={item.id} className="w-[13.5rem] shrink-0">
                <Link
                  href={`/events/${item.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10] bg-neutral-100">
                    <CulturalImage
                      src={imageUrl}
                      alt=""
                      placeName={item.title}
                      className="absolute inset-0 size-full"
                      sizes="220px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <span
                      className={`inline-flex w-fit rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${BADGE_CLASS[badgeTone]}`}
                    >
                      {badgeLabel}
                    </span>
                    <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">{metaLine}</p>
                    <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary">
                      {EVENT_DETAIL_DESKTOP_SIMILAR_CTA}
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        {items.length > 2 ? (
          <button
            type="button"
            onClick={scrollNext}
            className="absolute -right-1 top-1/2 z-[1] inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            aria-label="Voir les événements suivants"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
