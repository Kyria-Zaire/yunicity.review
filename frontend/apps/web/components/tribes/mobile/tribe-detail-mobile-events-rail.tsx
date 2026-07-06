"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribeDetailEventCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MOBILE_EVENTS_TITLE,
  TRIBE_DETAIL_MOBILE_VIEW_ALL,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type TribeDetailMobileEventsRailProps = {
  events: TribeDetailEventCard[];
  onViewAll?: () => void;
};

/** Carrousel événements détail tribu mobile (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobileEventsRail({ events, onViewAll }: TribeDetailMobileEventsRailProps) {
  if (events.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_EVENTS_TITLE}</h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-semibold text-yunicity-primary"
          >
            {TRIBE_DETAIL_MOBILE_VIEW_ALL} →
          </button>
        ) : null}
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {events.map((event) => (
            <li key={event.id} className="w-[11.5rem] shrink-0">
              <Link
                href={event.href}
                className="block overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-neutral-100">
                  {event.imageUrl ? (
                    <CulturalImage
                      src={event.imageUrl}
                      alt=""
                      placeName={event.title}
                      className="size-full object-cover"
                      sizes="184px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  ) : null}
                  <div className="absolute left-2 top-2 overflow-hidden rounded-lg bg-white text-center shadow-sm">
                    <div className="bg-pink-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                      {event.dateBadgeMonth}
                    </div>
                    <div className="px-2 py-1">
                      <p className="text-lg font-bold leading-none text-neutral-900">{event.dateBadgeDate}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 p-3">
                  <h3 className="line-clamp-2 text-sm font-bold text-neutral-900">{event.title}</h3>
                  <p className="text-xs text-neutral-600">{event.timeLabel}</p>
                  <p className="flex items-center gap-1 text-[11px] text-neutral-500">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="line-clamp-1">{event.locationLabel}</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
