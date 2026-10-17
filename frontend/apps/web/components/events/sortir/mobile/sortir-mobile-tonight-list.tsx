"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirLiveEventCard } from "@yunicity/utils";
import {
  SORTIR_DESKTOP_SAVE_SOON,
  SORTIR_DESKTOP_TONIGHT_TITLE,
  SORTIR_DESKTOP_TONIGHT_VIEW_ALL,
  SORTIR_LIVE_EVENTS_EMPTY,
  SORTIR_LIVE_EVENTS_EMPTY_CTA,
  SORTIR_MOBILE_BOOKMARK_ARIA,
} from "@yunicity/utils";
import { Bookmark, Clock3 } from "lucide-react";
import Link from "next/link";

const BADGE_TONE: Record<SortirLiveEventCard["badgeTone"], string> = {
  concert: "bg-pink-100 text-pink-700",
  tasting: "bg-orange-100 text-orange-700",
  exhibition: "bg-blue-100 text-blue-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-blue-100 text-blue-700",
};

type SortirMobileTonightListProps = {
  items: SortirLiveEventCard[];
  soonRelativeLabelById?: Record<string, string>;
};

export function SortirMobileTonightList({
  items,
  soonRelativeLabelById = {},
}: SortirMobileTonightListProps) {
  return (
    <section className="space-y-3" aria-labelledby="sortir-mobile-tonight-title" data-sortir-mobile-tonight="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sortir-mobile-tonight-title" className="text-base font-bold text-neutral-900">
          {SORTIR_DESKTOP_TONIGHT_TITLE}
        </h2>
        {items.length > 0 ? (
          <a href="#sortir-mobile-tonight-list" className="text-sm font-semibold text-yunicity-primary">
            {SORTIR_DESKTOP_TONIGHT_VIEW_ALL}
          </a>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center">
          <p className="text-sm text-neutral-600">{SORTIR_LIVE_EVENTS_EMPTY}</p>
          <Link href="/places" className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary">
            {SORTIR_LIVE_EVENTS_EMPTY_CTA}
          </Link>
        </div>
      ) : (
        <ul id="sortir-mobile-tonight-list" className="space-y-3">
          {items.map((item) => {
            const soonLabel = soonRelativeLabelById[item.id];
            return (
              <li key={item.id}>
                <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                  <div className="flex gap-3 p-3">
                    <Link href={item.href} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                      <CulturalImage
                        src={item.imageUrl}
                        alt=""
                        placeName={item.title}
                        className="absolute inset-0 size-full"
                        sizes="96px"
                        showFallbackCaption={false}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_TONE[item.badgeTone]}`}
                        >
                          {item.badge}
                        </span>
                        <button
                          type="button"
                          disabled
                          title={SORTIR_DESKTOP_SAVE_SOON}
                          aria-label={SORTIR_MOBILE_BOOKMARK_ARIA}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400"
                        >
                          <Bookmark className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <Link
                        href={item.href}
                        className="mt-1 block line-clamp-2 text-sm font-bold leading-snug text-neutral-900"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        {item.timeLabel}
                        {item.locationLine ? ` · ${item.locationLine}` : ""}
                      </p>
                      {soonLabel ? (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                          <Clock3 className="h-3 w-3" aria-hidden />
                          {soonLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
