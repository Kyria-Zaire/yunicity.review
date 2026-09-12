"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirLiveEventCard } from "@yunicity/utils";
import {
  SORTIR_DESKTOP_CARD_DETAIL,
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

type SortirDesktopTonightGridProps = {
  items: SortirLiveEventCard[];
};

export function SortirDesktopTonightGrid({ items }: SortirDesktopTonightGridProps) {
  return (
    <section className="space-y-4" aria-labelledby="sortir-tonight-title" data-sortir-tonight-grid="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sortir-tonight-title" className="text-lg font-bold text-neutral-900">
          {SORTIR_DESKTOP_TONIGHT_TITLE}
        </h2>
        {items.length > 0 ? (
          <a href="#sortir-tonight-grid" className="text-sm font-semibold text-yunicity-primary hover:underline">
            {SORTIR_DESKTOP_TONIGHT_VIEW_ALL}
          </a>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center">
          <p className="text-sm text-neutral-600">{SORTIR_LIVE_EVENTS_EMPTY}</p>
          <Link href="/places" className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline">
            {SORTIR_LIVE_EVENTS_EMPTY_CTA}
          </Link>
        </div>
      ) : (
        <ul id="sortir-tonight-grid" className="sortir-tonight-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <Link href={item.href} className="block">
                  <div className="relative aspect-[16/10] bg-neutral-200">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.title}
                      className="absolute inset-0 size-full"
                      sizes="(max-width: 1280px) 50vw, 320px"
                      showFallbackCaption={false}
                    />
                  </div>
                </Link>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <span
                    className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_TONE[item.badgeTone]}`}
                  >
                    {item.badge}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={item.href}
                      className="line-clamp-2 text-base font-bold leading-snug text-neutral-900 hover:text-yunicity-primary"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1.5 flex items-start gap-2">
                      <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-neutral-500">
                        <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">
                          {item.timeLabel}
                          <span aria-hidden> · </span>
                          {item.locationLine}
                        </span>
                      </p>
                      <button
                        type="button"
                        disabled
                        title={SORTIR_DESKTOP_SAVE_SOON}
                        aria-label={SORTIR_MOBILE_BOOKMARK_ARIA}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400"
                      >
                        <Bookmark className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {SORTIR_DESKTOP_CARD_DETAIL}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
