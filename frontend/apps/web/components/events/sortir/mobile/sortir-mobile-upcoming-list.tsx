"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { SortirEmptyState } from "@/components/events/sortir/sortir-empty-state";
import type { SortirMobileUpcomingRow } from "@yunicity/utils";
import {
  SORTIR_LIVE_EVENTS_EMPTY,
  SORTIR_LIVE_EVENTS_EMPTY_CTA,
  SORTIR_MOBILE_BOOKMARK_ARIA,
  SORTIR_MOBILE_BOOKMARK_SOON,
  SORTIR_MOBILE_UPCOMING_TITLE,
  SORTIR_MOBILE_VIEW_ALL,
  sortirMobileCategoryBadgeClass,
  sortirMobileDateColumnClass,
} from "@yunicity/utils";
import { Bookmark, Clock3, Heart, Users } from "lucide-react";
import Link from "next/link";

type SortirMobileUpcomingListProps = {
  items: SortirMobileUpcomingRow[];
};

/** Liste « Prochains événements » mobile (MOBILE-SORTIR-01). */
export function SortirMobileUpcomingList({ items }: SortirMobileUpcomingListProps) {
  return (
    <section id="sortir-mobile-upcoming" className="scroll-mt-24 space-y-3" aria-label={SORTIR_MOBILE_UPCOMING_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{SORTIR_MOBILE_UPCOMING_TITLE}</h2>
        <Link href="/events" className="text-sm font-semibold text-yunicity-primary">
          {SORTIR_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      {items.length === 0 ? (
        <SortirEmptyState
          message={SORTIR_LIVE_EVENTS_EMPTY}
          ctaLabel={SORTIR_LIVE_EVENTS_EMPTY_CTA}
          ctaHref="/places"
        />
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 bg-white">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-start gap-3 p-3 transition hover:bg-neutral-50">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.title}
                    className="size-full object-cover"
                    sizes="64px"
                    showFallbackCaption={false}
                  />
                  <span className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white">
                    <Heart
                      className={`h-3 w-3 ${item.interestedByMe ? "fill-white" : ""}`}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                </div>

                <div
                  className={`flex w-11 shrink-0 flex-col items-center pt-0.5 text-center ${sortirMobileDateColumnClass(item.badgeTone)}`}
                >
                  <span className="text-[10px] font-bold leading-none">{item.weekdayLabel}</span>
                  <span className="text-xl font-bold leading-none">{item.dayNumber}</span>
                  <span className="text-[10px] font-semibold leading-none">{item.monthLabel}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-bold text-neutral-900">{item.title}</h3>
                    <button
                      type="button"
                      disabled
                      title={SORTIR_MOBILE_BOOKMARK_SOON}
                      aria-label={SORTIR_MOBILE_BOOKMARK_ARIA}
                      onClick={(event) => event.preventDefault()}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 opacity-60"
                    >
                      <Bookmark className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{item.locationDetail}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
                      {item.timeLabel}
                    </span>
                    {item.metaLine ? (
                      <>
                        <span className="text-neutral-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
                          {item.metaLine}
                        </span>
                      </>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sortirMobileCategoryBadgeClass(item.badgeTone)}`}
                    >
                      {item.categoryLabel}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
