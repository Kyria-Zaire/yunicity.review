"use client";

import {
  PLACES_DESKTOP_TRUST_BODY,
  PLACES_DESKTOP_TRUST_CTA,
  PLACES_DESKTOP_TRUST_TITLE,
  placesDesktopMapHref,
} from "@yunicity/utils";
import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

type PlacesMediumTrustBannerProps = {
  city: string;
};

export function PlacesMediumTrustBanner({ city }: PlacesMediumTrustBannerProps) {
  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-yunicity-primary/15 bg-[#EEF0FF] p-4 sm:flex-row sm:items-center sm:gap-4"
      aria-labelledby="places-medium-trust-title"
      data-places-medium-trust=""
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-yunicity-primary shadow-sm">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="places-medium-trust-title" className="text-sm font-bold text-neutral-900">
          {PLACES_DESKTOP_TRUST_TITLE}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{PLACES_DESKTOP_TRUST_BODY}</p>
      </div>
      <Link
        href={placesDesktopMapHref(city)}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {PLACES_DESKTOP_TRUST_CTA}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
