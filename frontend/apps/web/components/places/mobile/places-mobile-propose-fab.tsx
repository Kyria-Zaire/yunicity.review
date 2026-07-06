"use client";

import { PLACES_MOBILE_PROPOSE_LABEL } from "@yunicity/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

/** FAB « Proposer un lieu » mobile (MOBILE-LIEUX-01). */
export function PlacesMobileProposeFab() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-[calc(var(--z-chrome)-1)] flex justify-end px-4"
      aria-hidden={false}
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <Link
          href="/organizations/request"
          className="rounded-full border border-neutral-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary shadow-lg"
        >
          {PLACES_MOBILE_PROPOSE_LABEL}
        </Link>
        <Link
          href="/organizations/request"
          aria-label={PLACES_MOBILE_PROPOSE_LABEL}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg"
        >
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
