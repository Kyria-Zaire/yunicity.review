"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopSpotlightCard } from "@yunicity/utils";
import {
  PLACES_DESKTOP_FEATURED_CTA,
  PLACES_DESKTOP_FEATURED_DISCOVER_BADGE,
  PLACES_DESKTOP_FEATURED_SAVE,
  PLACES_DESKTOP_SAVE_SOON,
  PLACES_DESKTOP_SPOTLIGHT_FALLBACK_BODY,
  PLACES_DESKTOP_SPOTLIGHT_FALLBACK_TITLE,
  PLACES_MOBILE_FEATURED_MAP,
} from "@yunicity/utils";
import { Bookmark, MapPin } from "lucide-react";
import Link from "next/link";

type PlacesMobileFeaturedSpotlightProps = {
  spotlight: PlacesDesktopSpotlightCard | null;
};

export function PlacesMobileFeaturedSpotlight({ spotlight }: PlacesMobileFeaturedSpotlightProps) {
  if (!spotlight) {
    return (
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm" data-places-mobile-spotlight="">
        <h2 className="text-base font-bold text-neutral-900">{PLACES_DESKTOP_SPOTLIGHT_FALLBACK_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{PLACES_DESKTOP_SPOTLIGHT_FALLBACK_BODY}</p>
      </div>
    );
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-places-mobile-spotlight=""
    >
      <div className="relative aspect-[16/10] bg-neutral-900">
        <CulturalImage
          src={spotlight.imageUrl}
          alt=""
          placeName={spotlight.title}
          className="absolute inset-0 size-full"
          sizes="100vw"
          showFallbackCaption={false}
          dimOverlay={false}
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            {PLACES_DESKTOP_FEATURED_DISCOVER_BADGE}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${spotlight.categoryTone}`}
          >
            {spotlight.categoryBadge}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-bold leading-snug text-neutral-900">{spotlight.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{spotlight.subtitle}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {spotlight.locationLine}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {spotlight.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={spotlight.href}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white"
        >
          {PLACES_DESKTOP_FEATURED_CTA}
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            title={PLACES_DESKTOP_SAVE_SOON}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-800"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
            {PLACES_DESKTOP_FEATURED_SAVE}
          </button>
          <Link
            href={spotlight.mapHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-yunicity-primary"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {PLACES_MOBILE_FEATURED_MAP}
          </Link>
        </div>
      </div>
    </article>
  );
}
