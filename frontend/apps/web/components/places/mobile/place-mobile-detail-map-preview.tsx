"use client";

import {
  PLACE_DETAIL_MOBILE_MAP_CTA,
  PLACE_DETAIL_MOBILE_MAP_LOCATE,
} from "@yunicity/utils";
import { Crosshair, MapPin } from "lucide-react";
import Link from "next/link";

type PlaceMobileDetailMapPreviewProps = {
  mapHref: string;
  placeName: string;
};

/** Aperçu carte détail lieu mobile (MOBILE-LIEUX-02). */
export function PlaceMobileDetailMapPreview({ mapHref, placeName }: PlaceMobileDetailMapPreviewProps) {
  return (
    <section className="space-y-2" aria-label="Localisation">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <Link
          href={mapHref}
          className="relative block aspect-[16/10] bg-[linear-gradient(135deg,#E8F4FC_0%,#D4E8F7_50%,#C5DCF0_100%)]"
        >
          <div className="absolute inset-0 opacity-25" aria-hidden>
            <svg viewBox="0 0 120 120" className="h-full w-full text-sky-200/80">
              <path
                d="M0 40h120M0 80h120M40 0v120M80 0v120"
                stroke="currentColor"
                strokeWidth="0.5"
                fill="none"
              />
            </svg>
          </div>
          <span className="absolute left-1/2 top-1/2 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg ring-4 ring-yunicity-primary/20">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <span className="sr-only">{placeName}</span>
        </Link>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <Link
            href={mapHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-yunicity-primary shadow-md"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {PLACE_DETAIL_MOBILE_MAP_CTA}
          </Link>
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_MOBILE_MAP_LOCATE}
            aria-label={PLACE_DETAIL_MOBILE_MAP_LOCATE}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 opacity-50 shadow-md"
          >
            <Crosshair className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
