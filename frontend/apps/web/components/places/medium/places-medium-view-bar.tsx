"use client";

import { PLACES_DESKTOP_CTA_EXPLORE, PLACES_DESKTOP_CTA_MAP, placesDesktopMapHref } from "@yunicity/utils";
import { Compass, Map } from "lucide-react";
import Link from "next/link";

type PlacesMediumViewBarProps = {
  city: string;
};

export function PlacesMediumViewBar({ city }: PlacesMediumViewBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2" data-places-medium-view-bar="">
      <a
        href="#places-medium-selection"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
      >
        <Compass className="h-4 w-4" aria-hidden />
        {PLACES_DESKTOP_CTA_EXPLORE}
      </a>
      <Link
        href={placesDesktopMapHref(city)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
      >
        <Map className="h-4 w-4" aria-hidden />
        {PLACES_DESKTOP_CTA_MAP}
      </Link>
    </div>
  );
}
