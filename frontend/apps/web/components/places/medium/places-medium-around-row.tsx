"use client";

import { PlacesDesktopAroundPreviewBlock } from "@/components/places/desktop/places-desktop-around-preview";
import type { PlacesDesktopAroundPreview } from "@yunicity/utils";
import {
  PLACES_DESKTOP_NAV_SAVED,
  PLACES_DESKTOP_NAV_VISITED,
  PLACES_DESKTOP_YOUR_PLACES_TITLE,
} from "@yunicity/utils";
import { Bookmark, CheckCircle2, ChevronRight } from "lucide-react";

type PlacesMediumAroundRowProps = {
  geolocationEnabled: boolean;
  aroundPreview: PlacesDesktopAroundPreview;
  onEnableGeolocation: () => void;
};

export function PlacesMediumAroundRow({
  geolocationEnabled,
  aroundPreview,
  onEnableGeolocation,
}: PlacesMediumAroundRowProps) {
  return (
    <div className="places-medium-around-row grid gap-4 sm:grid-cols-2" data-places-medium-around-row="">
      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="places-medium-around-title">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 id="places-medium-around-title" className="text-sm font-bold text-neutral-900">
            Autour de vous
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

      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="places-medium-your-places-title">
        <h2
          id="places-medium-your-places-title"
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
    </div>
  );
}
