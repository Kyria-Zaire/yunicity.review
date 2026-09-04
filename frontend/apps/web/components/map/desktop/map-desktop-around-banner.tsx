"use client";

import type { MapAroundYouItem } from "@yunicity/utils";
import {
  MAP_PORTAL_AROUND_EMPTY,
  MAP_PORTAL_AROUND_SEE_ALL,
  MAP_PORTAL_AROUND_TITLE,
} from "@yunicity/utils";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

type MapDesktopAroundBannerProps = {
  items: MapAroundYouItem[];
  maxDistanceKm: number;
  onSelectItem: (item: MapAroundYouItem) => void;
};

function buildSubtitle(count: number, maxDistanceKm: number): string {
  if (count === 0) return MAP_PORTAL_AROUND_EMPTY;
  if (count === 1) return `1 lieu ou moment à moins de ${maxDistanceKm} km`;
  return `${count} lieux et moments à moins de ${maxDistanceKm} km`;
}

export function MapDesktopAroundBanner({
  items,
  maxDistanceKm,
  onSelectItem,
}: MapDesktopAroundBannerProps) {
  const preview = items.slice(0, 3);

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10">
      <div
        className="pointer-events-auto rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-lg"
        data-map-desktop-around-banner=""
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary/10 text-yunicity-primary">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-neutral-950">{MAP_PORTAL_AROUND_TITLE}</h2>
              <Link
                href="/events"
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-yunicity-primary hover:underline"
              >
                {MAP_PORTAL_AROUND_SEE_ALL}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">
              {buildSubtitle(items.length, maxDistanceKm)}
            </p>
            {preview.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {preview.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
