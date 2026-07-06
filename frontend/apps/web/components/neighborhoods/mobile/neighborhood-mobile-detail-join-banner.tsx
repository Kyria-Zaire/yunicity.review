"use client";

import {
  NEIGHBORHOOD_DETAIL_MOBILE_JOIN_BODY,
  NEIGHBORHOOD_DETAIL_MOBILE_JOIN_CTA,
  NEIGHBORHOOD_DETAIL_MOBILE_JOIN_TITLE,
} from "@yunicity/utils";
import { Shield } from "lucide-react";

type NeighborhoodMobileDetailJoinBannerProps = {
  displayName: string;
  onJoin: () => void;
  joining?: boolean;
};

/** CTA rejoindre le quartier mobile (MOBILE-QUARTIERS-02). */
export function NeighborhoodMobileDetailJoinBanner({
  displayName,
  onJoin,
  joining = false,
}: NeighborhoodMobileDetailJoinBannerProps) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-yunicity-primary shadow-sm">
          <Shield className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-neutral-900">
            {NEIGHBORHOOD_DETAIL_MOBILE_JOIN_TITLE(displayName)}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
            {NEIGHBORHOOD_DETAIL_MOBILE_JOIN_BODY}
          </p>
        </div>
        <button
          type="button"
          disabled={joining}
          onClick={onJoin}
          className="shrink-0 rounded-full bg-yunicity-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-yunicity-primary/90 disabled:opacity-60"
        >
          {joining ? "…" : NEIGHBORHOOD_DETAIL_MOBILE_JOIN_CTA}
        </button>
      </div>
    </section>
  );
}
