"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopAroundPreview } from "@yunicity/utils";
import {
  PLACES_DESKTOP_AROUND_ACTIVE,
  PLACES_DESKTOP_AROUND_BODY,
  PLACES_DESKTOP_AROUND_CTA,
  PLACES_DESKTOP_AROUND_OPEN_MAP,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type PlacesDesktopAroundPreviewProps = {
  geolocationEnabled: boolean;
  preview: PlacesDesktopAroundPreview;
  onEnableGeolocation: () => void;
};

export function PlacesDesktopAroundPreviewBlock({
  geolocationEnabled,
  preview,
  onEnableGeolocation,
}: PlacesDesktopAroundPreviewProps) {
  const previewBody = (
    <div className="relative h-28 overflow-hidden rounded-xl bg-neutral-200">
      <CulturalImage
        src={preview.illustrationUrl}
        alt=""
        placeName="Reims"
        className="absolute inset-0 size-full"
        sizes="284px"
        showFallbackCaption={false}
        dimOverlay={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/5" aria-hidden />

      {geolocationEnabled ? (
        <>
          <span className="absolute left-1/2 top-1/2 z-10 inline-flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg ring-4 ring-white/80">
            <MapPin className="h-4 w-4" aria-hidden />
          </span>
          {preview.markers.map((marker) => (
            <Link
              key={marker.id}
              href={marker.href}
              title={marker.label}
              className="absolute z-20 block -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${marker.leftPct}%`, top: `${marker.topPct}%` }}
            >
              <span className="relative block h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md">
                <CulturalImage
                  src={marker.imageUrl}
                  alt=""
                  placeName={marker.label}
                  className="absolute inset-0 size-full"
                  sizes="36px"
                  showFallbackCaption={false}
                  dimOverlay={false}
                />
              </span>
            </Link>
          ))}
        </>
      ) : (
        <span className="absolute bottom-4 left-1/2 z-10 inline-flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg ring-4 ring-white/70">
          <MapPin className="h-5 w-5" aria-hidden />
        </span>
      )}
    </div>
  );

  return (
    <>
      {geolocationEnabled ? (
        <Link href={preview.mapHref} className="mb-4 block transition hover:opacity-95">
          {previewBody}
        </Link>
      ) : (
        <div className="mb-4">{previewBody}</div>
      )}

      <p className="text-sm leading-relaxed text-neutral-600">
        {geolocationEnabled ? PLACES_DESKTOP_AROUND_ACTIVE : PLACES_DESKTOP_AROUND_BODY}
      </p>

      {geolocationEnabled ? (
        <Link
          href={preview.mapHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary/30 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
        >
          {PLACES_DESKTOP_AROUND_OPEN_MAP}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onEnableGeolocation}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
        >
          {PLACES_DESKTOP_AROUND_CTA}
        </button>
      )}
    </>
  );
}
