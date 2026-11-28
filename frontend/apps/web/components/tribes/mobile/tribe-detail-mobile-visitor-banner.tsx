"use client";

import { TRIBE_DETAIL_MOBILE_VISITOR_BANNER } from "@yunicity/utils";
import { Users } from "lucide-react";

export function TribeDetailMobileVisitorBanner() {
  return (
    <div
      className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4"
      data-tribe-detail-mobile-visitor-banner=""
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
        <Users className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-sm leading-relaxed text-neutral-700">{TRIBE_DETAIL_MOBILE_VISITOR_BANNER}</p>
    </div>
  );
}
