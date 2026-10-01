"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopSelectionCard } from "@yunicity/utils";
import {
  PLACES_DESKTOP_CARD_DETAIL,
  PLACES_DESKTOP_SAVE_SOON,
  PLACES_DESKTOP_SELECTION_TITLE,
  PLACES_DESKTOP_SELECTION_VIEW_ALL,
  PLACES_PORTAL_EMPTY,
} from "@yunicity/utils";
import { Bookmark, MapPin } from "lucide-react";
import Link from "next/link";

type PlacesMobileSelectionListProps = {
  items: PlacesDesktopSelectionCard[];
  city: string;
};

export function PlacesMobileSelectionList({ items, city }: PlacesMobileSelectionListProps) {
  return (
    <section className="space-y-3" aria-labelledby="places-mobile-selection-title" data-places-mobile-selection="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="places-mobile-selection-title" className="text-base font-bold text-neutral-900">
          {PLACES_DESKTOP_SELECTION_TITLE}
        </h2>
        {items.length > 0 ? (
          <Link
            href={`/places?city=${encodeURIComponent(city)}#places-mobile-selection`}
            className="text-xs font-semibold text-yunicity-primary"
          >
            {PLACES_DESKTOP_SELECTION_VIEW_ALL}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
          {PLACES_PORTAL_EMPTY}
        </p>
      ) : (
        <ul id="places-mobile-selection" className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <article className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
                <Link href={item.href} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.title}
                    className="absolute inset-0 size-full"
                    sizes="64px"
                    showFallbackCaption={false}
                    dimOverlay={false}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${item.categoryTone}`}
                  >
                    {item.categoryBadge}
                  </span>
                  <Link href={item.href} className="mt-1 block line-clamp-2 text-sm font-bold text-neutral-900">
                    {item.title}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="truncate">{item.locationLine}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    disabled
                    title={PLACES_DESKTOP_SAVE_SOON}
                    aria-label={PLACES_DESKTOP_SAVE_SOON}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-400"
                  >
                    <Bookmark className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-neutral-200 px-3 text-[11px] font-semibold text-neutral-800"
                  >
                    {PLACES_DESKTOP_CARD_DETAIL}
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
