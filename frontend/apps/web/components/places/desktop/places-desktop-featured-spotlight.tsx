"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopSpotlightCard } from "@yunicity/utils";
import {
  PLACES_DESKTOP_FEATURED_CTA,
  PLACES_DESKTOP_FEATURED_DISCOVER_BADGE,
  PLACES_DESKTOP_FEATURED_MAP,
  PLACES_DESKTOP_FEATURED_SAVE,
  PLACES_DESKTOP_SAVE_SOON,
  PLACES_DESKTOP_SPOTLIGHT_FALLBACK_BODY,
  PLACES_DESKTOP_SPOTLIGHT_FALLBACK_TITLE,
} from "@yunicity/utils";
import { Bookmark, MapPin } from "lucide-react";
import Link from "next/link";

type PlacesDesktopFeaturedSpotlightProps = {
  spotlight: PlacesDesktopSpotlightCard | null;
};

export function PlacesDesktopFeaturedSpotlight({ spotlight }: PlacesDesktopFeaturedSpotlightProps) {
  if (!spotlight) {
    return (
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900">{PLACES_DESKTOP_SPOTLIGHT_FALLBACK_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{PLACES_DESKTOP_SPOTLIGHT_FALLBACK_BODY}</p>
      </div>
    );
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-places-desktop-spotlight=""
    >
      <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="relative min-h-[240px] bg-neutral-900">
          <CulturalImage
            src={spotlight.imageUrl}
            alt=""
            placeName={spotlight.title}
            className="absolute inset-0 size-full"
            sizes="(max-width: 1280px) 100vw, 560px"
            showFallbackCaption={false}
            dimOverlay={false}
          />
        </div>

        <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
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
            <h2 className="text-xl font-bold leading-snug text-neutral-900">{spotlight.title}</h2>
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

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={spotlight.href}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:w-auto"
            >
              {PLACES_DESKTOP_FEATURED_CTA}
            </Link>
            <button
              type="button"
              disabled
              title={PLACES_DESKTOP_SAVE_SOON}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 sm:w-auto"
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              {PLACES_DESKTOP_FEATURED_SAVE}
            </button>
          </div>

          <Link
            href={spotlight.mapHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {PLACES_DESKTOP_FEATURED_MAP}
          </Link>
        </div>
      </div>
    </article>
  );
}
