"use client";

import {
  PLACES_MOBILE_TRUST_BODY,
  PLACES_MOBILE_TRUST_CTA,
  placesDesktopMapHref,
} from "@yunicity/utils";
import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

type PlacesMobileTrustBannerProps = {
  city: string;
};

export function PlacesMobileTrustBanner({ city }: PlacesMobileTrustBannerProps) {
  return (
    <section
      className="flex items-center gap-3 rounded-2xl border border-yunicity-primary/15 bg-[#EEF0FF] px-3 py-3"
      aria-label="Informations fiables"
      data-places-mobile-trust=""
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-yunicity-primary shadow-sm">
        <ShieldCheck className="h-4 w-4" aria-hidden />
      </span>
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-neutral-700 sm:text-sm">{PLACES_MOBILE_TRUST_BODY}</p>
      <Link
        href={placesDesktopMapHref(city)}
        className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-yunicity-primary"
      >
        {PLACES_MOBILE_TRUST_CTA}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}
