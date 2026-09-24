"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopSelectionCard } from "@yunicity/utils";
import {
  PLACES_DESKTOP_CARD_DETAIL,
  PLACES_DESKTOP_CARD_MAP,
  PLACES_DESKTOP_SAVE_SOON,
  PLACES_DESKTOP_SELECTION_TITLE,
  PLACES_DESKTOP_SELECTION_VIEW_ALL,
  PLACES_PORTAL_EMPTY,
} from "@yunicity/utils";
import { Bookmark, MapPin } from "lucide-react";
import Link from "next/link";

type PlacesDesktopSelectionGridProps = {
  items: PlacesDesktopSelectionCard[];
  city: string;
};

export function PlacesDesktopSelectionGrid({ items, city }: PlacesDesktopSelectionGridProps) {
  return (
    <section
      id="places-desktop-selection"
      className="scroll-mt-24 space-y-4"
      aria-labelledby="places-desktop-selection-title"
      data-places-desktop-selection=""
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="places-desktop-selection-title" className="text-lg font-bold text-neutral-900">
          {PLACES_DESKTOP_SELECTION_TITLE}
        </h2>
        {items.length > 0 ? (
          <Link
            href={`/places?city=${encodeURIComponent(city)}#places-desktop-selection`}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PLACES_DESKTOP_SELECTION_VIEW_ALL}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center">
          <p className="text-sm text-neutral-600">{PLACES_PORTAL_EMPTY}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <Link href={item.href} className="block">
                  <div className="relative aspect-[4/3] bg-neutral-200">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.title}
                      className="absolute inset-0 size-full"
                      sizes="(max-width: 1280px) 50vw, 320px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <span
                    className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.categoryTone}`}
                  >
                    {item.categoryBadge}
                  </span>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={item.href}
                      className="line-clamp-2 text-base font-bold leading-snug text-neutral-900 hover:text-yunicity-primary"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{item.locationLine}</span>
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
                    <button
                      type="button"
                      disabled
                      title={PLACES_DESKTOP_SAVE_SOON}
                      aria-label={PLACES_DESKTOP_SAVE_SOON}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400"
                    >
                      <Bookmark className="h-4 w-4" aria-hidden />
                    </button>
                    <Link
                      href={item.href}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-800 transition hover:border-neutral-300"
                    >
                      {PLACES_DESKTOP_CARD_DETAIL}
                    </Link>
                    <Link
                      href={item.mapHref}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-yunicity-primary transition hover:border-yunicity-primary/30 hover:bg-[#EEF0FF]"
                    >
                      {PLACES_DESKTOP_CARD_MAP}
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
