"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SearchMobileEventRow } from "@yunicity/utils";
import {
  SEARCH_MOBILE_EVENTS_TITLE,
  SEARCH_MOBILE_VIEW_ALL,
} from "@yunicity/utils";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

type SearchMobileEventsListProps = {
  items: SearchMobileEventRow[];
  viewAllHref?: string;
};

/** Liste événements à venir mobile Recherche (MOBILE-SEARCH-01). */
export function SearchMobileEventsList({ items, viewAllHref = "/sortir" }: SearchMobileEventsListProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={SEARCH_MOBILE_EVENTS_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{SEARCH_MOBILE_EVENTS_TITLE}</h2>
        <Link href={viewAllHref} className="text-sm font-semibold text-yunicity-primary">
          {SEARCH_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 transition hover:bg-neutral-50/80"
            >
              <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {item.imageUrl ? (
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.title}
                    className="size-full object-cover"
                    sizes="72px"
                    showFallbackCaption={false}
                    overlay={false}
                  />
                ) : null}
                <div className="absolute left-1.5 top-1.5 overflow-hidden rounded-md bg-white text-center shadow-sm">
                  <div className="bg-pink-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                    {item.dateBadgeMonth}
                  </div>
                  <div className="px-1.5 py-0.5 text-sm font-bold leading-none text-neutral-900">
                    {item.dateBadgeDay}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-bold text-neutral-900">{item.title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600">{item.locationName}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-neutral-500">
                  <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                  {item.dateLine} · {item.timeLabel}
                </p>
                {item.interestLine ? (
                  <p className="mt-1 text-[11px] font-semibold text-yunicity-primary">
                    {item.interestLine}
                  </p>
                ) : null}
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
