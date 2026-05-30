"use client";

import type { MapAroundYouItem } from "@yunicity/utils";
import {
  MAP_PORTAL_AROUND_EMPTY,
  MAP_PORTAL_AROUND_SEE_ALL,
  MAP_PORTAL_AROUND_TITLE,
  MAP_PORTAL_DISTANCE_AWAY,
  MAP_PORTAL_EVENT_TAG,
  MAP_PORTAL_PLACE_TAG,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type MapAroundYouCarouselProps = {
  items: MapAroundYouItem[];
  onSelectItem: (item: MapAroundYouItem) => void;
};

export function MapAroundYouCarousel({ items, onSelectItem }: MapAroundYouCarouselProps) {
  if (items.length === 0) {
    return (
      <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-neutral-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:inset-x-4">
        <h2 className="text-sm font-bold text-neutral-900">{MAP_PORTAL_AROUND_TITLE}</h2>
        <p className="mt-2 text-sm text-neutral-500">{MAP_PORTAL_AROUND_EMPTY}</p>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
      <div className="pointer-events-auto rounded-2xl border border-neutral-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{MAP_PORTAL_AROUND_TITLE}</h2>
          <Link
            href="/events"
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_PORTAL_AROUND_SEE_ALL}
          </Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              onClick={() => onSelectItem(item)}
              className="w-44 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white text-left transition hover:border-yunicity-primary/40 hover:shadow-md"
            >
              <div className="relative h-24 bg-neutral-100">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    {item.kind === "event" ? MAP_PORTAL_EVENT_TAG : MAP_PORTAL_PLACE_TAG}
                  </div>
                )}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                    item.kind === "event" ? "bg-violet-600" : "bg-sky-600"
                  }`}
                >
                  {item.kind === "event" ? MAP_PORTAL_EVENT_TAG : MAP_PORTAL_PLACE_TAG}
                </span>
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-sm font-bold text-neutral-900">{item.title}</p>
                <p className="line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-yunicity-primary">
                    {MAP_PORTAL_DISTANCE_AWAY(item.distanceMeters)}
                  </span>
                  <span className="text-neutral-500">{item.meta}</span>
                </div>
              </div>
            </button>
          ))}
          <span
            className="flex w-10 shrink-0 items-center justify-center self-center rounded-full border border-neutral-200 bg-white text-neutral-400"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
