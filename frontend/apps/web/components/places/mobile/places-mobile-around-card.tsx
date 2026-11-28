"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopAroundPreview } from "@yunicity/utils";
import {
  PLACES_DESKTOP_AROUND_BODY,
  PLACES_DESKTOP_AROUND_CTA,
  PLACES_DESKTOP_AROUND_OPEN_MAP,
  PLACES_DESKTOP_AROUND_TITLE,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type PlacesMobileAroundCardProps = {
  geolocationEnabled: boolean;
  preview: PlacesDesktopAroundPreview;
  onEnableGeolocation: () => void;
};

export function PlacesMobileAroundCard({
  geolocationEnabled,
  preview,
  onEnableGeolocation,
}: PlacesMobileAroundCardProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      aria-labelledby="places-mobile-around-title"
      data-places-mobile-around=""
    >
      <h2
        id="places-mobile-around-title"
        className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
      >
        {PLACES_DESKTOP_AROUND_TITLE}
      </h2>
      <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] items-center gap-3 p-4">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200">
          <CulturalImage
            src={preview.illustrationUrl}
            alt=""
            placeName="Reims"
            className="absolute inset-0 size-full"
            sizes="160px"
            showFallbackCaption={false}
            dimOverlay={false}
          />
          <span className="absolute bottom-3 left-1/2 z-10 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg ring-4 ring-white/80">
            <MapPin className="h-4 w-4" aria-hidden />
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-neutral-600">{PLACES_DESKTOP_AROUND_BODY}</p>
          {geolocationEnabled ? (
            <Link
              href={preview.mapHref}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary/30 px-3 py-2.5 text-sm font-semibold text-yunicity-primary"
            >
              {PLACES_DESKTOP_AROUND_OPEN_MAP}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onEnableGeolocation}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-3 py-2.5 text-sm font-semibold text-white"
            >
              {PLACES_DESKTOP_AROUND_CTA}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
