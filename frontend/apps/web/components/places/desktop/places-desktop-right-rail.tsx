"use client";

import { PlacesDesktopAroundPreviewBlock } from "@/components/places/desktop/places-desktop-around-preview";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopAroundPreview, PlacesDesktopDiscoverRow } from "@yunicity/utils";
import {
  PLACES_DESKTOP_AROUND_TITLE,
  PLACES_DESKTOP_DISCOVER_TITLE,
  PLACES_DESKTOP_DISCOVER_VIEW_ALL,
  PLACES_DESKTOP_NAV_SAVED,
  PLACES_DESKTOP_NAV_VISITED,
  PLACES_DESKTOP_TRUST_BODY,
  PLACES_DESKTOP_TRUST_CTA,
  PLACES_DESKTOP_TRUST_TITLE,
  PLACES_DESKTOP_YOUR_PLACES_TITLE,
  placesDesktopMapHref,
} from "@yunicity/utils";
import { Bookmark, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

type PlacesDesktopRightRailProps = {
  city: string;
  geolocationEnabled: boolean;
  aroundPreview: PlacesDesktopAroundPreview;
  onEnableGeolocation: () => void;
  discoverRows: PlacesDesktopDiscoverRow[];
};

export function PlacesDesktopRightRail({
  city,
  geolocationEnabled,
  aroundPreview,
  onEnableGeolocation,
  discoverRows,
}: PlacesDesktopRightRailProps) {
  return (
    <aside className="places-desktop-right-rail" aria-label="Repères personnels" data-places-desktop-right-rail="">
      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="places-around-title">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 id="places-around-title" className="text-sm font-bold text-neutral-900">
            {PLACES_DESKTOP_AROUND_TITLE}
          </h2>
        </div>
        <div className="p-4">
          <PlacesDesktopAroundPreviewBlock
            geolocationEnabled={geolocationEnabled}
            preview={aroundPreview}
            onEnableGeolocation={onEnableGeolocation}
          />
        </div>
      </section>

      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="places-your-places-title">
        <h2
          id="places-your-places-title"
          className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
        >
          {PLACES_DESKTOP_YOUR_PLACES_TITLE}
        </h2>
        <ul className="divide-y divide-neutral-100">
          <li>
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Bookmark className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              <span className="flex-1 text-sm font-medium text-neutral-900">{PLACES_DESKTOP_NAV_SAVED}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </button>
          </li>
          <li>
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              <span className="flex-1 text-sm font-medium text-neutral-900">{PLACES_DESKTOP_NAV_VISITED}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </button>
          </li>
        </ul>
      </section>

      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="places-discover-title">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
          <h2 id="places-discover-title" className="text-sm font-bold text-neutral-900">
            {PLACES_DESKTOP_DISCOVER_TITLE}
          </h2>
        </div>

        {discoverRows.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {discoverRows.map((row) => (
              <li key={row.id}>
                <Link href={row.href} className="flex gap-3 px-4 py-3 transition hover:bg-neutral-50">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                    <CulturalImage
                      src={row.imageUrl}
                      alt=""
                      placeName={row.title}
                      className="absolute inset-0 size-full"
                      sizes="48px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{row.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{row.metaLine}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-neutral-500">La sélection du jour arrive bientôt.</p>
        )}

        <div className="border-t border-neutral-100 p-3">
          <Link
            href={`/places?city=${encodeURIComponent(city)}#places-desktop-selection`}
            className="inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PLACES_DESKTOP_DISCOVER_VIEW_ALL}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="places-trust-title">
        <div className="flex items-start gap-2 border-b border-neutral-100 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-yunicity-primary" aria-hidden />
          <h2 id="places-trust-title" className="text-sm font-bold text-neutral-900">
            {PLACES_DESKTOP_TRUST_TITLE}
          </h2>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm leading-relaxed text-neutral-600">{PLACES_DESKTOP_TRUST_BODY}</p>
          <Link
            href={placesDesktopMapHref(city)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PLACES_DESKTOP_TRUST_CTA}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </aside>
  );
}
