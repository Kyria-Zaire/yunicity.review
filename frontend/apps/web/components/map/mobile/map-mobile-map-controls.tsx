"use client";

import { MAP_MOBILE_LOCATE_ARIA, MAP_MOBILE_NAVIGATE_ARIA } from "@yunicity/utils";
import { Crosshair, Navigation } from "lucide-react";

type MapMobileMapControlsProps = {
  onLocate: () => void;
  onNavigate: () => void;
  bottomOffsetClass?: string;
};

/** FABs carte mobile — position · itinéraire (MOBILE-MAP-01). */
export function MapMobileMapControls({
  onLocate,
  onNavigate,
  bottomOffsetClass = "bottom-[13.5rem]",
}: MapMobileMapControlsProps) {
  return (
    <div
      className={`pointer-events-none absolute right-3 z-10 flex flex-col gap-2 ${bottomOffsetClass}`}
    >
      <button
        type="button"
        onClick={onLocate}
        aria-label={MAP_MOBILE_LOCATE_ARIA}
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-yunicity-primary shadow-lg transition hover:bg-yunicity-primary-soft"
      >
        <Crosshair className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onNavigate}
        aria-label={MAP_MOBILE_NAVIGATE_ARIA}
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-yunicity-primary shadow-lg transition hover:bg-yunicity-primary-soft"
      >
        <Navigation className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
