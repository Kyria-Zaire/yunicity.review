"use client";

import {
  PLACE_DETAIL_MOBILE_RELATION_EMPTY,
  PLACE_DETAIL_MOBILE_RELATION_TITLE,
  PLACE_DETAIL_MOBILE_SAVE,
  PLACE_DETAIL_MOBILE_SAVE_SOON,
  PLACE_DETAIL_MOBILE_VISITED,
  PLACE_DETAIL_MOBILE_VISITED_SOON,
} from "@yunicity/utils";
import { Bookmark, CheckCircle2 } from "lucide-react";

export function PlaceMobileDetailRelationCard() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-place-mobile-detail-relation=""
    >
      <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_RELATION_TITLE}
      </h2>
      <div className="space-y-3 p-4">
        <p className="text-sm text-neutral-600">{PLACE_DETAIL_MOBILE_RELATION_EMPTY}</p>
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MOBILE_SAVE_SOON}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MOBILE_SAVE}
        </button>
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MOBILE_VISITED_SOON}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MOBILE_VISITED}
        </button>
      </div>
    </section>
  );
}
