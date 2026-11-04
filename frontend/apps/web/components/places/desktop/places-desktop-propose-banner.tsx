"use client";

import {
  PLACES_DESKTOP_PROPOSE_BODY,
  PLACES_DESKTOP_PROPOSE_CTA,
  placesDesktopProposeHref,
} from "@yunicity/utils";
import { HeartHandshake } from "lucide-react";
import Link from "next/link";

export function PlacesDesktopProposeBanner() {
  return (
    <section
      className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-yunicity-primary/15 bg-[#EEF0FF] px-5 py-4 sm:flex-row sm:items-center"
      aria-label="Contribuer"
      data-places-desktop-propose=""
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-yunicity-primary shadow-sm">
          <HeartHandshake className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-neutral-800">{PLACES_DESKTOP_PROPOSE_BODY}</p>
      </div>
      <Link
        href={placesDesktopProposeHref()}
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-yunicity-primary/40 bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-white"
      >
        {PLACES_DESKTOP_PROPOSE_CTA}
      </Link>
    </section>
  );
}
